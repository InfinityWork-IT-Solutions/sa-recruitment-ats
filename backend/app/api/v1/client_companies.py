"""
Client Company API endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import User, UserRole
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
