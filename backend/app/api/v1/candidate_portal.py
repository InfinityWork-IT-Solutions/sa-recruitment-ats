"""
Candidate Portal endpoints — self-service routes for logged-in candidates.

All routes here are for the candidate themselves (current_user must have role=candidate).
Prefix: /candidate-portal
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from uuid import UUID
import os, shutil, uuid as uuid_mod
from pathlib import Path

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import User, UserRole, Application, Job
from app.models.saved_job import SavedJob
from app.models.job_alert import JobAlert
from app.models.candidate import Candidate
from app.schemas.job import JobResponse
from app.schemas.application import ApplicationResponse
from app.services.candidate_service import candidate_service
# ai_resume_parser imported lazily inside endpoints to avoid hard dependency at module load time
from pydantic import BaseModel, Field
from datetime import datetime

router = APIRouter()

UPLOAD_DIR = Path("uploads/resumes")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _require_candidate(current_user: User):
    if current_user.role not in [UserRole.candidate, UserRole.super_admin]:
        raise HTTPException(status_code=403, detail="Candidate access required")
    return current_user


# ─── Saved Jobs ───────────────────────────────────────────────────────────────

class SavedJobOut(BaseModel):
    id: UUID
    job_id: UUID
    saved_at: datetime
    job: JobResponse

    class Config:
        from_attributes = True


@router.get("/saved-jobs", response_model=List[SavedJobOut])
async def list_saved_jobs(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _require_candidate(current_user)
    result = await db.execute(
        select(SavedJob).where(SavedJob.candidate_user_id == current_user.id)
        .order_by(SavedJob.saved_at.desc())
    )
    return result.scalars().all()


# NOTE: /saved-jobs/ids MUST be registered before /saved-jobs/{job_id} so
# FastAPI doesn't try to parse "ids" as a UUID path parameter.
@router.get("/saved-jobs/ids", response_model=List[str])
async def list_saved_job_ids(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Return just the job IDs the candidate has saved (for UI state)."""
    _require_candidate(current_user)
    result = await db.execute(
        select(SavedJob.job_id).where(SavedJob.candidate_user_id == current_user.id)
    )
    return [str(r) for r in result.scalars().all()]


@router.post("/saved-jobs/{job_id}", status_code=201)
async def save_job(
    job_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _require_candidate(current_user)
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    existing = await db.execute(
        select(SavedJob).where(
            SavedJob.candidate_user_id == current_user.id,
            SavedJob.job_id == job_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Job already saved")
    db.add(SavedJob(candidate_user_id=current_user.id, job_id=job_id))
    await db.commit()
    return {"message": "Job saved"}


@router.delete("/saved-jobs/{job_id}", status_code=200)
async def unsave_job(
    job_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _require_candidate(current_user)
    await db.execute(
        delete(SavedJob).where(
            SavedJob.candidate_user_id == current_user.id,
            SavedJob.job_id == job_id,
        )
    )
    await db.commit()
    return {"message": "Job removed from saved"}


# ─── Job Alerts ───────────────────────────────────────────────────────────────

class JobAlertCreate(BaseModel):
    name: str = Field(..., max_length=200)
    keywords: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    salary_min: Optional[int] = None
    frequency: str = "daily"


class JobAlertOut(BaseModel):
    id: UUID
    name: str
    keywords: Optional[str]
    location: Optional[str]
    employment_type: Optional[str]
    salary_min: Optional[int]
    frequency: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/job-alerts", response_model=List[JobAlertOut])
async def list_job_alerts(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _require_candidate(current_user)
    result = await db.execute(
        select(JobAlert).where(JobAlert.candidate_user_id == current_user.id)
        .order_by(JobAlert.created_at.desc())
    )
    return result.scalars().all()


@router.post("/job-alerts", response_model=JobAlertOut, status_code=201)
async def create_job_alert(
    data: JobAlertCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _require_candidate(current_user)
    alert = JobAlert(candidate_user_id=current_user.id, **data.model_dump())
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return alert


@router.patch("/job-alerts/{alert_id}", response_model=JobAlertOut)
async def update_job_alert(
    alert_id: UUID,
    data: JobAlertCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _require_candidate(current_user)
    alert = await db.get(JobAlert, alert_id)
    if not alert or alert.candidate_user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Alert not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(alert, k, v)
    await db.commit()
    await db.refresh(alert)
    return alert


@router.delete("/job-alerts/{alert_id}", status_code=200)
async def delete_job_alert(
    alert_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _require_candidate(current_user)
    alert = await db.get(JobAlert, alert_id)
    if not alert or alert.candidate_user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Alert not found")
    await db.delete(alert)
    await db.commit()
    return {"message": "Alert deleted"}


# ─── My Applications ──────────────────────────────────────────────────────────

class CandidateApplicationOut(BaseModel):
    id: UUID
    job_id: UUID
    job_title: Optional[str] = None
    job_location: Optional[str] = None
    status: str
    match_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    interview_scheduled_at: Optional[datetime] = None
    offer_amount: Optional[float] = None
    offer_currency: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/my-applications", response_model=List[CandidateApplicationOut])
async def list_my_applications(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all applications for the logged-in candidate."""
    _require_candidate(current_user)
    # Find candidate record linked to this user
    cand_result = await db.execute(
        select(Candidate).where(Candidate.user_id == current_user.id)
    )
    candidate = cand_result.scalar_one_or_none()
    if not candidate:
        return []

    result = await db.execute(
        select(Application, Job.title, Job.location)
        .join(Job, Application.job_id == Job.id)
        .where(Application.candidate_id == candidate.id)
        .order_by(Application.updated_at.desc())
    )
    rows = result.all()
    out = []
    for app, job_title, job_location in rows:
        out.append(CandidateApplicationOut(
            id=app.id,
            job_id=app.job_id,
            job_title=job_title,
            job_location=job_location,
            status=app.status.value if hasattr(app.status, 'value') else str(app.status),
            match_score=app.match_score,
            created_at=app.created_at,
            updated_at=app.updated_at,
            interview_scheduled_at=app.interview_scheduled_at,
            offer_amount=app.offer_amount,
            offer_currency=app.offer_currency if hasattr(app, 'offer_currency') else None,
        ))
    return out


# ─── CV Upload (self-service) ─────────────────────────────────────────────────

class CVParseResult(BaseModel):
    message: str
    parsed_data: Optional[dict] = None
    resume_url: Optional[str] = None


@router.post("/upload-cv", response_model=CVParseResult)
async def upload_my_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _require_candidate(current_user)
    cand_result = await db.execute(
        select(Candidate).where(Candidate.user_id == current_user.id)
    )
    candidate = cand_result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found. Please complete your profile first.")

    ext = Path(file.filename or "cv.pdf").suffix.lower()
    if ext not in [".pdf", ".doc", ".docx"]:
        raise HTTPException(status_code=422, detail="Only PDF, DOC, and DOCX files are supported")

    filename = f"{uuid_mod.uuid4()}{ext}"
    dest = UPLOAD_DIR / filename
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    resume_url = f"/uploads/resumes/{filename}"
    parsed_data = None
    try:
        from app.services.ai_resume_parser import ai_resume_parser
        resume_text = await ai_resume_parser.extract_text_from_file(str(dest))
        parsed_data = await ai_resume_parser.parse_resume_with_ai(resume_text)
    except Exception:
        pass

    candidate.resume_filename = file.filename
    candidate.resume_url = resume_url
    if parsed_data:
        candidate.resume_parsed_data = parsed_data
        candidate.resume_text = parsed_data.get("summary", "")
        if parsed_data.get("skills"):
            candidate.skills = parsed_data["skills"]
        if parsed_data.get("years_of_experience") is not None:
            candidate.years_of_experience = parsed_data["years_of_experience"]

    await db.commit()
    return CVParseResult(message="CV uploaded and parsed successfully", parsed_data=parsed_data, resume_url=resume_url)


# ─── Match Score ──────────────────────────────────────────────────────────────

class MatchScoreOut(BaseModel):
    job_id: str
    score: int
    explanation: Optional[str] = None


@router.get("/match-score/{job_id}", response_model=MatchScoreOut)
async def get_my_match_score(
    job_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Return AI match score between the logged-in candidate and a job."""
    _require_candidate(current_user)
    cand_result = await db.execute(
        select(Candidate).where(Candidate.user_id == current_user.id)
    )
    candidate = cand_result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    try:
        from app.services.ai_resume_parser import ai_resume_parser
        candidate_data = {
            "skills": candidate.skills or [],
            "years_of_experience": candidate.years_of_experience or 0,
            "education_level": candidate.education_level or "",
            "current_job_title": candidate.current_job_title or "",
        }
        job_data = {
            "title": job.title,
            "skills": job.skills or [],
            "years_of_experience_min": job.years_of_experience_min,
            "years_of_experience_max": job.years_of_experience_max,
            "education_level": job.education_level or "",
        }
        result = await ai_resume_parser.calculate_job_match_score(candidate_data, job_data)
        score = result.get("score", 0) if isinstance(result, dict) else int(result)
        explanation = result.get("explanation") if isinstance(result, dict) else None
    except Exception:
        score = 0
        explanation = None

    return MatchScoreOut(job_id=str(job_id), score=score, explanation=explanation)


# ─── Interview Prep ───────────────────────────────────────────────────────────

class InterviewPrepOut(BaseModel):
    questions: List[str]
    tips: List[str]


@router.get("/interview-prep/{application_id}", response_model=InterviewPrepOut)
async def get_interview_prep(
    application_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate AI interview prep questions for a specific application."""
    _require_candidate(current_user)
    cand_result = await db.execute(
        select(Candidate).where(Candidate.user_id == current_user.id)
    )
    candidate = cand_result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    result = await db.execute(
        select(Application, Job)
        .join(Job, Application.job_id == Job.id)
        .where(Application.id == application_id, Application.candidate_id == candidate.id)
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")

    app, job = row
    try:
        from app.services.ai_generation_service import generate_interview_questions
        questions_raw = await generate_interview_questions(
            job_title=job.title,
            required_skills=job.skills or [],
            candidate_skills=candidate.skills or [],
            interview_round="general",
        )
        if isinstance(questions_raw, list):
            questions = questions_raw
        elif isinstance(questions_raw, dict):
            questions = questions_raw.get("questions", [])
        else:
            questions = []
    except Exception:
        questions = [
            f"Tell me about your experience with {', '.join((job.skills or [])[:3]) or 'relevant technologies'}.",
            f"Why are you interested in the {job.title} role?",
            "Describe a challenging project you worked on and how you handled it.",
            "Where do you see yourself in 3-5 years?",
            "What is your greatest professional strength?",
        ]

    tips = [
        "Research the company before your interview.",
        "Prepare 2-3 questions to ask the interviewer.",
        "Use the STAR method (Situation, Task, Action, Result) for behavioural questions.",
        "Dress professionally and arrive 10 minutes early.",
    ]

    return InterviewPrepOut(questions=questions, tips=tips)


# ─── Profile get + update (self-service) ─────────────────────────────────────

@router.get("/profile")
async def get_my_profile(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the candidate's own profile data."""
    _require_candidate(current_user)
    cand_result = await db.execute(
        select(Candidate).where(Candidate.user_id == current_user.id)
    )
    candidate = cand_result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    return {
        "id": str(candidate.id),
        "first_name": candidate.first_name,
        "last_name": candidate.last_name,
        "email": candidate.email,
        "phone": candidate.phone,
        "city": candidate.city,
        "province": candidate.province,
        "current_job_title": candidate.current_job_title,
        "current_company": candidate.current_company,
        "years_of_experience": candidate.years_of_experience,
        "skills": candidate.skills or [],
        "education_level": candidate.education_level,
        "education_details": candidate.education_details or [],
        "certifications": candidate.certifications or [],
        "summary": candidate.summary,
        "work_history": candidate.work_history or [],
        "resume_url": candidate.resume_url,
        "resume_filename": candidate.resume_filename,
        "linkedin_url": candidate.linkedin_url,
        "portfolio_url": candidate.portfolio_url,
        "notice_period_days": candidate.notice_period_days,
        "expected_salary_min": candidate.expected_salary_min,
        "expected_salary_max": candidate.expected_salary_max,
    }



class CandidateProfileUpdate(BaseModel):
    summary: Optional[str] = None
    skills: Optional[List[str]] = None
    work_history: Optional[List[dict]] = None
    education_level: Optional[str] = None
    education_details: Optional[List[dict]] = None
    current_job_title: Optional[str] = None
    current_company: Optional[str] = None
    years_of_experience: Optional[int] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    employment_type_preference: Optional[str] = None
    notice_period_days: Optional[int] = None
    expected_salary_min: Optional[int] = None
    expected_salary_max: Optional[int] = None
    certifications: Optional[List[str]] = None


@router.patch("/profile", status_code=200)
async def update_my_profile(
    data: CandidateProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Let a candidate update their own profile fields."""
    _require_candidate(current_user)
    cand_result = await db.execute(
        select(Candidate).where(Candidate.user_id == current_user.id)
    )
    candidate = cand_result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(candidate, field, value)

    await db.commit()
    return {"message": "Profile updated"}


# ─── Profile completeness ─────────────────────────────────────────────────────

class ProfileCompletenessOut(BaseModel):
    score: int
    missing: List[str]


@router.get("/profile-completeness", response_model=ProfileCompletenessOut)
async def get_profile_completeness(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _require_candidate(current_user)
    cand_result = await db.execute(
        select(Candidate).where(Candidate.user_id == current_user.id)
    )
    candidate = cand_result.scalar_one_or_none()
    if not candidate:
        return ProfileCompletenessOut(score=0, missing=["Complete your profile"])

    has_photo = bool(current_user.avatar_url or getattr(candidate, 'avatar_url', None))
    has_summary = bool(candidate.summary or candidate.resume_text)
    has_experience = bool(candidate.work_history or candidate.current_company)
    checks = [
        ("Profile photo", has_photo),
        ("Professional summary", has_summary),
        ("At least 5 skills", bool(candidate.skills and len(candidate.skills) >= 5)),
        ("Work experience", has_experience),
        ("Education", bool(candidate.education_level)),
        ("CV / Resume", bool(candidate.resume_url)),
        ("Location", bool(candidate.city and candidate.province)),
        ("Phone number", bool(candidate.phone)),
    ]
    passed = [label for label, ok in checks if ok]
    missing = [label for label, ok in checks if not ok]
    score = int(len(passed) / len(checks) * 100)
    return ProfileCompletenessOut(score=score, missing=missing)
