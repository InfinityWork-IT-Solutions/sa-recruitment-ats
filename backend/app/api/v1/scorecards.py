"""
Interview Scorecards API — structured per-interviewer feedback
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from pydantic import BaseModel
from typing import Dict

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import User
from app.services.interview_scorecard_service import InterviewScorecardService

router = APIRouter()


class ScorecardCreate(BaseModel):
    overall_rating: int
    recommendation: str
    criteria_scores: Optional[Dict] = {}
    strengths: Optional[str] = None
    concerns: Optional[str] = None
    notes: Optional[str] = None
    interview_id: Optional[UUID] = None


@router.get("/{application_id}/scorecards")
async def get_scorecards(
    application_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all scorecards for an application."""
    service = InterviewScorecardService(db)
    return await service.get_scorecards(application_id)


@router.post("/{application_id}/scorecards", status_code=status.HTTP_201_CREATED)
async def create_scorecard(
    application_id: UUID,
    body: ScorecardCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit an interview scorecard for an application."""
    service = InterviewScorecardService(db)
    return await service.create_scorecard(
        application_id=application_id,
        scored_by=current_user.id,
        overall_rating=body.overall_rating,
        recommendation=body.recommendation,
        criteria_scores=body.criteria_scores,
        strengths=body.strengths,
        concerns=body.concerns,
        notes=body.notes,
        interview_id=body.interview_id,
    )
