"""
Candidate service - Business logic for candidate operations
"""
from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload
from uuid import UUID
import os

from app.models import Candidate, User, CandidateStatus
from app.schemas import CandidateCreate, CandidateUpdate, CandidateFilter


class CandidateService:
    """Candidate service"""
    
    @staticmethod
    async def create_candidate(
        db: AsyncSession,
        candidate_data: CandidateCreate,
        agency_id: UUID,
        user: User,
        consent_ip: Optional[str] = None
    ) -> Candidate:
        """
        Create a new candidate
        
        Args:
            db: Database session
            candidate_data: Candidate creation data
            agency_id: Agency ID
            user: Current user
            consent_ip: IP address for consent tracking
            
        Returns:
            Created candidate
        """
        candidate_dict = candidate_data.model_dump()
        
        # Set consent tracking
        if candidate_dict.get('consent_to_contact'):
            candidate_dict['consent_date'] = datetime.utcnow()
            candidate_dict['consent_ip'] = consent_ip
        
        candidate = Candidate(
            **candidate_dict,
            agency_id=agency_id,
            added_by=user.id,
            status=CandidateStatus.ACTIVE
        )
        
        db.add(candidate)
        await db.commit()
        await db.refresh(candidate)
        
        return candidate
    
    @staticmethod
    async def get_candidate(
        db: AsyncSession,
        candidate_id: UUID,
        agency_id: UUID
    ) -> Optional[Candidate]:
        """Get candidate by ID (within agency)"""
        result = await db.execute(
            select(Candidate)
            .where(Candidate.id == candidate_id, Candidate.agency_id == agency_id)
            .options(selectinload(Candidate.applications))
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_candidate_by_email(
        db: AsyncSession,
        email: str,
        agency_id: UUID
    ) -> Optional[Candidate]:
        """Get candidate by email (within agency)"""
        result = await db.execute(
            select(Candidate).where(
                func.lower(Candidate.email) == email.lower(),
                Candidate.agency_id == agency_id
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_candidates(
        db: AsyncSession,
        agency_id: UUID,
        filters: CandidateFilter
    ) -> Tuple[List[Candidate], int]:
        """
        List candidates with filters and pagination
        
        Returns:
            Tuple of (candidates, total_count)
        """
        # Base query
        query = select(Candidate).where(Candidate.agency_id == agency_id)
        
        # Apply filters
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.where(
                or_(
                    Candidate.first_name.ilike(search_term),
                    Candidate.last_name.ilike(search_term),
                    Candidate.email.ilike(search_term),
                    Candidate.current_job_title.ilike(search_term)
                )
            )
        
        if filters.status:
            query = query.where(Candidate.status == filters.status)
        
        if filters.city:
            query = query.where(Candidate.city.ilike(f"%{filters.city}%"))
        
        if filters.province:
            query = query.where(Candidate.province.ilike(f"%{filters.province}%"))
        
        if filters.years_of_experience_min is not None:
            query = query.where(Candidate.years_of_experience >= filters.years_of_experience_min)
        
        if filters.years_of_experience_max is not None:
            query = query.where(Candidate.years_of_experience <= filters.years_of_experience_max)
        
        if filters.is_willing_to_relocate is not None:
            query = query.where(Candidate.is_willing_to_relocate == filters.is_willing_to_relocate)
        
        if filters.is_immediately_available is not None:
            query = query.where(Candidate.is_immediately_available == filters.is_immediately_available)
        
        if filters.source:
            query = query.where(Candidate.source == filters.source)
        
        # Skills filter (PostgreSQL array contains)
        if filters.skills:
            for skill in filters.skills:
                query = query.where(Candidate.skills.contains([skill]))
        
        # Tags filter
        if filters.tags:
            for tag in filters.tags:
                query = query.where(Candidate.tags.contains([tag]))
        
        # Salary filter
        if filters.expected_salary_min:
            query = query.where(
                or_(
                    Candidate.expected_salary_min >= filters.expected_salary_min,
                    Candidate.expected_salary_max >= filters.expected_salary_min
                )
            )
        
        if filters.expected_salary_max:
            query = query.where(Candidate.expected_salary_min <= filters.expected_salary_max)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total_count = total_result.scalar()
        
        # Sorting
        if filters.sort_by == "created_at":
            order_col = Candidate.created_at
        elif filters.sort_by == "first_name":
            order_col = Candidate.first_name
        elif filters.sort_by == "last_name":
            order_col = Candidate.last_name
        elif filters.sort_by == "years_of_experience":
            order_col = Candidate.years_of_experience
        else:
            order_col = Candidate.created_at
        
        if filters.sort_order == "desc":
            query = query.order_by(order_col.desc())
        else:
            query = query.order_by(order_col.asc())
        
        # Pagination
        query = query.offset(filters.skip).limit(filters.limit)
        
        # Execute
        result = await db.execute(query)
        candidates = result.scalars().all()
        
        return candidates, total_count
    
    @staticmethod
    async def update_candidate(
        db: AsyncSession,
        candidate: Candidate,
        candidate_data: CandidateUpdate
    ) -> Candidate:
        """Update candidate"""
        for field, value in candidate_data.model_dump(exclude_unset=True).items():
            setattr(candidate, field, value)
        
        candidate.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(candidate)
        
        return candidate
    
    @staticmethod
    async def delete_candidate(
        db: AsyncSession,
        candidate: Candidate
    ) -> None:
        """Delete candidate"""
        await db.delete(candidate)
        await db.commit()
    
    @staticmethod
    async def upload_resume(
        db: AsyncSession,
        candidate: Candidate,
        filename: str,
        file_path: str,
        file_size: int
    ) -> Candidate:
        """
        Upload resume for candidate
        
        Args:
            db: Database session
            candidate: Candidate object
            filename: Original filename
            file_path: Path where file is stored (local or S3 URL)
            file_size: File size in bytes
            
        Returns:
            Updated candidate
        """
        candidate.resume_filename = filename
        candidate.resume_url = file_path
        candidate.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(candidate)
        
        return candidate
    
    @staticmethod
    async def update_resume_parsed_data(
        db: AsyncSession,
        candidate: Candidate,
        parsed_data: dict,
        resume_text: Optional[str] = None
    ) -> Candidate:
        """Update candidate with AI-parsed resume data"""
        candidate.resume_parsed_data = parsed_data
        
        if resume_text:
            candidate.resume_text = resume_text
        
        # Auto-update fields from parsed data if not already set
        if parsed_data.get('skills') and not candidate.skills:
            candidate.skills = parsed_data['skills']
        
        if parsed_data.get('education_level') and not candidate.education_level:
            candidate.education_level = parsed_data['education_level']
        
        if parsed_data.get('years_of_experience') and candidate.years_of_experience == 0:
            candidate.years_of_experience = parsed_data['years_of_experience']
        
        await db.commit()
        await db.refresh(candidate)
        
        return candidate
    
    @staticmethod
    async def update_last_contacted(
        db: AsyncSession,
        candidate: Candidate
    ) -> Candidate:
        """Update last contacted timestamp"""
        candidate.last_contacted_at = datetime.utcnow()
        await db.commit()
        await db.refresh(candidate)
        return candidate
    
    @staticmethod
    async def get_candidate_statistics(
        db: AsyncSession,
        agency_id: UUID
    ) -> dict:
        """Get candidate statistics for agency"""
        # Total candidates
        total_result = await db.execute(
            select(func.count(Candidate.id)).where(Candidate.agency_id == agency_id)
        )
        total_candidates = total_result.scalar()
        
        # Active candidates
        active_result = await db.execute(
            select(func.count(Candidate.id)).where(
                Candidate.agency_id == agency_id,
                Candidate.status == CandidateStatus.ACTIVE
            )
        )
        active_candidates = active_result.scalar()
        
        # Passive candidates
        passive_result = await db.execute(
            select(func.count(Candidate.id)).where(
                Candidate.agency_id == agency_id,
                Candidate.status == CandidateStatus.PASSIVE
            )
        )
        passive_candidates = passive_result.scalar()
        
        # Placed candidates
        placed_result = await db.execute(
            select(func.count(Candidate.id)).where(
                Candidate.agency_id == agency_id,
                Candidate.status == CandidateStatus.PLACED
            )
        )
        placed_candidates = placed_result.scalar()
        
        # Total applications
        apps_result = await db.execute(
            select(func.sum(Candidate.applications_count)).where(Candidate.agency_id == agency_id)
        )
        total_applications = apps_result.scalar() or 0
        
        # Average applications per candidate
        avg_applications = total_applications / total_candidates if total_candidates > 0 else 0
        
        return {
            "total_candidates": total_candidates,
            "active_candidates": active_candidates,
            "passive_candidates": passive_candidates,
            "placed_candidates": placed_candidates,
            "total_applications": total_applications,
            "avg_applications_per_candidate": round(avg_applications, 2)
        }


# Create service instance
candidate_service = CandidateService()
