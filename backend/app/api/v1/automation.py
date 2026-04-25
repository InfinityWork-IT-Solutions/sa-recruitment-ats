"""
RecruitPro SA - Automation Router
API endpoints for AI automation system
"""

import os
from typing import List, Dict, Optional
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

# Import services
from app.services.automated_screening_service import AutomatedScreeningService
from app.services.video_screening_service import VideoScreeningService
from app.services.interview_scheduling_service import InterviewSchedulingService
from app.services.proactive_sourcing_service import ProactiveSourcingService
from app.services.email_service import email_service  # Using existing instance

# Database
from app.core.database import get_db

# Schemas
from app.schemas.automation import (
    ScreenApplicationRequest,
    VideoScreeningCreateRequest,
    InterviewScheduleRequest,
    SourcingCampaignCreateRequest
)

router = APIRouter()

# ============================================================================
# SERVICE DEPENDENCIES
# ============================================================================

def get_screening_service(db: AsyncSession = Depends(get_db)) -> AutomatedScreeningService:
    """Get automated screening service"""
    return AutomatedScreeningService(
        db=db,
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )

def get_video_service(db: AsyncSession = Depends(get_db)) -> VideoScreeningService:
    """Get video screening service"""
    return VideoScreeningService(
        db=db,
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        assemblyai_api_key=os.getenv("ASSEMBLYAI_API_KEY")
    )

def get_scheduling_service(
    db: AsyncSession = Depends(get_db)
) -> InterviewSchedulingService:
    """Get interview scheduling service"""
    from app.services.email_automation_service import EmailAutomationService
    return InterviewSchedulingService(
        db=db,
        email_service=EmailAutomationService() # Adapt as needed
    )

def get_sourcing_service(
    db: AsyncSession = Depends(get_db)
) -> ProactiveSourcingService:
    """Get proactive sourcing service"""
    from app.services.email_automation_service import EmailAutomationService
    return ProactiveSourcingService(
        db=db,
        email_service=EmailAutomationService(),
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )

# ============================================================================
# PYDANTIC MODELS (Request/Response Schemas)
# ============================================================================

# Handled by app.schemas.automation

# ============================================================================
# 1. AUTOMATED SCREENING ENDPOINTS
# ============================================================================

@router.post("/screening/screen-application")
async def screen_application(
    request: ScreenApplicationRequest,
    service: AutomatedScreeningService = Depends(get_screening_service)
):
    """
    Screen a single application with AI
    """
    try:
        # In production, fetch application data from database
        # For now, placeholder or implement logic to fetch
        from app.models import Application
        from sqlalchemy import select
        
        async with service.db as db:
            result = await db.execute(select(Application).where(Application.id == request.application_id))
            app_record = result.scalar_one_or_none()
            
            if not app_record:
                raise HTTPException(status_code=404, detail="Application not found")
            
            # Assuming application has candidate and job data
            result = await service.screen_application(
                application_id=request.application_id,
                candidate_data=app_record.candidate.model_dump() if hasattr(app_record.candidate, 'model_dump') else {},
                job_requirements=app_record.job.requirements if hasattr(app_record.job, 'requirements') else {}
            )
        
        return {
            "success": True,
            "data": result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/screening/bulk-screen/{job_id}")
async def bulk_screen_applications(
    job_id: UUID,
    background_tasks: BackgroundTasks,
    service: AutomatedScreeningService = Depends(get_screening_service)
):
    """
    Screen all pending applications for a job
    """
    # Run in background
    background_tasks.add_task(
        service.bulk_screen_applications,
        job_id=job_id,
        max_applications=100
    )
    
    return {
        "success": True,
        "message": "Bulk screening started in background"
    }

# ============================================================================
# 2. VIDEO SCREENING ENDPOINTS
# ============================================================================

@router.post("/video-screening/create")
async def create_video_screening(
    request: VideoScreeningCreateRequest,
    service: VideoScreeningService = Depends(get_video_service)
):
    """
    Create video screening invitation
    """
    try:
        result = await service.create_video_screening_invitation(
            application_id=request.application_id,
            candidate_id=request.candidate_id,
            job_id=request.job_id
        )
        
        return {
            "success": True,
            "data": result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/video-screening/{access_token}/questions")
async def get_screening_questions(
    access_token: str,
    service: VideoScreeningService = Depends(get_video_service)
):
    """
    Get video screening questions for candidate
    """
    # Logic to validate token and return questions
    return {"message": "Endpoint under development for token validation"}

@router.post("/video-screening/{invitation_id}/submit-response")
async def submit_video_response(
    invitation_id: UUID,
    question_index: int,
    video_url: str,
    service: VideoScreeningService = Depends(get_video_service)
):
    """
    Submit video response for a question
    """
    try:
        result = await service.save_video_response(
            invitation_id=invitation_id,
            question_index=question_index,
            question_text="Response to Question",  # Should fetch from template
            video_url=video_url,
            duration_seconds=120
        )
        
        return {
            "success": True,
            "data": result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/video-screening/{invitation_id}/complete")
async def complete_video_screening(
    invitation_id: UUID,
    service: VideoScreeningService = Depends(get_video_service)
):
    """
    Mark video screening as complete and generate assessment
    """
    try:
        result = await service.complete_video_screening(
            invitation_id=invitation_id
        )
        
        return {
            "success": True,
            "data": result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# 3. INTERVIEW SCHEDULING ENDPOINTS
# ============================================================================

@router.get("/scheduling/available-slots")
async def get_available_slots(
    job_id: UUID,
    start_date: datetime,
    end_date: datetime,
    service: InterviewSchedulingService = Depends(get_scheduling_service)
):
    """
    Get available interview slots
    """
    # Placeholder
    return {"message": "Availability check logic goes here"}

@router.post("/scheduling/schedule-interview")
async def schedule_interview(
    request: InterviewScheduleRequest,
    service: InterviewSchedulingService = Depends(get_scheduling_service)
):
    """
    Schedule an interview
    """
    try:
        result = await service.schedule_interview(
            application_id=request.application_id,
            candidate_id=request.candidate_id,
            job_id=request.job_id,
            slot_id=request.slot_id,
            interviewer_ids=[],  # Fetch from job
            meeting_type='video'
        )
        
        return {
            "success": True,
            "data": result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scheduling/auto-schedule/{application_id}")
async def auto_schedule_interview(
    application_id: UUID,
    candidate_id: UUID,
    job_id: UUID,
    service: InterviewSchedulingService = Depends(get_scheduling_service)
):
    """
    Automatically find best slot and schedule interview
    """
    try:
        result = await service.auto_schedule_interview(
            application_id=application_id,
            candidate_id=candidate_id,
            job_id=job_id
        )
        
        return {
            "success": True,
            "data": result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# 4. PROACTIVE SOURCING ENDPOINTS
# ============================================================================

@router.post("/sourcing/create-campaign")
async def create_sourcing_campaign(
    request: SourcingCampaignCreateRequest,
    service: ProactiveSourcingService = Depends(get_sourcing_service)
):
    """
    Create new sourcing campaign
    """
    try:
        result = await service.create_sourcing_campaign(
            job_id=request.job_id,
            company_id=request.company_id,
            name=request.name,
            target_criteria={
                "skills": request.target_skills,
                "experience_years_min": request.experience_years_min,
                "experience_years_max": request.experience_years_max,
                "locations": request.locations
            },
            max_candidates=request.max_candidates
        )
        
        return {
            "success": True,
            "data": result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sourcing/{campaign_id}/find-candidates")
async def find_candidates(
    campaign_id: UUID,
    background_tasks: BackgroundTasks,
    service: ProactiveSourcingService = Depends(get_sourcing_service)
):
    """
    Find and add candidates to campaign
    """
    async def _find_and_add():
        prospects = await service.find_candidates(campaign_id, limit=100)
        await service.add_prospects_to_campaign(campaign_id, prospects)
    
    background_tasks.add_task(_find_and_add)
    
    return {
        "success": True,
        "message": "Candidate search started in background"
    }

@router.post("/sourcing/{campaign_id}/send-outreach")
async def send_outreach_messages(
    campaign_id: UUID,
    background_tasks: BackgroundTasks,
    top_n: int = 50,
    service: ProactiveSourcingService = Depends(get_sourcing_service)
):
    """
    Send outreach messages to top prospects
    """
    background_tasks.add_task(
        service.send_outreach_messages,
        campaign_id=campaign_id,
        top_n=top_n
    )
    
    return {
        "success": True,
        "message": f"Sending outreach to top {top_n} candidates"
    }
