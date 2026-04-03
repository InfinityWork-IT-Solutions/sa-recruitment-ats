"""
Client Company service - Business logic for client company operations
"""
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.models import ClientCompany
from app.schemas import ClientCompanyCreate, ClientCompanyUpdate


class ClientCompanyService:
    """Client Company service"""
    
    @staticmethod
    async def create_client_company(
        db: AsyncSession,
        company_data: ClientCompanyCreate,
        agency_id: UUID
    ) -> ClientCompany:
        """Create a new client company"""
        company_dict = company_data.model_dump()
        company = ClientCompany(
            **company_dict,
            agency_id=agency_id
        )
        
        db.add(company)
        await db.commit()
        await db.refresh(company)
        
        return company
    
    @staticmethod
    async def get_client_company(
        db: AsyncSession,
        company_id: UUID,
        agency_id: UUID
    ) -> Optional[ClientCompany]:
        """Get client company by ID (within agency)"""
        stmt = select(ClientCompany).where(ClientCompany.id == company_id).options(
            selectinload(ClientCompany.jobs)
        )
        if agency_id:
            stmt = stmt.where(ClientCompany.agency_id == agency_id)
        
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_client_companies(
        db: AsyncSession,
        agency_id: UUID,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[ClientCompany], int]:
        """
        List client companies with filters
        
        Returns:
            Tuple of (companies, total_count)
        """
        # Base query
        query = select(ClientCompany).options(
            selectinload(ClientCompany.jobs)
        )
        if agency_id:
            query = query.where(ClientCompany.agency_id == agency_id)
        
        # Apply filters
        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    ClientCompany.name.ilike(search_term),
                    ClientCompany.industry.ilike(search_term)
                )
            )
        
        if is_active is not None:
            query = query.where(ClientCompany.is_active == is_active)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total_count = total_result.scalar()
        
        # Apply pagination and sorting
        query = query.order_by(ClientCompany.name.asc())
        query = query.offset(skip).limit(limit)
        
        # Execute
        result = await db.execute(query)
        companies = result.scalars().all()
        
        return companies, total_count
    
    @staticmethod
    async def update_client_company(
        db: AsyncSession,
        company: ClientCompany,
        company_data: ClientCompanyUpdate
    ) -> ClientCompany:
        """Update client company"""
        for field, value in company_data.model_dump(exclude_unset=True).items():
            setattr(company, field, value)
        
        await db.commit()
        await db.refresh(company)
        
        return company
    
    @staticmethod
    async def delete_client_company(
        db: AsyncSession,
        company: ClientCompany
    ) -> None:
        """Delete client company"""
        await db.delete(company)
        await db.commit()


# Create service instance
client_company_service = ClientCompanyService()
