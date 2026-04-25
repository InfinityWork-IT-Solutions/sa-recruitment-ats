"""
RecruitPro SA - AI Decision Queue Service
"Semi-Auto" Mode: AI recommends, Recruiter approves with one click
"""

from typing import List, Dict, Optional, Union
from datetime import datetime
from uuid import UUID, uuid4
from enum import Enum
import os

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_


class DecisionType(str, Enum):
    """Types of AI decisions"""
    AUTO_REJECT = "auto_reject"
    SEND_VIDEO_SCREENING = "send_video_screening"
    FAST_TRACK_INTERVIEW = "fast_track_interview"
    SCHEDULE_INTERVIEW = "schedule_interview"
    SEND_OUTREACH = "send_outreach"


class DecisionStatus(str, Enum):
    """Decision approval status"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    MODIFIED = "modified"


class AIDecisionQueueService:
    """
    Manages AI decision queue for Semi-Auto mode
    
    Flow:
    1. AI analyzes application/candidate
    2. AI creates decision recommendation (PENDING)
    3. Recruiter reviews on dashboard
    4. Recruiter clicks "Approve All" or reviews individual decisions
    5. System executes approved decisions
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_decision(
        self,
        job_id: UUID,
        decision_type: DecisionType,
        ai_reasoning: str,
        ai_confidence: int,  # 0-100
        proposed_action: Dict,  # What the AI wants to do
        application_id: Optional[UUID] = None,
        candidate_id: Optional[UUID] = None,
        created_by_service: str = "automated_screening"
    ) -> Dict:
        """
        Create a new AI decision for recruiter approval
        
        Args:
            job_id: Job this decision relates to
            application_id: Application if applicable
            candidate_id: Candidate if applicable
            decision_type: Type of decision
            ai_reasoning: Why AI made this recommendation
            ai_confidence: How confident AI is (0-100)
            proposed_action: {
                "action": "reject",
                "candidate_name": "John Doe",
                "reason": "Match score 65% - missing key skills",
                "details": {...}
            }
        """
        from app.models import AIDecision
        
        decision = AIDecision(
            job_id=job_id,
            application_id=application_id,
            candidate_id=candidate_id,
            decision_type=decision_type,
            status=DecisionStatus.PENDING,
            ai_reasoning=ai_reasoning,
            ai_confidence=ai_confidence,
            proposed_action=proposed_action,
            created_by_service=created_by_service,
            created_at=datetime.utcnow()
        )
        
        self.db.add(decision)
        await self.db.commit()
        await self.db.refresh(decision)
        
        return {
            'decision_id': decision.id,
            'status': decision.status,
            'decision_type': decision.decision_type
        }
    
    async def get_pending_decisions(
        self,
        job_id: Optional[UUID] = None,
        company_id: Optional[Union[UUID, str]] = None,
        decision_types: Optional[List[DecisionType]] = None
    ) -> Dict:
        """
        Get all pending decisions for dashboard
        Returns grouped summary + individual decisions
        """
        from app.models import AIDecision, Application, Candidate, Job
        from uuid import UUID
        
        # Ensure company_id is UUID
        if isinstance(company_id, str):
            try:
                company_id = UUID(company_id)
            except ValueError:
                pass
        
        # Build query filters
        filters = [AIDecision.status == DecisionStatus.PENDING]
        
        if job_id:
            filters.append(AIDecision.job_id == job_id)
        
        if decision_types:
            filters.append(AIDecision.decision_type.in_(decision_types))
        
        # Base query
        query = select(AIDecision)
        
        # If company_id is provided, join with Job to filter by company
        if company_id:
            query = query.join(Job).where(Job.client_company_id == company_id)
        
        # Apply other filters
        query = query.where(and_(*filters)).order_by(AIDecision.created_at.desc())
        
        # Get pending decisions
        result = await self.db.execute(query)
        
        decisions = result.scalars().all()
        
        # Group by decision type for summary
        # Initialize all known types
        summary = {
            'auto_reject': [],
            'send_video_screening': [],
            'fast_track_interview': [],
            'schedule_interview': [],
            'send_outreach': []
        }
        
        # Fetch related data and organize
        decision_details = []
        
        for decision in decisions:
            # Get candidate details
            candidate = None
            if decision.candidate_id:
                candidate = await self.db.get(Candidate, decision.candidate_id)
            
            # Get job details
            job = await self.db.get(Job, decision.job_id)
            
            decision_detail = {
                'decision_id': str(decision.id),
                'decision_type': decision.decision_type,
                'candidate_name': candidate.full_name if candidate else "Unknown",
                'candidate_email': candidate.email if candidate else None,
                'job_title': job.title if job else "Unknown",
                'ai_reasoning': decision.ai_reasoning,
                'ai_confidence': decision.ai_confidence,
                'proposed_action': decision.proposed_action,
                'created_at': decision.created_at.isoformat()
            }
            
            # Add to summary group safely
            dtype_key = decision.decision_type
            if dtype_key in summary:
                summary[dtype_key].append(decision_detail)
            else:
                # If it's a new or unknown type, add it dynamically
                summary[dtype_key] = [decision_detail]
                
            decision_details.append(decision_detail)
        
        # Calculate totals
        totals = {
            'total_pending': len(decisions),
            'auto_reject_count': len(summary.get('auto_reject', [])),
            'video_screening_count': len(summary.get('send_video_screening', [])),
            'fast_track_count': len(summary.get('fast_track_interview', [])),
            'schedule_interview_count': len(summary.get('schedule_interview', [])),
            'send_outreach_count': len(summary.get('send_outreach', []))
        }
        
        return {
            'totals': totals,
            'summary': summary,
            'all_decisions': decision_details
        }
    
    async def approve_all_decisions(
        self,
        decision_ids: List[UUID],
        approved_by: UUID,  # Recruiter user ID
        execute_immediately: bool = True
    ) -> Dict:
        """
        Approve multiple decisions at once (the "Approve All" button!)
        
        This is the MAGIC of Semi-Auto mode:
        - Recruiter clicks ONE button
        - All AI decisions execute
        - Saves 10 hours of work
        - Recruiter still in control
        """
        from app.models import AIDecision
        
        approved_count = 0
        executed_count = 0
        errors = []
        
        for decision_id in decision_ids:
            try:
                decision = await self.db.get(AIDecision, decision_id)
                
                if not decision or decision.status != DecisionStatus.PENDING:
                    continue
                
                # Mark as approved
                decision.status = DecisionStatus.APPROVED
                decision.approved_by = approved_by
                decision.approved_at = datetime.utcnow()
                
                approved_count += 1
                
                # Execute the decision if requested
                if execute_immediately:
                    success = await self._execute_decision(decision)
                    
                    if success:
                        decision.executed_at = datetime.utcnow()
                        executed_count += 1
                    else:
                        errors.append({
                            'decision_id': str(decision_id),
                            'error': 'Execution failed'
                        })
                
            except Exception as e:
                errors.append({
                    'decision_id': str(decision_id),
                    'error': str(e)
                })
        
        await self.db.commit()
        
        return {
            'approved_count': approved_count,
            'executed_count': executed_count,
            'errors': errors,
            'success': approved_count > 0
        }
    
    async def approve_single_decision(
        self,
        decision_id: UUID,
        approved_by: UUID,
        modifications: Optional[Dict] = None
    ) -> Dict:
        """
        Approve a single decision (optionally with modifications)
        
        This is for recruiters who want to review individual decisions
        """
        from app.models import AIDecision
        
        decision = await self.db.get(AIDecision, decision_id)
        
        if not decision:
            raise ValueError("Decision not found")
        
        if decision.status != DecisionStatus.PENDING:
            raise ValueError(f"Decision already {decision.status}")
        
        # Apply modifications if provided
        if modifications:
            decision.status = DecisionStatus.MODIFIED
            decision.proposed_action.update(modifications)
            decision.modifications = modifications
        else:
            decision.status = DecisionStatus.APPROVED
        
        decision.approved_by = approved_by
        decision.approved_at = datetime.utcnow()
        
        # Execute
        success = await self._execute_decision(decision)
        
        if success:
            decision.executed_at = datetime.utcnow()
        
        await self.db.commit()
        
        return {
            'success': success,
            'decision_id': str(decision.id),
            'status': decision.status
        }
    
    async def reject_decision(
        self,
        decision_id: UUID,
        rejected_by: UUID,
        reason: str
    ) -> Dict:
        """
        Reject an AI decision (recruiter disagrees)
        """
        from app.models import AIDecision
        
        decision = await self.db.get(AIDecision, decision_id)
        
        if not decision:
            raise ValueError("Decision not found")
        
        decision.status = DecisionStatus.REJECTED
        decision.approved_by = rejected_by
        decision.approved_at = datetime.utcnow()
        decision.rejection_reason = reason
        
        await self.db.commit()
        
        return {
            'success': True,
            'decision_id': str(decision.id),
            'status': 'rejected'
        }
    
    async def _execute_decision(self, decision) -> bool:
        """
        Execute an approved decision
        
        This is where the actual automation happens:
        - Send rejection email
        - Send video screening invite
        - Schedule interview
        - etc.
        """
        from app.models import Application
        
        try:
            if decision.decision_type == DecisionType.AUTO_REJECT:
                # Send rejection email
                await self._execute_rejection(decision)
                
                # Update application status
                if decision.application_id:
                    application = await self.db.get(Application, decision.application_id)
                    if application:
                        application.status = 'rejected'
            
            elif decision.decision_type == DecisionType.SEND_VIDEO_SCREENING:
                # Send video screening invitation
                await self._execute_video_screening_invite(decision)
                
                # Update application status
                if decision.application_id:
                    application = await self.db.get(Application, decision.application_id)
                    if application:
                        application.status = 'video_screening'
            
            elif decision.decision_type == DecisionType.FAST_TRACK_INTERVIEW:
                # Fast-track to interview
                await self._execute_interview_invite(decision)
                
                # Update application status
                if decision.application_id:
                    application = await self.db.get(Application, decision.application_id)
                    if application:
                        application.status = 'interview'
            
            elif decision.decision_type == DecisionType.SCHEDULE_INTERVIEW:
                # Auto-schedule interview
                await self._execute_interview_scheduling(decision)
            
            elif decision.decision_type == DecisionType.SEND_OUTREACH:
                # Send sourcing outreach
                await self._execute_outreach(decision)
            
            await self.db.commit()
            return True
            
        except Exception as e:
            print(f"Error executing decision {decision.id}: {e}")
            return False
    
    async def _execute_rejection(self, decision):
        """Execute rejection - send email"""
        from app.services.email_service import EmailService
        from app.models import Candidate, Job
        
        candidate = await self.db.get(Candidate, decision.candidate_id)
        job = await self.db.get(Job, decision.job_id)
        
        if not candidate or not job:
            return
        
        email_service = EmailService()
        
        await email_service.send_rejection_email(
            candidate_email=candidate.email,
            candidate_name=candidate.full_name,
            job_title=job.title,
            company_name=job.company.name,
            reason=decision.proposed_action.get('reason')
        )
    
    async def _execute_video_screening_invite(self, decision):
        """Execute video screening invitation"""
        from app.services.video_screening_service import VideoScreeningService
        
        service = VideoScreeningService(
            db=self.db,
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            assemblyai_api_key=os.getenv("ASSEMBLYAI_API_KEY")
        )
        
        await service.create_video_screening_invitation(
            application_id=decision.application_id,
            candidate_id=decision.candidate_id,
            job_id=decision.job_id
        )
    
    async def _execute_interview_invite(self, decision):
        """Execute interview invitation"""
        from app.services.interview_scheduling_service import InterviewSchedulingService
        from app.services.email_service import EmailService
        
        service = InterviewSchedulingService(
            db=self.db,
            email_service=EmailService()
        )
        
        await service.auto_schedule_interview(
            application_id=decision.application_id,
            candidate_id=decision.candidate_id,
            job_id=decision.job_id
        )
    
    async def _execute_interview_scheduling(self, decision):
        """Execute interview scheduling"""
        # Same as above
        pass
    
    async def _execute_outreach(self, decision):
        """Execute sourcing outreach"""
        from app.services.proactive_sourcing_service import ProactiveSourcingService
        from app.services.email_service import EmailService
        
        # Send outreach message
        pass
    
    async def get_decision_stats(
        self,
        job_id: Optional[UUID] = None,
        company_id: Optional[UUID] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> Dict:
        """
        Get statistics on AI decisions for analytics
        
        Shows:
        - Approval rate (how often recruiters approve AI decisions)
        - Rejection rate
        - Modification rate
        - Time saved
        """
        from app.models import AIDecision
        
        filters = []
        
        if job_id:
            filters.append(AIDecision.job_id == job_id)
        
        if date_from:
            filters.append(AIDecision.created_at >= date_from)
        
        if date_to:
            filters.append(AIDecision.created_at <= date_to)
        
        # Get all decisions
        result = await self.db.execute(
            select(AIDecision).where(and_(*filters)) if filters else select(AIDecision)
        )
        
        decisions = result.scalars().all()
        
        total = len(decisions)
        approved = len([d for d in decisions if d.status == DecisionStatus.APPROVED])
        rejected = len([d for d in decisions if d.status == DecisionStatus.REJECTED])
        modified = len([d for d in decisions if d.status == DecisionStatus.MODIFIED])
        pending = len([d for d in decisions if d.status == DecisionStatus.PENDING])
        
        # Calculate time saved (estimate)
        # Each manual decision: 5 minutes
        # Each approved decision: saved 5 minutes
        time_saved_minutes = approved * 5
        
        return {
            'total_decisions': total,
            'approved': approved,
            'rejected': rejected,
            'modified': modified,
            'pending': pending,
            'approval_rate': (approved / total * 100) if total > 0 else 0,
            'rejection_rate': (rejected / total * 100) if total > 0 else 0,
            'time_saved_hours': round(time_saved_minutes / 60, 1),
            'ai_accuracy': (approved / (approved + rejected) * 100) if (approved + rejected) > 0 else 0
        }
