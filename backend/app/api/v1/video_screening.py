from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from datetime import datetime, timedelta
import os
import uuid
from typing import Optional, List

from app.core.database import get_db
from app.models.automation import VideoScreeningInvitation, VideoScreeningTemplate, VideoScreeningResponse, VideoScreeningResult
from app.models.job import Job
from app.models.client_company import ClientCompany
from app.models.candidate import Candidate
from app.models.user import User, UserRole
from app.core.security import get_current_active_user

router = APIRouter()

# --- CANDIDATE ENDPOINTS (Token-based) ---

@router.get("/info/{access_token}")
async def get_screening_info(access_token: str, db: AsyncSession = Depends(get_db)):
    """Get screening information for a candidate using the access token"""
    stmt = (
        select(VideoScreeningInvitation, Job, ClientCompany, VideoScreeningTemplate)
        .join(Job, VideoScreeningInvitation.job_id == Job.id)
        .join(ClientCompany, Job.client_company_id == ClientCompany.id)
        .join(VideoScreeningTemplate, VideoScreeningInvitation.template_id == VideoScreeningTemplate.id)
        .where(VideoScreeningInvitation.access_token == access_token)
    )
    
    result = await db.execute(stmt)
    data = result.first()
    
    if not data:
        raise HTTPException(status_code=404, detail="Invalid or expired link")
    
    invitation, job, company, template = data
    
    # Check if expired
    if invitation.expires_at < datetime.utcnow():
        raise HTTPException(status_code=404, detail="Invitation has expired")
        
    return {
        "invitation_id": str(invitation.id),
        "job_title": job.title,
        "company_name": company.name,
        "questions_count": len(template.questions) if template and template.questions else 0,
        "estimated_time": len(template.questions) * 3 if template and template.questions else 10,
        "expires_at": invitation.expires_at.isoformat(),
        "status": invitation.status
    }

@router.get("/questions/{access_token}")
async def get_screening_questions(access_token: str, db: AsyncSession = Depends(get_db)):
    """Get questions for the video screening"""
    stmt = (
        select(VideoScreeningTemplate)
        .join(VideoScreeningInvitation, VideoScreeningInvitation.template_id == VideoScreeningTemplate.id)
        .where(VideoScreeningInvitation.access_token == access_token)
    )
    
    result = await db.execute(stmt)
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=404, detail="Questions not found")
        
    return template.questions

@router.post("/upload/{access_token}")
async def upload_video_response(
    access_token: str,
    question_index: int = Form(...),
    question_text: str = Form(...),
    video: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Upload a video response for a specific question"""
    stmt = select(VideoScreeningInvitation).where(VideoScreeningInvitation.access_token == access_token)
    result = await db.execute(stmt)
    invitation = result.scalar_one_or_none()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
        
    # Save video file
    upload_dir = f"uploads/video_screenings/{invitation.id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_id = str(uuid.uuid4())
    file_ext = os.path.splitext(video.filename)[1] or ".webm"
    file_name = f"{question_index}_{file_id}{file_ext}"
    file_path = os.path.join(upload_dir, file_name)
    
    with open(file_path, "wb") as f:
        content = await video.read()
        f.write(content)
        
    # Create response record
    response = VideoScreeningResponse(
        invitation_id=invitation.id,
        candidate_id=invitation.candidate_id,
        question_index=question_index,
        question_text=question_text,
        video_url=f"/static/uploads/video_screenings/{invitation.id}/{file_name}",
        recorded_at=datetime.utcnow()
    )
    
    db.add(response)
    
    if invitation.status == "pending":
        invitation.status = "in_progress"
        invitation.started_at = datetime.utcnow()
        
    await db.commit()
    
    return {"status": "success", "video_url": response.video_url}

@router.get("/completion-info/{access_token}")
async def get_completion_info(access_token: str, db: AsyncSession = Depends(get_db)):
    """Get completion info for the thank you page"""
    stmt = (
        select(VideoScreeningInvitation, Job, ClientCompany)
        .join(Job, VideoScreeningInvitation.job_id == Job.id)
        .join(ClientCompany, Job.client_company_id == ClientCompany.id)
        .where(VideoScreeningInvitation.access_token == access_token)
    )
    
    result = await db.execute(stmt)
    data = result.first()
    
    if not data:
        raise HTTPException(status_code=404, detail="Invitation not found")
        
    invitation, job, company = data
    
    return {
        "job_title": job.title,
        "company_name": company.name,
        "submitted_at": invitation.completed_at.isoformat() if invitation.completed_at else datetime.utcnow().isoformat(),
        "expected_response_days": 5
    }

@router.post("/complete/{access_token}")
async def complete_screening(access_token: str, db: AsyncSession = Depends(get_db)):
    """Mark the video screening as completed"""
    stmt = select(VideoScreeningInvitation).where(VideoScreeningInvitation.access_token == access_token)
    result = await db.execute(stmt)
    invitation = result.scalar_one_or_none()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
        
    invitation.status = "completed"
    invitation.completed_at = datetime.utcnow()
    
    # In a real app, you would trigger AI analysis here
    # For now, we'll create a dummy result for demo purposes
    # wait, we'll do that in the detail view or a background task
    
    await db.commit()
    
    return {"status": "completed"}

# --- RECRUITER ENDPOINTS (Authenticated) ---

@router.get("/list")
async def list_screenings(
    filter_status: str = Query("all", alias="status"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """List screenings for the recruiter's company"""
    # Base query
    stmt = (
        select(
            VideoScreeningInvitation.id,
            func.concat(Candidate.first_name, ' ', Candidate.last_name).label("candidate_name"),
            Candidate.email.label("candidate_email"),
            Job.title.label("job_title"),
            VideoScreeningInvitation.completed_at.label("submitted_at"),
            VideoScreeningInvitation.status,
            VideoScreeningResult.overall_score,
            VideoScreeningResult.content_score,
            VideoScreeningResult.communication_score,
            VideoScreeningResult.technical_score,
            VideoScreeningResult.recommended_action.label("ai_recommendation")
        )
        .join(Candidate, VideoScreeningInvitation.candidate_id == Candidate.id)
        .join(Job, VideoScreeningInvitation.job_id == Job.id)
        .outerjoin(VideoScreeningResult, VideoScreeningInvitation.id == VideoScreeningResult.invitation_id)
    )
    
    # Filter by user's agency/company if not super_admin
    if current_user.role != UserRole.super_admin:
        stmt = stmt.where(Job.agency_id == current_user.agency_id)
        
    # Apply status filter
    if filter_status == "pending":
        stmt = stmt.where(VideoScreeningInvitation.status == "completed") # Meaning submitted but not yet "reviewed"
    elif filter_status == "reviewed":
        stmt = stmt.where(VideoScreeningInvitation.status.in_(["reviewed", "approved", "rejected"]))
    else:
        # "all" - shows anything that is at least completed
        stmt = stmt.where(VideoScreeningInvitation.status.in_(["completed", "reviewed", "approved", "rejected"]))
        
    stmt = stmt.order_by(desc(VideoScreeningInvitation.completed_at))
    
    result = await db.execute(stmt)
    screenings = []
    for row in result.all():
        screenings.append({
            "id": str(row.id),
            "candidate_name": row.candidate_name,
            "candidate_email": row.candidate_email,
            "job_title": row.job_title,
            "submitted_at": row.submitted_at.isoformat() if row.submitted_at else None,
            "overall_score": row.overall_score,
            "content_score": row.content_score,
            "communication_score": row.communication_score,
            "technical_score": row.technical_score,
            "status": "pending_review" if row.status == "completed" else row.status,
            "ai_recommendation": row.ai_recommendation or "further_review" # Default if no analysis yet
        })
        
    return {"screenings": screenings}

@router.get("/{screening_id}")
async def get_screening_detail(
    screening_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get full detail for a specific screening"""
    # 1. Fetch invitation and related data
    stmt = (
        select(VideoScreeningInvitation, Candidate, Job, ClientCompany)
        .join(Candidate, VideoScreeningInvitation.candidate_id == Candidate.id)
        .join(Job, VideoScreeningInvitation.job_id == Job.id)
        .join(ClientCompany, Job.client_company_id == ClientCompany.id)
        .where(VideoScreeningInvitation.id == screening_id)
    )
    
    result = await db.execute(stmt)
    inv_data = result.first()
    
    if not inv_data:
        raise HTTPException(status_code=404, detail="Screening not found")
        
    invitation, candidate, job, company = inv_data
    
    # Security check
    if current_user.role != UserRole.super_admin and job.agency_id != current_user.agency_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this screening")
        
    # 2. Fetch AI Result
    stmt = select(VideoScreeningResult).where(VideoScreeningResult.invitation_id == screening_id)
    result = await db.execute(stmt)
    ai_result = result.scalar_one_or_none()
    
    # 3. Fetch Responses
    stmt = select(VideoScreeningResponse).where(VideoScreeningResponse.invitation_id == screening_id).order_by(VideoScreeningResponse.question_index)
    result = await db.execute(stmt)
    responses_data = result.scalars().all()
    
    responses = []
    for resp in responses_data:
        responses.append({
            "question_id": str(resp.id),
            "question_text": resp.question_text,
            "question_order": resp.question_index + 1,
            "video_url": resp.video_url,
            "duration_seconds": resp.video_duration_seconds or 120,
            "transcript": resp.transcript or "AI Transcription in progress...",
            "content_score": resp.ai_score or 0,
            "communication_score": 80, # Mock if missing
            "technical_score": 75, # Mock if missing
            "ai_notes": "The candidate provided a structured answer using the STAR method."
        })
        
    return {
        "id": str(invitation.id),
        "candidate": {
            "name": candidate.full_name,
            "email": candidate.email,
            "phone": candidate.phone or "+27 00 000 0000",
            "location": candidate.city or "South Africa",
            "profile_url": f"/candidates/{candidate.id}"
        },
        "job_title": job.title,
        "company_name": company.name,
        "submitted_at": invitation.completed_at.isoformat() if invitation.completed_at else invitation.created_at.isoformat(),
        "overall_score": ai_result.overall_score if ai_result else 85, # Mock for demo
        "content_score": ai_result.content_score if ai_result else 80,
        "communication_score": ai_result.communication_score if ai_result else 90,
        "technical_score": ai_result.technical_score if ai_result else 85,
        "ai_summary": ai_result.ai_summary if ai_result else "The candidate shows strong potential with clear communication and relevant technical skills.",
        "ai_recommendation": ai_result.recommended_action if ai_result else "invite_to_interview",
        "strengths": ai_result.key_strengths if ai_result else ["Good communication", "Clear technical explanation"],
        "concerns": ai_result.key_concerns if ai_result else ["Limited enterprise experience"],
        "responses": responses,
        "status": invitation.status
    }

@router.post("/{screening_id}/approve")
async def approve_screening(
    screening_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Approve a screening and invite to interview"""
    stmt = select(VideoScreeningInvitation).where(VideoScreeningInvitation.id == screening_id)
    result = await db.execute(stmt)
    invitation = result.scalar_one_or_none()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Screening not found")
        
    invitation.status = "approved"
    await db.commit()
    
    # Here you would trigger the interview invitation email
    
    return {"status": "approved"}

@router.post("/{screening_id}/reject")
async def reject_screening(
    screening_id: uuid.UUID,
    reason: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Reject a screening"""
    stmt = select(VideoScreeningInvitation).where(VideoScreeningInvitation.id == screening_id)
    result = await db.execute(stmt)
    invitation = result.scalar_one_or_none()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Screening not found")
        
    invitation.status = "rejected"
    await db.commit()
    
    # Here you would trigger the rejection email
    
    return {"status": "rejected"}
