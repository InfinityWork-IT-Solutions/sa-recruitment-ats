# backend/app/api/v1/feeds.py
from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.job import Job
from app.models.job_platform import JobPlatformPosting
from app.services.integrations.indeed_service import IndeedService

router = APIRouter()

@router.get("/indeed.xml")
async def indeed_feed(db: AsyncSession = Depends(get_db)):
    """Generate Indeed XML feed"""
    
    # Get all active jobs with Indeed integration
    result = await db.execute(
        select(Job).join(JobPlatformPosting, Job.id == JobPlatformPosting.job_id).options(
            selectinload(Job.agency)
        ).filter(
            Job.status == 'active',
            JobPlatformPosting.platform == 'indeed',
            JobPlatformPosting.status == 'active'
        )
    )
    jobs = result.scalars().all()
    
    # To conform to expected dict format in generate_xml_feed
    job_dicts = []
    for j in jobs:
        d = {
            "id": str(j.id),
            "title": j.title,
            "created_at": j.created_at,
            "company_name": j.agency.name if j.agency else "RecruitPro SA",
            "city": j.city or "Unknown",
            "province": j.province or "Unknown",
            "location": j.location,
            "description": j.description,
            "salary_min": j.salary_min or 0,
            "salary_max": j.salary_max or 0,
            "employment_type": j.employment_type.value if hasattr(j.employment_type, 'value') else str(j.employment_type),
        }
        job_dicts.append(d)
        
    xml_feed = IndeedService.generate_xml_feed(job_dicts)
    
    return Response(content=xml_feed, media_type="application/xml")
