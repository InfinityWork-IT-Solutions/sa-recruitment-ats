"""
Email Sequence Service — multi-step drip email campaigns triggered by application events
"""
from typing import List, Optional, Dict
from uuid import UUID
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.email_sequence import (
    EmailSequence, EmailSequenceStep, EmailSequenceEnrollment, SequenceTriggerEvent
)
from app.models.candidate import Candidate
from app.services.email_service import EmailService


class EmailSequenceService:

    def __init__(self, db: AsyncSession, email_service: Optional[EmailService] = None):
        self.db = db
        self.email_service = email_service

    # ── CRUD ────────────────────────────────────────────────────────────────

    async def get_sequences(self, company_id: UUID) -> List[dict]:
        result = await self.db.execute(
            select(EmailSequence)
            .where(EmailSequence.company_id == company_id)
            .order_by(EmailSequence.created_at.desc())
        )
        sequences = result.scalars().all()
        return [await self._serialize_sequence(s) for s in sequences]

    async def create_sequence(
        self,
        company_id: UUID,
        name: str,
        trigger_event: str,
        steps: List[Dict],
        created_by: UUID,
    ) -> dict:
        sequence = EmailSequence(
            company_id=company_id,
            name=name,
            trigger_event=SequenceTriggerEvent(trigger_event),
            created_by=created_by,
        )
        self.db.add(sequence)
        await self.db.flush()

        for i, step_data in enumerate(steps):
            step = EmailSequenceStep(
                sequence_id=sequence.id,
                step_number=i + 1,
                delay_hours=step_data.get("delay_hours", 0),
                subject=step_data["subject"],
                body_template=step_data["body_template"],
            )
            self.db.add(step)

        await self.db.flush()
        return await self._serialize_sequence(sequence)

    async def update_sequence(self, sequence_id: UUID, data: Dict) -> dict:
        result = await self.db.execute(
            select(EmailSequence).where(EmailSequence.id == sequence_id)
        )
        sequence = result.scalar_one_or_none()
        if not sequence:
            raise ValueError("Sequence not found")

        if "name" in data:
            sequence.name = data["name"]
        if "is_active" in data:
            sequence.is_active = data["is_active"]

        return await self._serialize_sequence(sequence)

    async def delete_sequence(self, sequence_id: UUID) -> bool:
        result = await self.db.execute(
            select(EmailSequence).where(EmailSequence.id == sequence_id)
        )
        sequence = result.scalar_one_or_none()
        if not sequence:
            return False
        await self.db.delete(sequence)
        return True

    # ── Enrollment ──────────────────────────────────────────────────────────

    async def enroll_candidate(
        self,
        sequence_id: UUID,
        candidate_id: UUID,
        application_id: Optional[UUID] = None,
    ) -> None:
        seq_result = await self.db.execute(
            select(EmailSequence).where(EmailSequence.id == sequence_id, EmailSequence.is_active == True)
        )
        sequence = seq_result.scalar_one_or_none()
        if not sequence:
            return

        # Don't enroll if already active
        existing = await self.db.execute(
            select(EmailSequenceEnrollment).where(
                EmailSequenceEnrollment.sequence_id == sequence_id,
                EmailSequenceEnrollment.candidate_id == candidate_id,
                EmailSequenceEnrollment.is_active == True,
            )
        )
        if existing.scalar_one_or_none():
            return

        steps_result = await self.db.execute(
            select(EmailSequenceStep)
            .where(EmailSequenceStep.sequence_id == sequence_id)
            .order_by(EmailSequenceStep.step_number)
        )
        steps = steps_result.scalars().all()
        if not steps:
            return

        first_step = steps[0]
        next_send = datetime.utcnow() + timedelta(hours=first_step.delay_hours)

        enrollment = EmailSequenceEnrollment(
            sequence_id=sequence_id,
            candidate_id=candidate_id,
            application_id=application_id,
            current_step=0,
            next_send_at=next_send,
        )
        self.db.add(enrollment)

    async def trigger_for_event(
        self,
        company_id: UUID,
        trigger_event: str,
        candidate_id: UUID,
        application_id: Optional[UUID] = None,
    ) -> None:
        """Called by applications_service on status change to auto-enroll candidates."""
        result = await self.db.execute(
            select(EmailSequence).where(
                EmailSequence.company_id == company_id,
                EmailSequence.trigger_event == SequenceTriggerEvent(trigger_event),
                EmailSequence.is_active == True,
            )
        )
        sequences = result.scalars().all()
        for seq in sequences:
            await self.enroll_candidate(seq.id, candidate_id, application_id)

    async def process_due_enrollments(self) -> int:
        """Process all enrollments where next_send_at <= now. Called by scheduler/Celery."""
        now = datetime.utcnow()
        result = await self.db.execute(
            select(EmailSequenceEnrollment).where(
                EmailSequenceEnrollment.is_active == True,
                EmailSequenceEnrollment.next_send_at <= now,
                EmailSequenceEnrollment.completed_at.is_(None),
            )
        )
        enrollments = result.scalars().all()
        sent_count = 0

        for enrollment in enrollments:
            try:
                await self._process_enrollment(enrollment)
                sent_count += 1
            except Exception:
                pass

        return sent_count

    async def _process_enrollment(self, enrollment: EmailSequenceEnrollment) -> None:
        steps_result = await self.db.execute(
            select(EmailSequenceStep)
            .where(EmailSequenceStep.sequence_id == enrollment.sequence_id)
            .order_by(EmailSequenceStep.step_number)
        )
        steps = steps_result.scalars().all()

        current_index = enrollment.current_step
        if current_index >= len(steps):
            enrollment.is_active = False
            enrollment.completed_at = datetime.utcnow()
            return

        step = steps[current_index]

        # Get candidate email
        candidate_result = await self.db.execute(
            select(Candidate).where(Candidate.id == enrollment.candidate_id)
        )
        candidate = candidate_result.scalar_one_or_none()
        if not candidate:
            enrollment.is_active = False
            return

        # Render template
        body = step.body_template.replace("{{candidate_name}}", f"{candidate.first_name} {candidate.last_name}")
        body = body.replace("{{first_name}}", candidate.first_name)

        if self.email_service:
            await self.email_service.send_email(
                to_email=candidate.email,
                subject=step.subject,
                body=body,
            )

        # Advance to next step
        next_index = current_index + 1
        if next_index >= len(steps):
            enrollment.is_active = False
            enrollment.completed_at = datetime.utcnow()
        else:
            next_step = steps[next_index]
            enrollment.current_step = next_index
            enrollment.next_send_at = datetime.utcnow() + timedelta(hours=next_step.delay_hours)

    async def _serialize_sequence(self, sequence: EmailSequence) -> dict:
        steps_result = await self.db.execute(
            select(EmailSequenceStep)
            .where(EmailSequenceStep.sequence_id == sequence.id)
            .order_by(EmailSequenceStep.step_number)
        )
        steps = steps_result.scalars().all()

        enrollments_result = await self.db.execute(
            select(EmailSequenceEnrollment)
            .where(EmailSequenceEnrollment.sequence_id == sequence.id)
        )
        enrollments = enrollments_result.scalars().all()

        return {
            "id": str(sequence.id),
            "company_id": str(sequence.company_id),
            "name": sequence.name,
            "trigger_event": sequence.trigger_event.value,
            "is_active": sequence.is_active,
            "created_at": sequence.created_at.isoformat(),
            "steps_count": len(steps),
            "enrollments_count": len(enrollments),
            "active_enrollments": sum(1 for e in enrollments if e.is_active),
            "steps": [
                {
                    "id": str(s.id),
                    "step_number": s.step_number,
                    "delay_hours": s.delay_hours,
                    "subject": s.subject,
                    "body_template": s.body_template,
                }
                for s in steps
            ],
        }
