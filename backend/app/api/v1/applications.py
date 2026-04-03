"""
Application API endpoints - Application pipeline management
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import User, UserRole
from app.schemas import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
    ApplicationBrief,
    ApplicationFilter,
    ApplicationStatusUpdate,
    ApplicationScreening,
    InterviewSchedule,
    InterviewComplete,
    OfferMake,
    OfferRespond,
    ApplicationReject,
    ApplicationWithdraw,
    ApplicationPipeline,
    ApplicationStatistics,
    MessageResponse,
)
from app.services.applications_service import application_service
from app.models.job_platform import JobPlatformPosting
from sqlalchemy import select

router = APIRouter()


def check_application_permissions(user: User, action: str = "view"):
    """Check if user has permission for application operations"""
    if action == "view":
        return True
    
    if action in ["create", "update", "delete"]:
        if user.role not in [UserRole.SUPER_ADMIN, UserRole.AGENCY_ADMIN, UserRole.RECRUITER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to perform this action"
            )
    
    return True

@router.post("/jobs/{job_id}/apply", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_to_job(
    job_id: UUID,
    application_data: ApplicationCreate,
    source: str = Query(default="direct"),
    db: AsyncSession = Depends(get_db)
):
    """
    Public endpoint to apply to a job with source tracking
    """
    # Assuming agency_id is fetched via job
    from app.models.job import Job
    job_result = await db.execute(select(Job).where(Job.id == job_id))
    job = job_result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    application = await application_service.create_application(
        db,
        application_data,
        job.agency_id,
        None  # no current_user for public apply
    )
    
    # Track source and external ID
    application.source = source
    if hasattr(application_data, 'external_application_id'):
        application.external_application_id = application_data.external_application_id
        
    if source != 'direct':
        posting_result = await db.execute(select(JobPlatformPosting).filter_by(
            job_id=job_id,
            platform=source
        ))
        posting = posting_result.scalar_one_or_none()
        if posting:
            posting.applications_count = (posting.applications_count or 0) + 1
            
    await db.commit()
    await db.refresh(application)
    
    # SEND AUTOMATED EMAILS
    try:
        from app.services.email_automation_service import EmailAutomationService
        from app.models.user import User, UserRole
        from app.models.agency import Agency
        
        # Get candidate details (if user_id exists)
        candidate_name = f"{application_data.first_name} {application_data.last_name}"
        candidate_email = application_data.email
        
        # Get Job and Agency details
        await db.refresh(job, ["agency"])
        agency = job.agency
        
        # 1. Confirmation to candidate
        await EmailAutomationService.send_application_confirmation(
            candidate_email=candidate_email,
            candidate_name=candidate_name,
            job_title=job.title,
            company_name=agency.name
        )
        
        # 2. Alert to company (Recruiters/Admins of the agency)
        # For simplicity, we send to the primary agency email
        await EmailAutomationService.send_new_application_alert(
            company_email=agency.email,
            recruiter_name=agency.name,
            candidate_name=candidate_name,
            job_title=job.title,
            match_score=int(application.match_score or 0),
            application_id=str(application.id)
        )
    except Exception as e:
        print(f"Error sending automated emails: {e}")
        # We don't want to fail the application if email fails
    
    return ApplicationResponse.model_validate(application)


@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    application_data: ApplicationCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new application (candidate applies to job)
    
    **Required permissions**: agency_admin, recruiter
    
    **Initial status**: APPLIED
    **Unique constraint**: One application per candidate per job
    """
    check_application_permissions(current_user, "create")
    
    application = await application_service.create_application(
        db,
        application_data,
        current_user.agency_id,
        current_user
    )
    
    return ApplicationResponse.model_validate(application)


@router.get("/", response_model=dict)
async def list_applications(
    job_id: Optional[UUID] = Query(None),
    candidate_id: Optional[UUID] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    assigned_to: Optional[UUID] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List applications with filters
    
    **Filters**:
    - Filter by job, candidate, status
    - Filter by assigned recruiter
    - Pagination support
    - Sorting support
    """
    from app.models.application import ApplicationStatus
    
    filters = ApplicationFilter(
        job_id=job_id,
        candidate_id=candidate_id,
        status=ApplicationStatus(status_filter) if status_filter else None,
        assigned_to=assigned_to,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    agency_id = current_user.agency_id if current_user.role != UserRole.super_admin else None
    applications, total = await application_service.list_applications(
        db,
        agency_id,
        filters
    )
    
    return {
        "applications": [ApplicationBrief.model_validate(a) for a in applications],
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total
    }


@router.get("/statistics", response_model=ApplicationStatistics)
async def get_application_statistics(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get application statistics for current agency"""
    agency_id = current_user.agency_id if current_user.role != UserRole.super_admin else None
    stats = await application_service.get_application_statistics(db, agency_id)
    return ApplicationStatistics(**stats)


@router.get("/pipeline/{job_id}", response_model=ApplicationPipeline)
async def get_job_pipeline(
    job_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get Kanban pipeline for a specific job
    
    **Returns**: Applications grouped by status for drag-and-drop board
    """
    agency_id = current_user.agency_id if current_user.role != UserRole.super_admin else None
    pipeline = await application_service.get_pipeline_for_job(
        db,
        job_id,
        agency_id
    )
    
    # Get job title
    from app.models import Job
    job_result = await db.execute(
        select(Job).where(Job.id == job_id)
    )
    job = job_result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    pipeline["job_title"] = job.title
    
    from app.schemas.application import ApplicationPipelineStage
    stages = [
        ApplicationPipelineStage(
            status=stage["status"],
            count=stage["count"],
            applications=[ApplicationBrief(**app) for app in stage["applications"]]
        )
        for stage in pipeline["stages"]
    ]
    
    return ApplicationPipeline(
        job_id=pipeline["job_id"],
        job_title=pipeline["job_title"],
        stages=stages,
        total_applications=pipeline["total_applications"]
    )


@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get application details by ID"""
    agency_id = current_user.agency_id if current_user.role != UserRole.super_admin else None
    application = await application_service.get_application(
        db,
        application_id,
        agency_id
    )
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    return ApplicationResponse.model_validate(application)


@router.put("/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application_id: UUID,
    application_data: ApplicationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update application details
    
    **Required permissions**: agency_admin, recruiter
    """
    check_application_permissions(current_user, "update")
    
    agency_id = current_user.agency_id if current_user.role != UserRole.super_admin else None
    application = await application_service.get_application(
        db,
        application_id,
        agency_id
    )
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    application = await application_service.update_application(
        db,
        application,
        application_data,
        current_user
    )
    
    return ApplicationResponse.model_validate(application)


@router.delete("/{application_id}", response_model=MessageResponse)
async def delete_application(
    application_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an application
    
    **Required permissions**: agency_admin, recruiter
    """
    check_application_permissions(current_user, "delete")
    
    agency_id = current_user.agency_id if current_user.role != UserRole.super_admin else None
    application = await application_service.get_application(
        db,
        application_id,
        agency_id
    )
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    await application_service.delete_application(db, application)
    
    return MessageResponse(message="Application deleted successfully")


# Pipeline management endpoints

@router.post("/{application_id}/screen", response_model=ApplicationResponse)
async def screen_application(
    application_id: UUID,
    screening_data: ApplicationScreening,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Screen an application
    
    **Required permissions**: agency_admin, recruiter
    
    **If passed**: Moves to SHORTLISTED
    **If failed**: Moves to REJECTED
    """
    check_application_permissions(current_user, "update")
    
    agency_id = current_user.agency_id if current_user.role != UserRole.super_admin else None
    application = await application_service.get_application(
        db,
        application_id,
        agency_id
    )
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    application = await application_service.screen_application(
        db,
        application,
        screening_data.passed,
        screening_data.score,
        screening_data.notes or "",
        current_user
    )
    
    # SEND STATUS UPDATE EMAIL
    try:
        from app.services.email_automation_service import EmailAutomationService
        new_status = 'shortlisted' if screening_data.passed else 'rejected'
        
        # Load necessary relations
        await db.refresh(application, ["candidate", "job"])
        await db.refresh(application.job, ["agency"])
        
        await EmailAutomationService.send_status_update(
            candidate_email=application.candidate.email,
            candidate_name=application.candidate.full_name,
            job_title=application.job.title,
            company_name=application.job.agency.name,
            new_status=new_status
        )
    except Exception as e:
        print(f"Error sending status update email: {e}")
    
    return ApplicationResponse.model_validate(application)


@router.post("/{application_id}/interview/schedule", response_model=ApplicationResponse)
async def schedule_interview(
    application_id: UUID,
    interview_data: InterviewSchedule,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Schedule an interview
    
    **Required permissions**: agency_admin, recruiter
    
    **Status change**: → INTERVIEW_SCHEDULED
    """
    check_application_permissions(current_user, "update")
    
    agency_id = current_user.agency_id if current_user.role != UserRole.super_admin else None
    application = await application_service.get_application(
        db,
        application_id,
        agency_id
    )
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    application = await application_service.schedule_interview(
        db,
        application,
        interview_data.interview_time,
        current_user
    )
    
    # SEND INTERVIEW INVITATION EMAIL
    try:
        from app.services.email_automation_service import EmailAutomationService
        
        # Load necessary relations
        await db.refresh(application, ["candidate", "job"])
        await db.refresh(application.job, ["agency"])
        
        await EmailAutomationService.send_interview_invitation(
            candidate_email=application.candidate.email,
            candidate_name=application.candidate.full_name,
            company_name=application.job.agency.name,
            job_title=application.job.title,
            interview_date=interview_data.interview_time.strftime('%Y-%m-%d'),
            interview_time=interview_data.interview_time.strftime('%H:%M'),
            interview_location="Dashboard / Office",
            interview_type="In-Person" # Default or logic based on data
        )
    except Exception as e:
        print(f"Error sending interview invitation email: {e}")
        
    return ApplicationResponse.model_validate(application)


@router.post("/{application_id}/interview/complete", response_model=ApplicationResponse)
async def complete_interview(
    application_id: UUID,
    interview_data: InterviewComplete,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark interview as completed
    
    **Required permissions**: agency_admin, recruiter
    
    **Status change**: → INTERVIEWED
    """
    check_application_permissions(current_user, "update")
    
    agency_id = current_user.agency_id if current_user.role != UserRole.super_admin else None
    application = await application_service.get_application(
        db,
        application_id,
        agency_id
    )
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    application = await application_service.complete_interview(
        db,
        application,
        interview_data.rating,
        interview_data.feedback,
        current_user
    )
    
    return ApplicationResponse.model_validate(application)


@router.post("/{application_id}/offer", response_model=ApplicationResponse)
async def make_offer(
    application_id: UUID,
    offer_data: OfferMake,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Make a job offer
    
    **Required permissions**: agency_admin, recruiter
    
    **Status change**: → OFFER_MADE
    """
    check_application_permissions(current_user, "update")
    
    agency_id = current_user.agency_id if current_user.role != UserRole.super_admin else None
    application = await application_service.get_application(
        db,
        application_id,
        agency_id
    )
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    application = await application_service.make_offer(
        db,
        application,
        offer_data.amount,
        current_user
    )
    
    return ApplicationResponse.model_validate(application)


@router.post("/{application_id}/offer/respond", response_model=ApplicationResponse)
async def respond_to_offer(
    application_id: UUID,
    response_data: OfferRespond,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Candidate responds to offer
    
    **If accepted**: → OFFER_ACCEPTED
    **If rejected**: → REJECTED
    """
    check_application_permissions(current_user, "update")
    
    agency_id = current_user.agency_id if current_user.role != UserRole.super_admin else None
    application = await application_service.get_application(
        db,
        application_id,
        agency_id
    )
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    application = await application_service.respond_to_offer(
        db,
        application,
        response_data.accepted,
        response_data.start_date,
        current_user
    )
    
    return ApplicationResponse.model_validate(application)


@router.post("/{application_id}/hire", response_model=ApplicationResponse)
async def hire_candidate(
    application_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark candidate as hired
    
    **Required permissions**: agency_admin, recruiter
    
    **Status change**: → HIRED
    **Candidate status**: → PLACED
    """
    check_application_permissions(current_user, "update")
    
    agency_id = current_user.agency_id if current_user.role != UserRole.super_admin else None
    application = await application_service.get_application(
        db,
        application_id,
        agency_id
    )
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    application = await application_service.hire_candidate(
        db,
        application,
        current_user
    )
    
    return ApplicationResponse.model_validate(application)


@router.post("/{application_id}/reject", response_model=ApplicationResponse)
async def reject_application(
    application_id: UUID,
    rejection_data: ApplicationReject,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Reject an application
    
    **Required permissions**: agency_admin, recruiter
    
    **Status change**: → REJECTED
    """
    check_application_permissions(current_user, "update")
    
    agency_id = current_user.agency_id if current_user.role != UserRole.super_admin else None
    application = await application_service.get_application(
        db,
        application_id,
        agency_id
    )
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    application = await application_service.reject_application(
        db,
        application,
        rejection_data.reason,
        rejection_data.notes or "",
        current_user
    )
    
    # SEND REJECTION EMAIL
    try:
        from app.services.email_automation_service import EmailAutomationService
        
        # Load necessary relations
        await db.refresh(application, ["candidate", "job"])
        await db.refresh(application.job, ["agency"])
        
        await EmailAutomationService.send_status_update(
            candidate_email=application.candidate.email,
            candidate_name=application.candidate.full_name,
            job_title=application.job.title,
            company_name=application.job.agency.name,
            new_status='rejected',
            message=rejection_data.notes
        )
    except Exception as e:
        print(f"Error sending rejection email: {e}")
        
    return ApplicationResponse.model_validate(application)


@router.post("/{application_id}/withdraw", response_model=ApplicationResponse)
async def withdraw_application(
    application_id: UUID,
    withdrawal_data: ApplicationWithdraw,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Candidate withdraws application
    
    **Status change**: → WITHDRAWN
    """
    agency_id = current_user.agency_id if current_user.role != UserRole.super_admin else None
    application = await application_service.get_application(
        db,
        application_id,
        agency_id
    )
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    application = await application_service.withdraw_application(
        db,
        application,
        withdrawal_data.reason
    )
    
    return ApplicationResponse.model_validate(application)
