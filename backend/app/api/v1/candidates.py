"""
Candidate API endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Request
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import os
import shutil
from pathlib import Path

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import User, UserRole
from app.schemas import (
    CandidateCreate,
    CandidateUpdate,
    CandidateResponse,
    CandidateBrief,
    CandidateFilter,
    CandidateStatistics,
    ResumeUploadResponse,
    MessageResponse,
)
from app.services.candidate_service import candidate_service

router = APIRouter()


def check_candidate_permissions(user: User, action: str = "view"):
    """Check if user has permission for candidate operations"""
    if action == "view":
        # All authenticated users can view candidates
        return True
    
    if action in ["create", "update", "delete"]:
        # Only agency_admin and recruiter can manage candidates
        if user.role not in [UserRole.SUPER_ADMIN, UserRole.AGENCY_ADMIN, UserRole.RECRUITER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to perform this action"
            )
    
    return True


@router.post("/", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
async def create_candidate(
    candidate_data: CandidateCreate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new candidate
    
    **Required permissions**: agency_admin, recruiter
    
    **POPIA Compliance**: Requires consent_to_contact = true
    """
    check_candidate_permissions(current_user, "create")
    
    # Check if candidate already exists (by email)
    existing = await candidate_service.get_candidate_by_email(
        db,
        candidate_data.email,
        current_user.agency_id
    )
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Candidate with this email already exists"
        )
    
    # Get client IP for consent tracking
    client_ip = request.client.host if request.client else None
    
    candidate = await candidate_service.create_candidate(
        db,
        candidate_data,
        current_user.agency_id,
        current_user,
        consent_ip=client_ip
    )
    
    return CandidateResponse.model_validate(candidate)


@router.get("/", response_model=dict)
async def list_candidates(
    search: Optional[str] = Query(None, description="Search in name, email, title"),
    status_filter: Optional[str] = Query(None, alias="status"),
    skills: Optional[str] = Query(None, description="Comma-separated skills"),
    city: Optional[str] = Query(None),
    province: Optional[str] = Query(None),
    years_of_experience_min: Optional[int] = Query(None, ge=0),
    is_immediately_available: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all candidates for current agency
    
    **Filters**:
    - Search by name, email, job title
    - Filter by status, skills, location
    - Filter by experience, availability
    - Pagination support
    - Sorting support
    """
    from app.models.candidate import CandidateStatus
    
    # Parse skills
    skills_list = skills.split(',') if skills else None
    
    # Create filters object
    filters = CandidateFilter(
        search=search,
        status=CandidateStatus(status_filter) if status_filter else None,
        skills=skills_list,
        city=city,
        province=province,
        years_of_experience_min=years_of_experience_min,
        is_immediately_available=is_immediately_available,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    candidates, total = await candidate_service.list_candidates(
        db,
        current_user.agency_id,
        filters
    )
    
    return {
        "candidates": [CandidateBrief.model_validate(c) for c in candidates],
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total
    }


@router.get("/statistics", response_model=CandidateStatistics)
async def get_candidate_statistics(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get candidate statistics for current agency"""
    stats = await candidate_service.get_candidate_statistics(db, current_user.agency_id)
    return CandidateStatistics(**stats)


@router.get("/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(
    candidate_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get candidate details by ID"""
    candidate = await candidate_service.get_candidate(db, candidate_id, current_user.agency_id)
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    return CandidateResponse.model_validate(candidate)


@router.put("/{candidate_id}", response_model=CandidateResponse)
async def update_candidate(
    candidate_id: UUID,
    candidate_data: CandidateUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update candidate details
    
    **Required permissions**: agency_admin, recruiter
    """
    check_candidate_permissions(current_user, "update")
    
    candidate = await candidate_service.get_candidate(db, candidate_id, current_user.agency_id)
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    candidate = await candidate_service.update_candidate(db, candidate, candidate_data)
    
    return CandidateResponse.model_validate(candidate)


@router.delete("/{candidate_id}", response_model=MessageResponse)
async def delete_candidate(
    candidate_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a candidate
    
    **Required permissions**: agency_admin, recruiter
    
    **Warning**: This will delete all associated applications
    """
    check_candidate_permissions(current_user, "delete")
    
    candidate = await candidate_service.get_candidate(db, candidate_id, current_user.agency_id)
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    await candidate_service.delete_candidate(db, candidate)
    
    return MessageResponse(message="Candidate deleted successfully")


@router.post("/{candidate_id}/resume", response_model=ResumeUploadResponse)
async def upload_resume(
    candidate_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload resume for candidate
    
    **Required permissions**: agency_admin, recruiter
    
    **Supported formats**: PDF, DOC, DOCX
    **Max size**: 5MB
    
    **TODO**: Integrate with S3 and AI resume parsing
    """
    check_candidate_permissions(current_user, "update")
    
    candidate = await candidate_service.get_candidate(db, candidate_id, current_user.agency_id)
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    # Validate file type
    allowed_extensions = {".pdf", ".doc", ".docx"}
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Check file size (5MB limit)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 5MB limit"
        )
    
    # Create resumes directory if it doesn't exist
    resumes_dir = Path("/tmp/resumes")  # TODO: Use S3 in production
    resumes_dir.mkdir(parents=True, exist_ok=True)
    
    # Save file
    filename = f"{candidate_id}{file_ext}"
    file_path = resumes_dir / filename
    
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update candidate
    candidate = await candidate_service.upload_resume(
        db,
        candidate,
        file.filename,
        str(file_path),
        file_size
    )
    
    # TODO: Trigger AI resume parsing here
    # parsed_data = await parse_resume_with_ai(file_path)
    # await candidate_service.update_resume_parsed_data(db, candidate, parsed_data)
    
    return ResumeUploadResponse(
        filename=file.filename,
        url=str(file_path),
        size=file_size,
        parsed_data=None  # TODO: Return parsed data
    )


@router.post("/{candidate_id}/contact", response_model=MessageResponse)
async def mark_candidate_contacted(
    candidate_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark candidate as contacted (updates last_contacted_at)
    
    **Required permissions**: agency_admin, recruiter
    """
    check_candidate_permissions(current_user, "update")
    
    candidate = await candidate_service.get_candidate(db, candidate_id, current_user.agency_id)
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    await candidate_service.update_last_contacted(db, candidate)
    
    return MessageResponse(message="Candidate marked as contacted")
