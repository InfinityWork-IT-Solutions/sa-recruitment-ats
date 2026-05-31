"""
Team API — team members for a client company, bulk application ops
"""
from typing import List, Optional
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
    await _get_company(current_user, db)
    result = await db.execute(
        select(User).where(
            User.agency_id == current_user.agency_id,
            User.role.in_([UserRole.client, UserRole.recruiter, UserRole.agency_admin]),
        )
    )
    members = result.scalars().all()

    def _status(m: User) -> str:
        if not m.is_active:
            return "inactive"
        if not m.is_verified and m.last_login_at is None:
            return "invited"
        return "active"

    return {
        "members": [
            {
                "id": str(m.id),
                "first_name": m.first_name,
                "last_name": m.last_name,
                "email": m.email,
                "phone": m.phone or "",
                "role": m.role.value,
                "avatar_url": m.avatar_url or m.profile_photo,
                "is_verified": m.is_verified,
                "status": _status(m),
                "last_active": m.last_login_at.strftime("%d %b %Y").lstrip("0") if m.last_login_at else None,
                "joined_at": m.created_at.strftime("%d %b %Y").lstrip("0") if m.created_at else None,
            }
            for m in members
        ],
        "total": len(members),
        "seats": {
            "used": len(members),
            "total": max(len(members) + 1, 5),
            "available": max(5 - len(members), 1),
            "plan": "Professional",
        },
    }


class UpdateMemberProfileRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


@router.patch("/team/members/{member_id}/profile")
async def update_team_member_profile(
    member_id: UUID,
    body: UpdateMemberProfileRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a team member's basic profile info (name, phone)."""
    await _get_company(current_user, db)
    result = await db.execute(
        select(User).where(
            User.id == member_id,
            User.agency_id == current_user.agency_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")

    if body.first_name is not None:
        member.first_name = body.first_name
    if body.last_name is not None:
        member.last_name = body.last_name
    if body.phone is not None:
        member.phone = body.phone

    await db.commit()
    await db.refresh(member)
    return {"id": str(member.id), "first_name": member.first_name, "last_name": member.last_name, "phone": member.phone}


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
