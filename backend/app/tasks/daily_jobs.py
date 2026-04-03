from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from app.core.database import get_db, AsyncSessionLocal
from app.models import User, Job, UserRole, JobStatus
from app.services.email_automation_service import EmailAutomationService
from app.services.ai_matching import ai_matching_service
from apscheduler.schedulers.asyncio import AsyncIOScheduler

async def find_matching_jobs(candidate_user: User, db: AsyncSession) -> list:
    """Find jobs that match the candidate's profile and were posted within the last 24 hours."""
    # This assumes candidate relationship exists
    candidate = candidate_user.candidate
    if not candidate:
        return []

    # Get active jobs from last 24h with agency relationship loaded
    time_limit = datetime.utcnow() - timedelta(hours=24)
    query = select(Job).options(selectinload(Job.agency)).filter(
        Job.status == JobStatus.active,
        Job.created_at >= time_limit
    )
    result = await db.execute(query)
    recent_jobs = result.scalars().all()

    matched_jobs = []
    for job in recent_jobs:
        # Use simple score data for template
        match_data = ai_matching_service.calculate_match_score(job, candidate)
        score = match_data["overall_score"]
        
        # Only include if score > threshold
        if score >= 60:
            matched_jobs.append({
                "id": str(job.id),
                "title": job.title,
                "company_name": job.agency.name if job.agency else "RecruitPro",
                "location": job.location or "South Africa",
                "salary_min": job.salary_min or 0,
                "salary_max": job.salary_max or 0,
                "match_score": int(score)
            })

    return matched_jobs

async def send_daily_job_matches():
    """Run daily at 9 AM to send job match emails.
       Note: We create a manual session here because we are outside the request context.
    """
    print(f"[{datetime.now()}] Starting daily job match task...")
    
    # We need a session
    async with AsyncSessionLocal() as db:
        # Get all candidates with their profile loaded
        query = select(User).options(selectinload(User.candidate)).filter(User.role == UserRole.candidate)
        result = await db.execute(query)
        candidates = result.scalars().all()
        
        for candidate in candidates:
            # Match jobs
            matched_jobs = await find_matching_jobs(candidate, db)
            
            if matched_jobs:
                await EmailAutomationService.send_job_match_alert(
                    candidate_email=candidate.email,
                    candidate_name=candidate.first_name,
                    matched_jobs=matched_jobs
                )
    
    print(f"[{datetime.now()}] Daily job match task completed.")

def setup_scheduler():
    """Initialize and start the scheduler"""
    scheduler = AsyncIOScheduler()
    # Schedule job for 9:00 AM daily
    scheduler.add_job(send_daily_job_matches, 'cron', hour=9)
    # Also trigger once on startup for testing (optional)
    # scheduler.add_job(send_daily_job_matches, 'date', run_date=datetime.now() + timedelta(seconds=10))
    scheduler.start()
    return scheduler
