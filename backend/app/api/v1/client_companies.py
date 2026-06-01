"""
Client Company API endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import uuid
import os
import aiofiles
from fastapi import UploadFile, File
from sqlalchemy import select, func
from datetime import datetime, timedelta
from app.models.client_company import CompanyProfileView
from app.models.job import JobView, Job
from app.models.application import Application, ApplicationStatus

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import User, UserRole
from app.models.client_company import ClientCompany
from app.schemas import (
    ClientCompanyCreate,
    ClientCompanyUpdate,
    ClientCompanyResponse,
    ClientCompanyBrief,
    MessageResponse,
)
from app.services.client_company_service import client_company_service

router = APIRouter()


def check_client_company_permissions(user: User, action: str = "view"):
    """Check if user has permission for client company operations"""
    if action == "view":
        # All authenticated users can view client companies
        return True
    
    if action in ["create", "update", "delete"]:
        # Only agency_admin and recruiter can manage client companies
        if user.role not in [UserRole.super_admin, UserRole.agency_admin, UserRole.recruiter]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to perform this action"
            )
    
    return True


@router.post("/", response_model=ClientCompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_client_company(
    company_data: ClientCompanyCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new client company
    
    **Required permissions**: agency_admin, recruiter
    
    **Creates**: Client company record associated with current agency
    """
    check_client_company_permissions(current_user, "create")
    
    company = await client_company_service.create_client_company(
        db,
        company_data,
        current_user.agency_id
    )
    
    return ClientCompanyResponse.model_validate(company)


@router.get("/", response_model=dict)
async def list_client_companies(
    search: Optional[str] = Query(None, description="Search by name or industry"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all client companies for current agency
    
    **Filters**:
    - Search by name or industry
    - Filter by active status
    - Pagination support
    
    **Returns**: List of client companies with pagination metadata
    """
    agency_id = current_user.agency_id if current_user.role != UserRole.super_admin else None
    companies, total = await client_company_service.list_client_companies(
        db,
        agency_id,
        search=search,
        is_active=is_active,
        skip=skip,
        limit=limit
    )
    
    return {
        "companies": [ClientCompanyBrief.model_validate(c) for c in companies],
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total
    }


@router.get("/me/profile", response_model=ClientCompanyResponse)
async def get_my_client_company(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get my client company details - Auto-creates if missing for clients"""
    company = await client_company_service.get_client_company_by_user_id(db, current_user.id)

    if not company:
        # Team members (recruiter/agency_admin) share the agency's company
        result = await db.execute(
            select(ClientCompany).where(ClientCompany.agency_id == current_user.agency_id)
        )
        company = result.scalar_one_or_none()

    if not company and current_user.role == UserRole.client:
        # Auto-create profile if missing for a client user
        from app.schemas.client_company import ClientCompanyCreate
        from app.models.agency import Agency

        stmt = select(Agency).where(Agency.id == current_user.agency_id)
        result = await db.execute(stmt)
        agency = result.scalar_one_or_none()

        company_data = ClientCompanyCreate(
            name=agency.name if agency else f"{current_user.first_name}'s Company",
            contact_email=current_user.email,
            contact_name=f"{current_user.first_name} {current_user.last_name}"
        )
        company = await client_company_service.create_client_company(
            db, company_data, current_user.agency_id
        )
        company.user_id = current_user.id
        db.add(company)
        await db.commit()
        await db.refresh(company)

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    return ClientCompanyResponse.model_validate(company)

@router.put("/me/profile", response_model=ClientCompanyResponse)
async def update_my_client_company(
    company_data: ClientCompanyUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update my client company details"""
    company = await client_company_service.get_client_company_by_user_id(db, current_user.id)
    if not company:
        result = await db.execute(
            select(ClientCompany).where(ClientCompany.agency_id == current_user.agency_id)
        )
        company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    company = await client_company_service.update_client_company(db, company, company_data)
    return ClientCompanyResponse.model_validate(company)


@router.get("/{company_id}", response_model=ClientCompanyResponse)
async def get_client_company(
    company_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get client company details by ID
    
    **Returns**: Complete client company information
    """
    agency_id = current_user.agency_id if current_user.role != UserRole.super_admin else None
    company = await client_company_service.get_client_company(
        db,
        company_id,
        agency_id
    )
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client company not found"
        )
    
    return ClientCompanyResponse.model_validate(company)


@router.put("/{company_id}", response_model=ClientCompanyResponse)
async def update_client_company(
    company_id: UUID,
    company_data: ClientCompanyUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update client company details
    
    **Required permissions**: agency_admin, recruiter
    
    **Note**: Only updates provided fields (partial update)
    """
    check_client_company_permissions(current_user, "update")
    
    agency_id = current_user.agency_id if current_user.role != UserRole.super_admin else None
    company = await client_company_service.get_client_company(
        db,
        company_id,
        agency_id
    )
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client company not found"
        )
    
    company = await client_company_service.update_client_company(
        db,
        company,
        company_data
    )
    
    return ClientCompanyResponse.model_validate(company)


@router.delete("/{company_id}", response_model=MessageResponse)
async def delete_client_company(
    company_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a client company
    
    **Required permissions**: agency_admin, recruiter
    
    **Warning**: This will set client_company_id to NULL for all associated jobs
    """
    check_client_company_permissions(current_user, "delete")
    
    agency_id = current_user.agency_id if current_user.role != UserRole.super_admin else None
    company = await client_company_service.get_client_company(
        db,
        company_id,
        agency_id
    )
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client company not found"
        )
    
    await client_company_service.delete_client_company(db, company)
    
    return MessageResponse(message="Client company deleted successfully")


@router.post("/upload-logo")
async def upload_company_logo(
    logo: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload company logo"""
    # Validate file type
    if not logo.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Validate user is company/client
    if current_user.role != UserRole.client and current_user.role != UserRole.agency_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only companies can upload logos")
    
    # Generate unique filename
    file_ext = logo.filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{file_ext}"
    filepath = f"uploads/company-logos/{filename}"
    
    # Save file
    os.makedirs("uploads/company-logos", exist_ok=True)
    async with aiofiles.open(filepath, "wb") as f:
        content = await logo.read()
        await f.write(content)
    
    # Get company
    company = await client_company_service.get_client_company_by_user_id(db, current_user.id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Update company record
    company.logo_url = f"http://localhost:8000/static/{filepath}"
    # Update user avatar_url to sync globally on the frontend sidebar
    current_user.avatar_url = company.logo_url
    
    db.add(company)
    db.add(current_user)
    await db.commit()
    
    return {
        'logo_url': company.logo_url,
        'message': 'Logo uploaded successfully'
    }

@router.get("/profile-analytics/views")
@router.get("/profile-analytics/view")
async def get_company_analytics(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get company profile analytics"""
    
    # Get company
    company = await client_company_service.get_client_company_by_user_id(db, current_user.id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Profile views this week
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    # Use scalar queries for counting
    stmt_views_this_week = select(func.count(CompanyProfileView.id)).where(
        CompanyProfileView.company_id == company.id,
        CompanyProfileView.viewed_at >= week_ago
    )
    result = await db.execute(stmt_views_this_week)
    views_this_week = result.scalar() or 0
    
    # Profile views last week
    two_weeks_ago = datetime.utcnow() - timedelta(days=14)
    stmt_views_last_week = select(func.count(CompanyProfileView.id)).where(
        CompanyProfileView.company_id == company.id,
        CompanyProfileView.viewed_at >= two_weeks_ago,
        CompanyProfileView.viewed_at < week_ago
    )
    result = await db.execute(stmt_views_last_week)
    views_last_week = result.scalar() or 0
    
    # Calculate change percentage
    change = 0
    if views_last_week > 0:
        change = round(((views_this_week - views_last_week) / views_last_week) * 100)
    
    # Check jobs related counts
    stmt_job_ids = select(Job.id).where(Job.client_company_id == company.id)
    result = await db.execute(stmt_job_ids)
    job_ids = result.scalars().all()
    
    job_views_this_week = 0
    total_applications = 0
    scheduled_interviews = 0
    
    if job_ids:
        # Job views
        stmt_job_views = select(func.count(JobView.id)).where(
            JobView.job_id.in_(job_ids),
            JobView.viewed_at >= week_ago
        )
        result = await db.execute(stmt_job_views)
        job_views_this_week = result.scalar() or 0
        
        # Total Applications
        stmt_apps = select(func.count(Application.id)).where(
            Application.job_id.in_(job_ids)
        )
        result = await db.execute(stmt_apps)
        total_applications = result.scalar() or 0
        
        # Scheduled Interviews (Include both scheduled and completed for this metric)
        stmt_interview = select(func.count(Application.id)).where(
            Application.job_id.in_(job_ids),
            Application.status.in_([
                ApplicationStatus.interview_scheduled,
                ApplicationStatus.interviewed
            ])
        )
        result = await db.execute(stmt_interview)
        scheduled_interviews = result.scalar() or 0
    
    return {
        'profile_views': views_this_week,
        'profile_views_change': change,
        'job_views': job_views_this_week,
        'active_jobs': company.active_jobs,
        'total_applications': total_applications,
        'scheduled_interviews': scheduled_interviews
    }

@router.post("/{company_id}/track-profile-view")
async def track_company_profile_view(
    company_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Track when a candidate views company profile"""
    
    # Don't track if company viewing their own profile
    company = await client_company_service.get_client_company(db, company_id, None)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if company.user_id == current_user.id:
        return {'message': 'Own view not tracked'}
    
    # Record view
    view = CompanyProfileView(
        company_id=company.id,
        viewer_user_id=current_user.id
    )
    db.add(view)
    
    # Increment view count
    company.profile_views_count += 1
    db.add(company)
    
    await db.commit()
    return {'message': 'View tracked'}
