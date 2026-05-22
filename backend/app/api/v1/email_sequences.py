"""
Email Sequences API — multi-step drip email campaigns
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from pydantic import BaseModel
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import User, ClientCompany
from app.services.email_sequence_service import EmailSequenceService

router = APIRouter()


class SequenceStepCreate(BaseModel):
    delay_hours: int = 0
    subject: str
    body_template: str


class SequenceCreate(BaseModel):
    name: str
    trigger_event: str
    steps: List[SequenceStepCreate] = []


class SequenceUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None


async def _get_company_id(user: User, db: AsyncSession) -> UUID:
    result = await db.execute(select(ClientCompany).where(ClientCompany.user_id == user.id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company.id


@router.get("/email-sequences")
async def list_sequences(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all email sequences for the current company."""
    company_id = await _get_company_id(current_user, db)
    service = EmailSequenceService(db)
    return await service.get_sequences(company_id)


@router.post("/email-sequences", status_code=status.HTTP_201_CREATED)
async def create_sequence(
    body: SequenceCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create an email drip sequence."""
    company_id = await _get_company_id(current_user, db)
    service = EmailSequenceService(db)
    return await service.create_sequence(
        company_id=company_id,
        name=body.name,
        trigger_event=body.trigger_event,
        steps=[s.model_dump() for s in body.steps],
        created_by=current_user.id,
    )


@router.put("/email-sequences/{sequence_id}")
async def update_sequence(
    sequence_id: UUID,
    body: SequenceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an email sequence (name or active status)."""
    service = EmailSequenceService(db)
    return await service.update_sequence(sequence_id, body.model_dump(exclude_none=True))


@router.delete("/email-sequences/{sequence_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sequence(
    sequence_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an email sequence."""
    service = EmailSequenceService(db)
    deleted = await service.delete_sequence(sequence_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Sequence not found")


@router.get("/email-sequences/{sequence_id}/enrollments")
async def get_enrollments(
    sequence_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get enrollment stats for a sequence."""
    from app.models.email_sequence import EmailSequenceEnrollment
    result = await db.execute(
        select(EmailSequenceEnrollment).where(EmailSequenceEnrollment.sequence_id == sequence_id)
    )
    enrollments = result.scalars().all()
    return [
        {
            "id": str(e.id),
            "candidate_id": str(e.candidate_id),
            "current_step": e.current_step,
            "is_active": e.is_active,
            "started_at": e.started_at.isoformat(),
            "next_send_at": e.next_send_at.isoformat() if e.next_send_at else None,
            "completed_at": e.completed_at.isoformat() if e.completed_at else None,
        }
        for e in enrollments
    ]
