"""
RecruitPro SA - Automated Interview Scheduling Service
AI-powered interview scheduling with Google Calendar integration
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
from uuid import UUID
import asyncio

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.automation import InterviewAvailabilitySlot, ScheduledInterview
from app.models import Application, Candidate, Job, User


class InterviewSchedulingService:
    """
    Automated Interview Scheduling
    - Manages interviewer availability
    - Auto-schedules interviews
    - Sends calendar invites
    - Sends automated reminders
    """
    
    def __init__(self, db: AsyncSession, email_service):
        self.db = db
        self.email_service = email_service
    
    async def create_availability_slots(
        self,
        interviewer_id: UUID,
        start_date: datetime,
        end_date: datetime,
        time_slots: List[Dict],  # [{"start_time": "09:00", "end_time": "10:00"}]
        is_recurring: bool = False,
        recurrence_pattern: Optional[str] = None
    ) -> List[Dict]:
        """
        Create availability slots for interviewer
        
        Args:
            interviewer_id: UUID of interviewer
            start_date: Start date for availability
            end_date: End date for availability
            time_slots: List of time slots per day
            is_recurring: Whether slots repeat
            recurrence_pattern: 'daily', 'weekly', etc.
        
        Returns:
            List of created slots
        """
        # from models import ...
        
        created_slots = []
        current_date = start_date
        
        while current_date <= end_date:
            # Skip weekends (Saturday=5, Sunday=6)
            if current_date.weekday() < 5:  # Monday=0 through Friday=4
                
                for time_slot in time_slots:
                    slot = InterviewAvailabilitySlot(
                        interviewer_id=interviewer_id,
                        slot_date=current_date.date(),
                        start_time=datetime.strptime(time_slot['start_time'], '%H:%M').time(),
                        end_time=datetime.strptime(time_slot['end_time'], '%H:%M').time(),
                        is_available=True,
                        is_recurring=is_recurring,
                        recurrence_pattern=recurrence_pattern
                    )
                    
                    self.db.add(slot)
                    created_slots.append(slot)
            
            # Move to next day
            current_date += timedelta(days=1)
        
        await self.db.commit()
        
        return created_slots
    
    async def get_available_slots(
        self,
        interviewer_ids: List[UUID],
        start_date: datetime,
        end_date: datetime,
        duration_minutes: int = 60
    ) -> List[Dict]:
        """
        Get available interview slots for given interviewers
        """
        # from models import ...
        
        result = await self.db.execute(
            select(InterviewAvailabilitySlot)
            .where(
                and_(
                    InterviewAvailabilitySlot.interviewer_id.in_(interviewer_ids),
                    InterviewAvailabilitySlot.slot_date >= start_date.date(),
                    InterviewAvailabilitySlot.slot_date <= end_date.date(),
                    InterviewAvailabilitySlot.is_available == True,
                    InterviewAvailabilitySlot.is_booked == False
                )
            )
            .order_by(InterviewAvailabilitySlot.slot_date, InterviewAvailabilitySlot.start_time)
        )
        
        slots = result.scalars().all()
        
        return [
            {
                'slot_id': slot.id,
                'interviewer_id': slot.interviewer_id,
                'date': slot.slot_date,
                'start_time': slot.start_time,
                'end_time': slot.end_time,
                'duration': duration_minutes
            }
            for slot in slots
        ]
    
    async def schedule_interview(
        self,
        application_id: UUID,
        candidate_id: UUID,
        job_id: UUID,
        slot_id: UUID,
        interviewer_ids: List[UUID],
        meeting_type: str = 'video',
        meeting_url: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Dict:
        """
        Schedule an interview
        """
        # from models import ...
        
        # Get slot details
        slot = await self.db.get(InterviewAvailabilitySlot, slot_id)
        
        if not slot or not slot.is_available or slot.is_booked:
            raise ValueError("Slot is not available")
        
        # Get candidate and job details
        candidate = await self.db.get(Candidate, candidate_id)
        job = await self.db.get(Job, job_id)
        
        # Create scheduled interview
        interview = ScheduledInterview(
            application_id=application_id,
            candidate_id=candidate_id,
            job_id=job_id,
            slot_id=slot_id,
            interviewer_ids=interviewer_ids,
            scheduled_date=slot.slot_date,
            scheduled_start_time=slot.start_time,
            scheduled_end_time=slot.end_time,
            duration_minutes=60,
            meeting_type=meeting_type,
            meeting_url=meeting_url,
            notes=notes,
            status='scheduled'
        )
        
        self.db.add(interview)
        
        # Mark slot as booked
        slot.is_booked = True
        slot.booked_by = application_id
        slot.booked_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(interview)
        
        # Send interview invitation email
        await self._send_interview_invitation(interview, candidate, job)
        
        # Schedule automated reminders
        await self._schedule_reminders(interview)
        
        return {
            'interview_id': interview.id,
            'scheduled_date': interview.scheduled_date,
            'scheduled_time': interview.scheduled_start_time,
            'meeting_url': interview.meeting_url,
            'status': 'scheduled'
        }
    
    async def auto_schedule_interview(
        self,
        application_id: UUID,
        candidate_id: UUID,
        job_id: UUID,
        preferred_days: Optional[List[str]] = None,  # ['monday', 'tuesday']
        preferred_times: Optional[List[str]] = None   # ['morning', 'afternoon']
    ) -> Dict:
        """
        Automatically find and schedule best available slot
        """
        # from models import ...
        
        # Get job to find assigned interviewers
        job = await self.db.get(Job, job_id)
        interviewer_ids = job.interviewer_ids or []
        
        if not interviewer_ids:
            raise ValueError("No interviewers assigned to this job")
        
        # Get available slots for next 14 days
        start_date = datetime.utcnow()
        end_date = start_date + timedelta(days=14)
        
        available_slots = await self.get_available_slots(
            interviewer_ids=interviewer_ids,
            start_date=start_date,
            end_date=end_date,
            duration_minutes=60
        )
        
        if not available_slots:
            raise ValueError("No available slots in the next 14 days")
        
        # Filter by preferences if provided
        if preferred_days or preferred_times:
            available_slots = self._filter_slots_by_preferences(
                available_slots,
                preferred_days,
                preferred_times
            )
        
        # Pick the earliest available slot
        best_slot = available_slots[0]
        
        # Generate meeting URL (Zoom/Teams integration would go here)
        meeting_url = f"https://meet.recruitpro.sa/{application_id}"
        
        # Schedule the interview
        return await self.schedule_interview(
            application_id=application_id,
            candidate_id=candidate_id,
            job_id=job_id,
            slot_id=best_slot['slot_id'],
            interviewer_ids=interviewer_ids,
            meeting_type='video',
            meeting_url=meeting_url
        )
    
    def _filter_slots_by_preferences(
        self,
        slots: List[Dict],
        preferred_days: Optional[List[str]],
        preferred_times: Optional[List[str]]
    ) -> List[Dict]:
        """
        Filter slots by candidate preferences
        """
        filtered = slots
        
        if preferred_days:
            day_map = {
                'monday': 0, 'tuesday': 1, 'wednesday': 2,
                'thursday': 3, 'friday': 4
            }
            preferred_weekdays = [day_map[d.lower()] for d in preferred_days if d.lower() in day_map]
            
            filtered = [
                s for s in filtered
                if s['date'].weekday() in preferred_weekdays
            ]
        
        if preferred_times:
            time_filtered = []
            for slot in filtered:
                hour = slot['start_time'].hour
                
                if 'morning' in [t.lower() for t in preferred_times] and 8 <= hour < 12:
                    time_filtered.append(slot)
                elif 'afternoon' in [t.lower() for t in preferred_times] and 12 <= hour < 17:
                    time_filtered.append(slot)
                elif 'evening' in [t.lower() for t in preferred_times] and 17 <= hour < 20:
                    time_filtered.append(slot)
            
            filtered = time_filtered if time_filtered else filtered
        
        return filtered
    
    async def _send_interview_invitation(self, interview, candidate, job):
        """
        Send interview invitation email to candidate
        """
        # Combine date and time for datetime object
        interview_datetime = datetime.combine(
            interview.scheduled_date,
            interview.scheduled_start_time
        )
        
        await self.email_service.send_interview_invitation(
            candidate_email=candidate.email,
            candidate_name=candidate.full_name,
            job_title=job.title,
            company_name=job.company.name,
            interview_date=interview_datetime,
            interview_duration=interview.duration_minutes,
            meeting_url=interview.meeting_url
        )
    
    async def _schedule_reminders(self, interview):
        """
        Schedule automated reminders (24h and 1h before)
        """
        # In production, this would use Celery/Redis for background jobs
        # For now, just log
        print(f"Scheduled reminders for interview {interview.id}")
    
    async def send_reminder_emails(
        self,
        reminder_type: str = '24h'  # '24h' or '1h'
    ):
        """
        Send reminder emails for upcoming interviews
        Background job that runs periodically
        """
        # from models import ...
        
        now = datetime.utcnow()
        
        if reminder_type == '24h':
            # Interviews in 24 hours
            target_time_start = now + timedelta(hours=23, minutes=30)
            target_time_end = now + timedelta(hours=24, minutes=30)
            reminder_field = 'reminder_24h_sent'
        else:  # '1h'
            # Interviews in 1 hour
            target_time_start = now + timedelta(minutes=50)
            target_time_end = now + timedelta(minutes=70)
            reminder_field = 'reminder_1h_sent'
        
        # Get interviews that need reminders
        result = await self.db.execute(
            select(ScheduledInterview)
            .where(
                and_(
                    ScheduledInterview.status == 'scheduled',
                    getattr(ScheduledInterview, reminder_field) == False
                )
            )
        )
        
        interviews = result.scalars().all()
        
        for interview in interviews:
            # Check if interview is in the target time window
            interview_datetime = datetime.combine(
                interview.scheduled_date,
                interview.scheduled_start_time
            )
            
            if target_time_start <= interview_datetime <= target_time_end:
                # Send reminder
                candidate = await self.db.get(Candidate, interview.candidate_id)
                job = await self.db.get(Job, interview.job_id)
                
                await self._send_interview_reminder(
                    interview,
                    candidate,
                    job,
                    reminder_type
                )
                
                # Mark reminder as sent
                setattr(interview, reminder_field, True)
        
        await self.db.commit()
    
    async def _send_interview_reminder(
        self,
        interview,
        candidate,
        job,
        reminder_type: str
    ):
        """
        Send interview reminder email
        """
        time_until = "24 hours" if reminder_type == '24h' else "1 hour"
        
        interview_datetime = datetime.combine(
            interview.scheduled_date,
            interview.scheduled_start_time
        )
        
        subject = f"⏰ Interview Reminder - {time_until}"
        
        # Use a simplified reminder template
        # In production, create a proper template like the others
        await self.email_service.send_email(
            to_email=candidate.email,
            subject=subject,
            html_content=f"""
            <h2>Interview Reminder</h2>
            <p>Hi {candidate.full_name},</p>
            <p>This is a reminder that your interview for {job.title} is in {time_until}.</p>
            <p><strong>Time:</strong> {interview_datetime.strftime('%B %d, %Y at %I:%M %p')}</p>
            <p><strong>Meeting Link:</strong> <a href="{interview.meeting_url}">{interview.meeting_url}</a></p>
            <p>See you soon!</p>
            """
        )
    
    async def reschedule_interview(
        self,
        interview_id: UUID,
        new_slot_id: UUID,
        reason: Optional[str] = None
    ) -> Dict:
        """
        Reschedule an existing interview
        """
        # from models import ...
        
        # Get existing interview
        interview = await self.db.get(ScheduledInterview, interview_id)
        
        if not interview:
            raise ValueError("Interview not found")
        
        # Free up old slot
        if interview.slot_id:
            old_slot = await self.db.get(InterviewAvailabilitySlot, interview.slot_id)
            if old_slot:
                old_slot.is_booked = False
                old_slot.booked_by = None
        
        # Get new slot
        new_slot = await self.db.get(InterviewAvailabilitySlot, new_slot_id)
        
        if not new_slot or not new_slot.is_available or new_slot.is_booked:
            raise ValueError("New slot is not available")
        
        # Update interview
        interview.slot_id = new_slot_id
        interview.scheduled_date = new_slot.slot_date
        interview.scheduled_start_time = new_slot.start_time
        interview.scheduled_end_time = new_slot.end_time
        interview.status = 'rescheduled'
        interview.reschedule_count += 1
        interview.reminder_24h_sent = False
        interview.reminder_1h_sent = False
        
        # Book new slot
        new_slot.is_booked = True
        new_slot.booked_by = interview.application_id
        new_slot.booked_at = datetime.utcnow()
        
        await self.db.commit()
        
        # Send updated invitation
        candidate = await self.db.get(Candidate, interview.candidate_id)
        job = await self.db.get(Job, interview.job_id)
        await self._send_interview_invitation(interview, candidate, job)
        
        return {
            'interview_id': interview.id,
            'new_date': interview.scheduled_date,
            'new_time': interview.scheduled_start_time,
            'status': 'rescheduled'
        }
    
    async def cancel_interview(
        self,
        interview_id: UUID,
        cancelled_by: UUID,
        reason: str
    ) -> Dict:
        """
        Cancel an interview
        """
        # from models import ...
        
        interview = await self.db.get(ScheduledInterview, interview_id)
        
        if not interview:
            raise ValueError("Interview not found")
        
        # Free up slot
        if interview.slot_id:
            slot = await self.db.get(InterviewAvailabilitySlot, interview.slot_id)
            if slot:
                slot.is_booked = False
                slot.booked_by = None
        
        # Update interview status
        interview.status = 'cancelled'
        interview.cancelled_by = cancelled_by
        interview.cancelled_at = datetime.utcnow()
        interview.cancellation_reason = reason
        
        await self.db.commit()
        
        # Send cancellation email
        # (Would implement this in production)
        
        return {
            'interview_id': interview.id,
            'status': 'cancelled'
        }
