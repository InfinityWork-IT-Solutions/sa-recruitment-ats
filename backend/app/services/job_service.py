"""
Job service - Business logic for job operations
"""
from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from uuid import UUID

from app.models import Job, User, JobStatus
from app.schemas import JobCreate, JobUpdate, JobFilter


class JobService:
    """Job service"""
    
    @staticmethod
    async def create_job(
        db: AsyncSession,
        job_data: JobCreate,
        agency_id: UUID,
        user: User
    ) -> Job:
        """
        Create a new job
        
        Args:
            db: Database session
            job_data: Job creation data
            agency_id: Agency ID (from current user)
            user: Current user
            
        Returns:
            Created job
        """
        # Generate job reference
        reference = await JobService._generate_job_reference(db, agency_id)
        
        # Create job
        job_dict = job_data.model_dump()
        job = Job(
            **job_dict,
            agency_id=agency_id,
            created_by=user.id,
            reference=reference,
            status=JobStatus.draft,
        )
        
        db.add(job)
        await db.commit()
        await db.refresh(job)
        
        return job
    
    @staticmethod
    async def get_job(
        db: AsyncSession,
        job_id: UUID,
        agency_id: UUID
    ) -> Optional[Job]:
        """Get job by ID (within agency)"""
        stmt = select(Job).options(selectinload(Job.client_company)).where(Job.id == job_id)
        if agency_id:
            stmt = stmt.where(Job.agency_id == agency_id)
            
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_job_by_reference(
        db: AsyncSession,
        reference: str,
        agency_id: UUID
    ) -> Optional[Job]:
        """Get job by reference (within agency)"""
        stmt = select(Job).where(Job.reference == reference)
        if agency_id:
            stmt = stmt.where(Job.agency_id == agency_id)
            
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_jobs(
        db: AsyncSession,
        agency_id: UUID,
        filters: JobFilter
    ) -> Tuple[List[Job], int]:
        """
        List jobs with filters and pagination
        
        Returns:
            Tuple of (jobs, total_count)
        """
        # Base query
        query = select(Job)
        if agency_id:
            query = query.where(Job.agency_id == agency_id)
        
        # Apply filters
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.where(
                or_(
                    Job.title.ilike(search_term),
                    Job.description.ilike(search_term),
                    Job.reference.ilike(search_term)
                )
            )
        
        if filters.status:
            query = query.where(Job.status == filters.status)
        
        if filters.employment_type:
            query = query.where(Job.employment_type == filters.employment_type)
        
        if filters.experience_level:
            query = query.where(Job.experience_level == filters.experience_level)
        
        if filters.is_remote is not None:
            query = query.where(Job.is_remote == filters.is_remote)
        
        if filters.city:
            query = query.where(Job.city.ilike(f"%{filters.city}%"))
        
        if filters.province:
            query = query.where(Job.province.ilike(f"%{filters.province}%"))
        
        if filters.client_company_id:
            query = query.where(Job.client_company_id == filters.client_company_id)
        
        if filters.is_urgent is not None:
            query = query.where(Job.is_urgent == filters.is_urgent)
        
        # Skills filter (PostgreSQL array contains)
        if filters.skills:
            for skill in filters.skills:
                query = query.where(Job.skills.contains([skill]))
        
        # Salary filter
        if filters.salary_min:
            query = query.where(
                or_(
                    Job.salary_min >= filters.salary_min,
                    Job.salary_max >= filters.salary_min
                )
            )
        
        if filters.salary_max:
            query = query.where(Job.salary_min <= filters.salary_max)
        
        # Get total count before pagination
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total_count = total_result.scalar()
        
        # Sorting
        if filters.sort_by == "created_at":
            order_col = Job.created_at
        elif filters.sort_by == "title":
            order_col = Job.title
        elif filters.sort_by == "closing_date":
            order_col = Job.closing_date
        elif filters.sort_by == "applications_count":
            order_col = Job.applications_count
        else:
            order_col = Job.created_at
        
        if filters.sort_order == "desc":
            query = query.order_by(order_col.desc())
        else:
            query = query.order_by(order_col.asc())
        
        # Pagination
        query = query.offset(filters.skip).limit(filters.limit)
        
        # Execute query
        result = await db.execute(query)
        jobs = result.scalars().all()
        
        return jobs, total_count
    
    @staticmethod
    async def update_job(
        db: AsyncSession,
        job: Job,
        job_data: JobUpdate
    ) -> Job:
        """Update job"""
        # Update only provided fields
        for field, value in job_data.model_dump(exclude_unset=True).items():
            setattr(job, field, value)
        
        job.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(job)
        
        return job
    
    @staticmethod
    async def delete_job(
        db: AsyncSession,
        job: Job
    ) -> None:
        """Delete job"""
        await db.delete(job)
        await db.commit()
    
    @staticmethod
    async def publish_job(
        db: AsyncSession,
        job: Job
    ) -> Job:
        """Publish job (change status to active)"""
        if job.status == JobStatus.active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job is already published"
            )
        
        job.publish()  # Uses model method
        
        await db.commit()
        await db.refresh(job)
        
        return job
    
    @staticmethod
    async def close_job(
        db: AsyncSession,
        job: Job,
        reason: Optional[str] = None
    ) -> Job:
        """Close job"""
        if job.status in [JobStatus.closed, JobStatus.filled]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job is already closed"
            )
        
        job.close()  # Uses model method
        
        await db.commit()
        await db.refresh(job)
        
        return job
    
    @staticmethod
    async def mark_job_as_filled(
        db: AsyncSession,
        job: Job
    ) -> Job:
        """Mark job as filled"""
        job.mark_as_filled()  # Uses model method
        
        await db.commit()
        await db.refresh(job)
        
        return job
    
    @staticmethod
    async def update_job_status(
        db: AsyncSession,
        job: Job,
        new_status: JobStatus,
        reason: Optional[str] = None
    ) -> Job:
        """Update job status"""
        job.status = new_status
        
        if new_status == JobStatus.active and not job.published_at:
            job.published_at = datetime.utcnow()
        
        if new_status in [JobStatus.closed, JobStatus.filled] and not job.closed_at:
            job.closed_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(job)
        
        return job
    
    @staticmethod
    async def get_job_statistics(
        db: AsyncSession,
        agency_id: UUID
    ) -> dict:
        """Get job statistics for agency"""
        # Base filters
        base_stmt = select(Job)
        if agency_id:
            base_stmt = base_stmt.where(Job.agency_id == agency_id)
            
        # Total jobs
        total_result = await db.execute(
            select(func.count(Job.id)).select_from(base_stmt.subquery())
        )
        total_jobs = total_result.scalar() or 0
        
        # Active jobs
        active_result = await db.execute(
            select(func.count(Job.id))
            .select_from(base_stmt.where(Job.status == JobStatus.active).subquery())
        )
        active_jobs = active_result.scalar() or 0
        
        # Draft jobs
        draft_result = await db.execute(
            select(func.count(Job.id))
            .select_from(base_stmt.where(Job.status == JobStatus.draft).subquery())
        )
        draft_jobs = draft_result.scalar() or 0
        
        # Closed jobs
        closed_result = await db.execute(
            select(func.count(Job.id))
            .select_from(base_stmt.where(Job.status == JobStatus.closed).subquery())
        )
        closed_jobs = closed_result.scalar() or 0
        
        # Filled jobs
        filled_result = await db.execute(
            select(func.count(Job.id))
            .select_from(base_stmt.where(Job.status == JobStatus.filled).subquery())
        )
        filled_jobs = filled_result.scalar() or 0
        
        # Total applications
        apps_stmt = select(func.sum(Job.applications_count))
        if agency_id:
            apps_stmt = apps_stmt.where(Job.agency_id == agency_id)
        apps_result = await db.execute(apps_stmt)
        total_applications = apps_result.scalar() or 0
        
        # Average applications per job
        avg_applications = total_applications / total_jobs if total_jobs > 0 else 0
        
        return {
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "draft_jobs": draft_jobs,
            "closed_jobs": closed_jobs,
            "filled_jobs": filled_jobs,
            "total_applications": total_applications,
            "avg_applications_per_job": round(avg_applications, 2)
        }
    
    @staticmethod
    async def _generate_job_reference(
        db: AsyncSession,
        agency_id: UUID
    ) -> str:
        """Generate unique job reference: JOB-2026-0001"""
        year = datetime.utcnow().year
        
        # Get count of jobs for this agency this year
        count_result = await db.execute(
            select(func.count(Job.id)).where(
                Job.agency_id == agency_id,
                func.extract('year', Job.created_at) == year
            )
        )
        count = count_result.scalar()
        
        # Generate reference
        reference = f"JOB-{year}-{count + 1:04d}"
        
        return reference


# Create service instance
job_service = JobService()
