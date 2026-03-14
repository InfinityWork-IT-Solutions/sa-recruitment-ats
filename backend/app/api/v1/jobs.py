"""
Job API endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import User, UserRole
from app.schemas import (
    JobCreate,
    JobUpdate,
    JobResponse,
    JobBrief,
    JobFilter,
    JobStatusUpdate,
    JobStatistics,
    MessageResponse,
)
from app.services.job_service import job_service

router = APIRouter()


def check_job_permissions(user: User, action: str = "view"):
    """Check if user has permission for job operations"""
    if action == "view":
        # All authenticated users can view jobs
        return True
    
    if action in ["create", "update", "delete", "publish"]:
        # Only agency_admin, recruiter can manage jobs
        if user.role not in [UserRole.SUPER_ADMIN, UserRole.AGENCY_ADMIN, UserRole.RECRUITER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to perform this action"
            )
    
    return True


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_data: JobCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new job posting
    
    **Required permissions**: agency_admin, recruiter
    
    **Creates**:
    - Job in DRAFT status
    - Unique job reference (JOB-YYYY-NNNN)
    - Associates job with current user's agency
    """
    check_job_permissions(current_user, "create")
    
    job = await job_service.create_job(
        db,
        job_data,
        current_user.agency_id,
        current_user
    )
    
    return JobResponse.model_validate(job)


@router.get("/", response_model=dict)
async def list_jobs(
    search: Optional[str] = Query(None, description="Search in title, description, reference"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    employment_type: Optional[str] = Query(None, description="Filter by employment type"),
    is_remote: Optional[bool] = Query(None, description="Filter remote jobs"),
    city: Optional[str] = Query(None, description="Filter by city"),
    province: Optional[str] = Query(None, description="Filter by province"),
    is_urgent: Optional[bool] = Query(None, description="Filter urgent jobs"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all jobs for current user's agency
    
    **Filters**:
    - Search by title, description, reference
    - Filter by status, employment type, location
    - Filter remote/urgent jobs
    - Pagination support
    - Sorting support
    
    **Returns**: List of jobs with pagination metadata
    """
    from app.models.job import JobStatus, EmploymentType
    
    # Create filters object
    filters = JobFilter(
        search=search,
        status=JobStatus(status_filter) if status_filter else None,
        employment_type=EmploymentType(employment_type) if employment_type else None,
        is_remote=is_remote,
        city=city,
        province=province,
        is_urgent=is_urgent,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    jobs, total = await job_service.list_jobs(
        db,
        current_user.agency_id,
        filters
    )
    
    return {
        "jobs": [JobBrief.model_validate(job) for job in jobs],
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total
    }


@router.get("/statistics", response_model=JobStatistics)
async def get_job_statistics(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get job statistics for current agency
    
    **Returns**:
    - Total jobs count
    - Jobs by status
    - Application metrics
    """
    stats = await job_service.get_job_statistics(db, current_user.agency_id)
    return JobStatistics(**stats)


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get job details by ID
    
    **Returns**: Complete job information
    """
    job = await job_service.get_job(db, job_id, current_user.agency_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    return JobResponse.model_validate(job)


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: UUID,
    job_data: JobUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update job details
    
    **Required permissions**: agency_admin, recruiter
    
    **Note**: Only updates provided fields (partial update)
    """
    check_job_permissions(current_user, "update")
    
    job = await job_service.get_job(db, job_id, current_user.agency_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    job = await job_service.update_job(db, job, job_data)
    
    return JobResponse.model_validate(job)


@router.delete("/{job_id}", response_model=MessageResponse)
async def delete_job(
    job_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a job
    
    **Required permissions**: agency_admin, recruiter
    
    **Warning**: This permanently deletes the job and all associated applications
    """
    check_job_permissions(current_user, "delete")
    
    job = await job_service.get_job(db, job_id, current_user.agency_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    await job_service.delete_job(db, job)
    
    return MessageResponse(message="Job deleted successfully")


@router.post("/{job_id}/publish", response_model=JobResponse)
async def publish_job(
    job_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Publish a job (change status from DRAFT to ACTIVE)
    
    **Required permissions**: agency_admin, recruiter
    
    **Actions**:
    - Changes status to ACTIVE
    - Sets published_at timestamp
    - Sets default closing_date if not set (30 days)
    """
    check_job_permissions(current_user, "publish")
    
    job = await job_service.get_job(db, job_id, current_user.agency_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    job = await job_service.publish_job(db, job)
    
    return JobResponse.model_validate(job)


@router.post("/{job_id}/close", response_model=JobResponse)
async def close_job(
    job_id: UUID,
    status_update: JobStatusUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Close a job
    
    **Required permissions**: agency_admin, recruiter
    
    **Actions**:
    - Changes status to CLOSED
    - Sets closed_at timestamp
    - Stops accepting new applications
    """
    check_job_permissions(current_user, "update")
    
    job = await job_service.get_job(db, job_id, current_user.agency_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    job = await job_service.close_job(db, job, status_update.reason)
    
    return JobResponse.model_validate(job)


@router.post("/{job_id}/fill", response_model=JobResponse)
async def mark_job_filled(
    job_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark job as filled
    
    **Required permissions**: agency_admin, recruiter
    
    **Actions**:
    - Changes status to FILLED
    - Sets closed_at timestamp
    """
    check_job_permissions(current_user, "update")
    
    job = await job_service.get_job(db, job_id, current_user.agency_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    job = await job_service.mark_job_as_filled(db, job)
    
    return JobResponse.model_validate(job)


@router.put("/{job_id}/status", response_model=JobResponse)
async def update_job_status(
    job_id: UUID,
    status_update: JobStatusUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update job status
    
    **Required permissions**: agency_admin, recruiter
    
    **Allowed transitions**:
    - DRAFT → ACTIVE (publish)
    - ACTIVE → PAUSED, CLOSED, FILLED
    - PAUSED → ACTIVE, CLOSED
    """
    check_job_permissions(current_user, "update")
    
    job = await job_service.get_job(db, job_id, current_user.agency_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    job = await job_service.update_job_status(
        db,
        job,
        status_update.status,
        status_update.reason
    )
    
    return JobResponse.model_validate(job)
