"""
Triggers AI matching after a job becomes active and sends notifications to:
  - The job creator (recruiter/client): top candidate matches found
  - Matched candidates: a new job matches their skills

Two tiers:
  AUTO_SHORTLIST_THRESHOLD (90+): automatically creates/updates the application to
    'shortlisted' and sends a "ready to schedule interview" notification to the client
    with a direct link to the application page.
  MATCH_THRESHOLD (70–89): notify-only — no status change.
"""
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional

from app.models.job import Job
from app.models.candidate import Candidate
from app.models.user import User
from app.models.application import Application, ApplicationStatus, ApplicationSource
from app.services.ai_matching import AIMatchingService
from app.services.notification_service import NotificationService
from app.services.notification_preference_service import NotificationPreferenceService

MATCH_THRESHOLD = 70          # Minimum score to notify at all
AUTO_SHORTLIST_THRESHOLD = 90  # Score that triggers auto-shortlist
MAX_CANDIDATES_NOTIFIED = 10  # Limit candidate notifications per job


async def _find_or_create_application(
    db: AsyncSession,
    job: Job,
    candidate: Candidate,
    score: int,
) -> Optional[Application]:
    """
    Return an existing application for (candidate, job), or create a new one
    already in 'shortlisted' state.  If an existing application is already past
    'shortlisted' (e.g. interviewed, offered) we leave it alone and return None
    so we don't accidentally regress its status.
    """
    result = await db.execute(
        select(Application).where(
            Application.candidate_id == candidate.id,
            Application.job_id == job.id,
        )
    )
    app: Optional[Application] = result.scalar_one_or_none()

    early_statuses = {
        ApplicationStatus.applied,
        ApplicationStatus.screening,
    }

    if app:
        # Only auto-shortlist if the application is still in an early stage
        if app.status not in early_statuses and app.status != ApplicationStatus.shortlisted:
            return None  # already further along — don't touch it
        if app.status in early_statuses:
            app.status = ApplicationStatus.shortlisted
            app.match_score = score
            app.screening_score = score
            app.screening_passed = True
            app.screening_notes = f"Auto-shortlisted by AI (match score: {score}%)"
            app.screened_at = datetime.utcnow()
            app.updated_at = datetime.utcnow()
        # If already shortlisted just return it (idempotent)
        await db.flush()
        return app

    # Create a brand-new application in shortlisted state
    new_app = Application(
        agency_id=job.agency_id,
        job_id=job.id,
        candidate_id=candidate.id,
        client_company_id=getattr(job, "client_company_id", None),
        status=ApplicationStatus.shortlisted,
        source=ApplicationSource.direct,
        match_score=score,
        screening_score=score,
        screening_passed=True,
        screening_notes=f"Auto-shortlisted by AI (match score: {score}%)",
        screened_at=datetime.utcnow(),
    )
    db.add(new_app)
    await db.flush()          # assigns the UUID without committing
    await db.refresh(new_app)
    return new_app


async def send_ai_match_notifications(db: AsyncSession, job: Job) -> None:
    """
    Run AI matching for a newly active job and send in-app notifications.
    Called as a background task so it never blocks the API response.
    """
    # Fetch all candidates in the same agency that have a linked user account
    candidates_result = await db.execute(
        select(Candidate).where(
            Candidate.agency_id == job.agency_id,
            Candidate.user_id.isnot(None),
        )
    )
    candidates: List[Candidate] = candidates_result.scalars().all()

    if not candidates:
        return

    matches = AIMatchingService.get_matches_for_job(job, candidates)
    top_matches = [m for m in matches if m["score"]["overall_score"] >= MATCH_THRESHOLD]

    if not top_matches:
        return

    # Split into two tiers
    auto_shortlist_matches = [m for m in top_matches if m["score"]["overall_score"] >= AUTO_SHORTLIST_THRESHOLD]
    notify_only_matches   = [m for m in top_matches if m["score"]["overall_score"] < AUTO_SHORTLIST_THRESHOLD]

    # ---------------------------------------------------------------
    # TIER 1: Auto-shortlist (90+)
    # ---------------------------------------------------------------
    auto_shortlisted_apps: list[tuple[dict, Application]] = []

    for match in auto_shortlist_matches:
        candidate_result = await db.execute(
            select(Candidate).where(Candidate.id == match["candidate_id"])
        )
        candidate = candidate_result.scalar_one_or_none()
        if not candidate or not candidate.user_id:
            continue

        score = round(match["score"]["overall_score"])
        app = await _find_or_create_application(db, job, candidate, score)
        if app:
            auto_shortlisted_apps.append((match, app, candidate))

    # Commit all shortlist changes in one go
    if auto_shortlisted_apps:
        await db.commit()

    # Send individual notifications for each auto-shortlisted candidate
    notified = 0
    for match, app, candidate in auto_shortlisted_apps:
        score = round(match["score"]["overall_score"])

        # -- Client/recruiter: direct link to schedule interview --
        if job.created_by:
            creator_wants = await NotificationPreferenceService.should_notify(
                db, job.created_by, "inapp", "ai_match"
            )
            if creator_wants:
                await NotificationService.create_notification(
                    db=db,
                    user_id=job.created_by,
                    title=f"⚡ Auto-shortlisted: {match['candidate_name']}",
                    message=(
                        f"{score}% match for {job.title}. "
                        "Auto-shortlisted by AI — ready to schedule interview."
                    ),
                    notification_type="ai_match",
                    link=f"/applications/{app.id}",
                    metadata={
                        "job_id": str(job.id),
                        "application_id": str(app.id),
                        "match_score": score,
                        "auto_shortlisted": True,
                    },
                )

        # -- Candidate: "you've been shortlisted" --
        if notified < MAX_CANDIDATES_NOTIFIED:
            candidate_wants = await NotificationPreferenceService.should_notify(
                db, candidate.user_id, "inapp", "ai_match"
            )
            if candidate_wants:
                await NotificationService.create_notification(
                    db=db,
                    user_id=candidate.user_id,
                    title=f"You've been shortlisted for {job.title}!",
                    message=(
                        f"Great news — your profile is a {score}% match and you've been "
                        "automatically shortlisted. The employer will be in touch soon."
                    ),
                    notification_type="ai_match",
                    link=f"/jobs/{job.id}",
                    metadata={"job_id": str(job.id), "match_score": score},
                )
                notified += 1

    # ---------------------------------------------------------------
    # TIER 2: Notify-only (70–89) — existing behaviour
    # ---------------------------------------------------------------
    if notify_only_matches and job.created_by:
        creator_wants = await NotificationPreferenceService.should_notify(
            db, job.created_by, "inapp", "ai_match"
        )
        if creator_wants:
            count = len(notify_only_matches)
            names = ", ".join(m["candidate_name"] for m in notify_only_matches[:3])
            suffix = f" and {count - 3} more" if count > 3 else ""
            await NotificationService.create_notification(
                db=db,
                user_id=job.created_by,
                title=f"AI found {count} strong match{'es' if count != 1 else ''} for {job.title}",
                message=f"{names}{suffix} scored 70–89%. Review them in the pipeline.",
                notification_type="ai_match",
                link=f"/jobs/{job.id}/kanban",
                metadata={"job_id": str(job.id), "match_count": count},
            )

    for match in notify_only_matches:
        if notified >= MAX_CANDIDATES_NOTIFIED:
            break

        candidate_result = await db.execute(
            select(Candidate).where(Candidate.id == match["candidate_id"])
        )
        candidate = candidate_result.scalar_one_or_none()
        if not candidate or not candidate.user_id:
            continue

        candidate_wants = await NotificationPreferenceService.should_notify(
            db, candidate.user_id, "inapp", "ai_match"
        )
        if not candidate_wants:
            continue

        score = round(match["score"]["overall_score"])
        await NotificationService.create_notification(
            db=db,
            user_id=candidate.user_id,
            title=f"New job match: {job.title}",
            message=(
                f"You're a {score}% match for {job.title}. "
                f"{'Remote position. ' if job.is_remote else ''}"
                "Check it out and apply today!"
            ),
            notification_type="ai_match",
            link=f"/jobs/{job.id}",
            metadata={"job_id": str(job.id), "match_score": score},
        )
        notified += 1
