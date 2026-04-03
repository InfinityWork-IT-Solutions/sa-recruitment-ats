"""
Application service - Business logic for application operations
"""
from datetime import datetime
from typing import List, Optional, Tuple, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from uuid import UUID

from app.models import Application, Job, Candidate, User, ApplicationStatus
from app.schemas import ApplicationCreate, ApplicationUpdate, ApplicationFilter


class ApplicationService:
    """Application service"""
    
    @staticmethod
    async def create_application(
        db: AsyncSession,
        application_data: ApplicationCreate,
        agency_id: UUID,
        user: User
    ) -> Application:
        """
        Create a new application
        
        Args:
            db: Database session
            application_data: Application creation data
            agency_id: Agency ID
            user: Current user
            
        Returns:
            Created application
        """
        # Check if candidate already applied to this job
        existing = await db.execute(
            select(Application).where(
                Application.candidate_id == application_data.candidate_id,
                Application.job_id == application_data.job_id
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Candidate has already applied to this job"
            )
        
        # Get job to get client_company_id
        job_result = await db.execute(
            select(Job).where(Job.id == application_data.job_id)
        )
        job = job_result.scalar_one_or_none()
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        
        # Create application
        application_dict = application_data.model_dump()
        application = Application(
            **application_dict,
            agency_id=agency_id,
            client_company_id=job.client_company_id,
            assigned_to=user.id if user else None,
            status=ApplicationStatus.applied
        )
        
        # Initialize status history
        application.add_status_change(ApplicationStatus.applied, user.id if user else None)
        
        db.add(application)
        
        # Update candidate applications count
        candidate_result = await db.execute(
            select(Candidate).where(Candidate.id == application_data.candidate_id)
        )
        candidate = candidate_result.scalar_one_or_none()
        if candidate:
            candidate.applications_count += 1
        
        # Update job applications count
        job.applications_count += 1
        
        await db.commit()
        await db.refresh(application)
        
        return application
    
    @staticmethod
    async def get_application(
        db: AsyncSession,
        application_id: UUID,
        agency_id: UUID
    ) -> Optional[Application]:
        """Get application by ID (within agency)"""
        stmt = select(Application).where(Application.id == application_id).options(
                selectinload(Application.job),
                selectinload(Application.candidate)
            )
        if agency_id:
            stmt = stmt.where(Application.agency_id == agency_id)
            
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_applications(
        db: AsyncSession,
        agency_id: UUID,
        filters: ApplicationFilter
    ) -> Tuple[List[Application], int]:
        """
        List applications with filters
        
        Returns:
            Tuple of (applications, total_count)
        """
        # Base query
        query = select(Application).options(
            selectinload(Application.job),
            selectinload(Application.candidate)
        )
        if agency_id:
            query = query.where(Application.agency_id == agency_id)
        
        # Apply filters
        if filters.job_id:
            query = query.where(Application.job_id == filters.job_id)
        
        if filters.candidate_id:
            query = query.where(Application.candidate_id == filters.candidate_id)
        
        if filters.status:
            query = query.where(Application.status == filters.status)
        
        if filters.assigned_to:
            query = query.where(Application.assigned_to == filters.assigned_to)
        
        if filters.created_after:
            query = query.where(Application.created_at >= filters.created_after)
        
        if filters.created_before:
            query = query.where(Application.created_at <= filters.created_before)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total_count = total_result.scalar()
        
        # Sorting
        if filters.sort_by == "created_at":
            order_col = Application.created_at
        elif filters.sort_by == "match_score":
            order_col = Application.match_score
        else:
            order_col = Application.created_at
        
        if filters.sort_order == "desc":
            query = query.order_by(order_col.desc().nullslast())
        else:
            query = query.order_by(order_col.asc().nullslast())
        
        # Pagination
        query = query.offset(filters.skip).limit(filters.limit)
        
        # Execute
        result = await db.execute(query)
        applications = result.scalars().all()
        
        return applications, total_count
    
    @staticmethod
    async def update_application(
        db: AsyncSession,
        application: Application,
        application_data: ApplicationUpdate,
        user: User
    ) -> Application:
        """Update application"""
        old_status = application.status
        
        for field, value in application_data.model_dump(exclude_unset=True).items():
            setattr(application, field, value)
        
        # Track status change
        if application_data.status and application_data.status != old_status:
            application.add_status_change(application_data.status, user.id)
        
        application.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(application)
        
        return application
    
    @staticmethod
    async def delete_application(
        db: AsyncSession,
        application: Application
    ) -> None:
        """Delete application"""
        # Update counts
        candidate_result = await db.execute(
            select(Candidate).where(Candidate.id == application.candidate_id)
        )
        candidate = candidate_result.scalar_one_or_none()
        if candidate and candidate.applications_count > 0:
            candidate.applications_count -= 1
        
        job_result = await db.execute(
            select(Job).where(Job.id == application.job_id)
        )
        job = job_result.scalar_one_or_none()
        if job and job.applications_count > 0:
            job.applications_count -= 1
        
        await db.delete(application)
        await db.commit()
    
    @staticmethod
    async def screen_application(
        db: AsyncSession,
        application: Application,
        passed: bool,
        score: int,
        notes: str,
        user: User
    ) -> Application:
        """Screen application"""
        if passed:
            application.shortlist(score, notes, user.id)
        else:
            application.screening_score = score
            application.screening_notes = notes
            application.screening_passed = False
            application.screened_at = datetime.utcnow()
            application.screened_by = user.id
            
            # Auto-reject if failed screening
            from app.models.application import RejectionReason
            application.reject(RejectionReason.QUALIFICATIONS, notes, user.id)
        
        application.add_status_change(application.status, user.id)
        
        await db.commit()
        await db.refresh(application)
        
        return application
    
    @staticmethod
    async def schedule_interview(
        db: AsyncSession,
        application: Application,
        interview_time: datetime,
        user: User
    ) -> Application:
        """Schedule interview"""
        application.schedule_interview(interview_time)
        application.add_status_change(application.status, user.id)
        
        # Update candidate interview count
        candidate_result = await db.execute(
            select(Candidate).where(Candidate.id == application.candidate_id)
        )
        candidate = candidate_result.scalar_one_or_none()
        if candidate:
            candidate.interviews_count += 1
        
        await db.commit()
        await db.refresh(application)
        
        return application
    
    @staticmethod
    async def complete_interview(
        db: AsyncSession,
        application: Application,
        rating: int,
        feedback: str,
        user: User
    ) -> Application:
        """Complete interview"""
        application.complete_interview(rating, feedback)
        application.add_status_change(application.status, user.id)
        
        await db.commit()
        await db.refresh(application)
        
        return application
    
    @staticmethod
    async def make_offer(
        db: AsyncSession,
        application: Application,
        amount: int,
        user: User
    ) -> Application:
        """Make job offer"""
        application.make_offer(amount)
        application.add_status_change(application.status, user.id)
        
        await db.commit()
        await db.refresh(application)
        
        return application
    
    @staticmethod
    async def respond_to_offer(
        db: AsyncSession,
        application: Application,
        accepted: bool,
        start_date: Optional[datetime],
        user: User
    ) -> Application:
        """Candidate responds to offer"""
        if accepted:
            application.accept_offer(start_date)
        else:
            application.offer_rejected_at = datetime.utcnow()
            application.status = ApplicationStatus.rejected
        
        application.add_status_change(application.status, user.id)
        
        await db.commit()
        await db.refresh(application)
        
        return application
    
    @staticmethod
    async def hire_candidate(
        db: AsyncSession,
        application: Application,
        user: User
    ) -> Application:
        """Mark candidate as hired"""
        application.hire()
        application.add_status_change(application.status, user.id)
        
        # Update candidate placements count
        candidate_result = await db.execute(
            select(Candidate).where(Candidate.id == application.candidate_id)
        )
        candidate = candidate_result.scalar_one_or_none()
        if candidate:
            candidate.placements_count += 1
            from app.models.candidate import CandidateStatus
            candidate.status = CandidateStatus.placed
        
        await db.commit()
        await db.refresh(application)
        
        return application
    
    @staticmethod
    async def reject_application(
        db: AsyncSession,
        application: Application,
        reason,
        notes: str,
        user: User
    ) -> Application:
        """Reject application"""
        application.reject(reason, notes, user.id)
        application.add_status_change(application.status, user.id)
        
        await db.commit()
        await db.refresh(application)
        
        return application
    
    @staticmethod
    async def withdraw_application(
        db: AsyncSession,
        application: Application,
        reason: str
    ) -> Application:
        """Candidate withdraws application"""
        application.withdraw(reason)
        
        await db.commit()
        await db.refresh(application)
        
        return application
    
    @staticmethod
    async def get_pipeline_for_job(
        db: AsyncSession,
        job_id: UUID,
        agency_id: UUID
    ) -> Dict:
        """Get Kanban pipeline for a job"""
        from app.models.application import ApplicationStatus as AppStatus
        
        # Get all applications for this job
        stmt = select(Application).where(Application.job_id == job_id).options(selectinload(Application.candidate))
        if agency_id:
            stmt = stmt.where(Application.agency_id == agency_id)
            
        result = await db.execute(stmt)
        applications = result.scalars().all()
        
        # Group by status
        pipeline = {}
        for status in AppStatus:
            pipeline[status.value] = {
                "status": status.value,
                "count": 0,
                "applications": []
            }
        
        for app in applications:
            pipeline[app.status.value]["count"] += 1
            pipeline[app.status.value]["applications"].append({
                "id": str(app.id),
                "candidate_id": str(app.candidate_id),
                "candidate_name": app.candidate.full_name if app.candidate else "Unknown",
                "match_score": app.match_score,
                "created_at": app.created_at.isoformat()
            })
        
        return {
            "job_id": str(job_id),
            "stages": list(pipeline.values()),
            "total_applications": len(applications)
        }
    
    @staticmethod
    async def get_application_statistics(
        db: AsyncSession,
        agency_id: UUID
    ) -> dict:
        """Get application statistics"""
        # Base filters
        base_stmt = select(Application)
        if agency_id:
            base_stmt = base_stmt.where(Application.agency_id == agency_id)
            
        # Total applications
        total_result = await db.execute(
            select(func.count(Application.id)).select_from(base_stmt.subquery())
        )
        total_applications = total_result.scalar() or 0
        
        # Count by status
        by_status = {}
        from app.models.application import ApplicationStatus as AppStatus
        for status in AppStatus:
            count_result = await db.execute(
                select(func.count(Application.id))
                .select_from(base_stmt.where(Application.status == status).subquery())
            )
            by_status[status.value] = count_result.scalar() or 0
        
        # Calculate conversion rates
        conversion_rates = {}
        if by_status.get("applied", 0) > 0:
            conversion_rates["screening_rate"] = round(
                (by_status.get("screening", 0) / by_status["applied"]) * 100, 2
            )
            conversion_rates["interview_rate"] = round(
                (by_status.get("interviewed", 0) / by_status["applied"]) * 100, 2
            )
            conversion_rates["hire_rate"] = round(
                (by_status.get("hired", 0) / by_status["applied"]) * 100, 2
            )
        
        return {
            "total_applications": total_applications,
            "by_status": by_status,
            "avg_time_to_hire_days": None,  # TODO: Calculate
            "conversion_rates": conversion_rates
        }


# Create service instance
application_service = ApplicationService()
