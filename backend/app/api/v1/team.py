"""
Team API — team members for a client company, bulk application ops
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import User, ClientCompany, UserRole
from app.models.application import ApplicationStatus
from app.services.applications_service import ApplicationService

router = APIRouter()


async def _get_company(user: User, db: AsyncSession) -> ClientCompany:
    result = await db.execute(select(ClientCompany).where(ClientCompany.user_id == user.id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.get("/team/members")
async def get_team_members(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get team members for the current user's company."""
    company = await _get_company(current_user, db)
    result = await db.execute(
        select(User).where(
            User.agency_id == current_user.agency_id,
            User.role.in_([UserRole.client, UserRole.recruiter, UserRole.agency_admin]),
            User.is_active == True,
        )
    )
    members = result.scalars().all()
    return {
        "members": [
            {
                "id": str(m.id),
                "name": f"{m.first_name} {m.last_name}",
                "email": m.email,
                "role": m.role.value,
                "avatar_url": m.avatar_url,
            }
            for m in members
        ],
        "total": len(members),
    }


class BulkMoveRequest(BaseModel):
    application_ids: List[UUID]
    new_status: str


class BulkRejectRequest(BaseModel):
    application_ids: List[UUID]
    reason: str = "other"
    notes: str = ""
    send_email: bool = False


class BulkEmailRequest(BaseModel):
    application_ids: List[UUID]
    subject: str
    body: str


@router.post("/applications/bulk/move")
async def bulk_move_applications(
    body: BulkMoveRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Move multiple applications to a new pipeline stage."""
    try:
        new_status = ApplicationStatus(body.new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {body.new_status}")

    count = await ApplicationService.bulk_move_stage(db, body.application_ids, new_status, current_user.id)
    return {"moved": count, "new_status": body.new_status}


@router.post("/applications/bulk/reject")
async def bulk_reject_applications(
    body: BulkRejectRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Reject multiple applications at once."""
    from app.models.application import RejectionReason
    try:
        reason = RejectionReason(body.reason)
    except ValueError:
        reason = RejectionReason.other

    count = await ApplicationService.bulk_reject(db, body.application_ids, reason, body.notes, current_user.id, body.send_email)
    return {"rejected": count}


@router.post("/applications/bulk/email")
async def bulk_email_candidates(
    body: BulkEmailRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a custom email to candidates of multiple applications."""
    count = await ApplicationService.bulk_email(db, body.application_ids, body.subject, body.body, current_user.id)
    return {"emailed": count}
