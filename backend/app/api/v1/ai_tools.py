"""
AI Tools API — Job description generation, interview questions, salary benchmarking
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import User
from app.services.ai_generation_service import AIGenerationService

router = APIRouter()


class GenerateJDRequest(BaseModel):
    title: str
    category: str = "other"
    skills: List[str] = []
    experience_level: str = "mid_level"
    employment_type: str = "full_time"
    company_name: str = ""
    company_context: str = ""
    location: str = "South Africa"


class GenerateQuestionsRequest(BaseModel):
    job_title: str
    required_skills: List[str] = []
    candidate_skills: Optional[List[str]] = None
    interview_round: str = "first"
    experience_level: str = "mid_level"


@router.post("/generate-job-description")
async def generate_job_description(
    request: GenerateJDRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a complete job description using AI."""
    try:
        service = AIGenerationService()
        result = await service.generate_job_description(
            title=request.title,
            category=request.category,
            skills=request.skills,
            experience_level=request.experience_level,
            employment_type=request.employment_type,
            company_name=request.company_name,
            company_context=request.company_context,
            location=request.location,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


@router.post("/generate-interview-questions")
async def generate_interview_questions(
    request: GenerateQuestionsRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate tailored interview questions for a role and candidate."""
    try:
        service = AIGenerationService()
        result = await service.generate_interview_questions(
            job_title=request.job_title,
            required_skills=request.required_skills,
            candidate_skills=request.candidate_skills,
            interview_round=request.interview_round,
            experience_level=request.experience_level,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


@router.get("/salary-benchmark")
async def get_salary_benchmark(
    job_title: str,
    location: str = "South Africa",
    experience_years: int = 3,
    employment_type: str = "full_time",
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get South African market salary benchmark for a role."""
    try:
        service = AIGenerationService()
        result = await service.get_salary_benchmark(
            job_title=job_title,
            location=location,
            experience_years=experience_years,
            employment_type=employment_type,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Salary benchmark failed: {str(e)}")
