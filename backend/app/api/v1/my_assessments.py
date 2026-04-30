"""
============================================================================
MY ASSESSMENTS API - CANDIDATE PORTAL
============================================================================

PURPOSE:
API endpoint for candidates to see all their assessments in one place.
Solves the "lost email" problem by showing everything in the portal.

ENDPOINT:
GET /api/candidates/{candidate_id}/assessments

USED BY: MyAssessments.tsx (Candidate Portal)

============================================================================
"""

from typing import List, Optional
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel

from app.core.database import get_db
from app.models import (
    VideoScreeningInvitation,
    VideoScreeningResult,
    Job,
    ClientCompany as Company,
    Candidate
)

router = APIRouter(tags=["Candidates - Portal"])


# ============================================================================
# RESPONSE MODELS
# ============================================================================

class AssessmentItem(BaseModel):
    """Single assessment item for the candidate's dashboard"""
    
    id: str
    assessment_type: str  # 'video_screening', 'skills_assessment', 'coding_challenge', etc.
    job_title: str
    company_name: str
    company_logo: Optional[str]
    
    status: str  # 'pending', 'in_progress', 'completed', 'expired'
    
    # Pending assessments
    expires_at: Optional[datetime]
    expires_in_days: Optional[int]
    access_link: Optional[str]  # Direct link to start
    
    # Completed assessments
    completed_at: Optional[datetime]
    score: Optional[float]  # If recruiter chose to share score
    result_available: bool
    passed: Optional[bool]
    
    # Metadata
    invited_at: datetime
    estimated_duration_minutes: Optional[int]


class MyAssessmentsResponse(BaseModel):
    """Complete response for My Assessments page"""
    
    pending: List[AssessmentItem]
    in_progress: List[AssessmentItem]
    completed: List[AssessmentItem]
    expired: List[AssessmentItem]
    
    summary: dict  # {"total": 10, "pending": 3, "completed": 5, "expired": 2}


# ============================================================================
# ENDPOINT: GET MY ASSESSMENTS
# ============================================================================

@router.get("/{candidate_id}/assessments", response_model=MyAssessmentsResponse)
async def get_my_assessments(
    candidate_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all assessments for a candidate
    """
    
    # Verify candidate exists
    candidate = await db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Initialize response lists
    pending = []
    in_progress = []
    completed = []
    expired = []
    
    # FETCH VIDEO SCREENING INVITATIONS
    video_query = await db.execute(
        select(VideoScreeningInvitation)
        .where(VideoScreeningInvitation.candidate_id == candidate_id)
        .order_by(VideoScreeningInvitation.created_at.desc())
    )
    video_invitations = video_query.scalars().all()
    
    for invitation in video_invitations:
        # Get job details
        job = await db.get(Job, invitation.job_id)
        if not job:
            continue
        
        company = await db.get(Company, job.client_company_id) if hasattr(job, 'client_company_id') else await db.get(Company, job.company_id)
        
        # Calculate expiration
        now = datetime.utcnow()
        is_expired = invitation.expires_at < now
        days_remaining = (invitation.expires_at - now).days if not is_expired else 0
        
        # Get result if completed
        result = None
        score = None
        passed = None
        if invitation.status == 'completed':
            result_query = await db.execute(
                select(VideoScreeningResult)
                .where(VideoScreeningResult.invitation_id == invitation.id)
                .order_by(VideoScreeningResult.created_at.desc())
            )
            result = result_query.scalars().first()
            
            if result and result.share_score_with_candidate:
                score = float(result.overall_score)
                passed = result.overall_score >= 70
        
        # Build assessment item
        item = AssessmentItem(
            id=str(invitation.id),
            assessment_type="video_screening",
            job_title=job.title,
            company_name=company.name if company else "Unknown",
            company_logo=company.logo_url if company and hasattr(company, 'logo_url') else None,
            status=invitation.status if not is_expired else 'expired',
            expires_at=invitation.expires_at,
            expires_in_days=days_remaining,
            access_link=f"/video-screening/{invitation.access_token}" if invitation.status == 'pending' else None,
            completed_at=invitation.completed_at,
            score=score,
            result_available=result is not None,
            passed=passed,
            invited_at=invitation.created_at,
            estimated_duration_minutes=10
        )
        
        if is_expired and invitation.status != 'completed':
            expired.append(item)
        elif invitation.status == 'pending':
            pending.append(item)
        elif invitation.status == 'in_progress':
            in_progress.append(item)
        elif invitation.status == 'completed':
            completed.append(item)
    
    total = len(pending) + len(in_progress) + len(completed) + len(expired)
    summary = {
        "total": total,
        "pending": len(pending),
        "in_progress": len(in_progress),
        "completed": len(completed),
        "expired": len(expired)
    }
    
    return MyAssessmentsResponse(
        pending=pending,
        in_progress=in_progress,
        completed=completed,
        expired=expired,
        summary=summary
    )


@router.get("/{candidate_id}/assessments/{assessment_id}")
async def get_assessment_detail(
    candidate_id: UUID,
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed information about a specific assessment
    """
    video_query = await db.execute(
        select(VideoScreeningInvitation)
        .where(
            and_(
                VideoScreeningInvitation.id == assessment_id,
                VideoScreeningInvitation.candidate_id == candidate_id
            )
        )
    )
    invitation = video_query.scalars().first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    job = await db.get(Job, invitation.job_id)
    company = await db.get(Company, job.client_company_id) if hasattr(job, 'client_company_id') else await db.get(Company, job.company_id)
    
    result_query = await db.execute(
        select(VideoScreeningResult)
        .where(VideoScreeningResult.invitation_id == invitation.id)
    )
    result = result_query.scalars().first()
    
    response = {
        "id": str(invitation.id),
        "job_title": job.title,
        "company_name": company.name if company else "Unknown",
        "status": invitation.status,
        "completed_at": invitation.completed_at,
        "access_link": f"/video-screening/{invitation.access_token}" if invitation.status == 'pending' else None
    }
    
    if result and result.share_score_with_candidate:
        response["results"] = {
            "overall_score": result.overall_score,
            "passed": result.overall_score >= 70,
            "feedback": result.candidate_feedback if hasattr(result, 'candidate_feedback') else None,
            "strengths": result.key_strengths if hasattr(result, 'key_strengths') else [],
            "areas_for_improvement": result.key_concerns if hasattr(result, 'key_concerns') else []
        }
    
    return response
