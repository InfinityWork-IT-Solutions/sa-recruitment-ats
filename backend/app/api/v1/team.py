"""
Team API — team members for a client company, bulk application ops
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from pydantic import BaseModel, EmailStr
import secrets
from datetime import datetime, timedelta, timezone

from app.core.database import get_db
from app.core.security import get_current_active_user, hash_password, FRONTEND_URL
from app.models import User, ClientCompany, UserRole
from app.models.application import ApplicationStatus
from app.services.applications_service import ApplicationService
from app.services.email_service import EmailService

email_service = EmailService()

router = APIRouter()


async def _get_company(user: User, db: AsyncSession) -> ClientCompany:
    # Try by direct ownership first, then fall back to agency membership
    result = await db.execute(select(ClientCompany).where(ClientCompany.user_id == user.id))
    company = result.scalar_one_or_none()
    if not company:
        result = await db.execute(select(ClientCompany).where(ClientCompany.agency_id == user.agency_id))
        company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


class InviteMemberRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: str = "recruiter"


async def _send_invite_email(member: User, inviter_name: str) -> None:
    invite_link = f"{FRONTEND_URL}/accept-invite?token={member.invitation_token}"
    subject = f"You've been invited to join RecruitPro"
    html = f"""
    <html>
      <body style="font-family:sans-serif;color:#333;background:#f8fafc;margin:0;padding:0;">
        <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px 40px;">
            <h1 style="color:#fff;margin:0;font-size:24px;">You're invited to RecruitPro</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">{inviter_name} has added you to their team.</p>
          </div>
          <div style="padding:32px 40px;">
            <p style="font-size:16px;">Hi <strong>{member.first_name}</strong>,</p>
            <p>You've been invited to join the team on RecruitPro SA. Click the button below to set your password and activate your account.</p>
            <div style="text-align:center;margin:32px 0;">
              <a href="{invite_link}" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Accept Invitation & Set Password</a>
            </div>
            <p style="color:#64748b;font-size:13px;">This invitation link expires in <strong>7 days</strong>. If you didn't expect this, you can ignore this email.</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
            <p style="color:#94a3b8;font-size:12px;text-align:center;">RecruitPro SA &mdash; Smarter Hiring for South Africa</p>
          </div>
        </div>
      </body>
    </html>
    """
    plain = f"Hi {member.first_name},\n\n{inviter_name} has invited you to join their team on RecruitPro.\n\nAccept your invitation here:\n{invite_link}\n\nThis link expires in 7 days."
    await email_service.send_email(member.email, subject, plain, html)


@router.post("/team/invite")
async def invite_team_member(
    body: InviteMemberRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Invite a new team member — creates their account and emails a set-password link."""
    if current_user.role not in (UserRole.agency_admin, UserRole.client):
        raise HTTPException(status_code=403, detail="Only admins can invite team members")
    await _get_company(current_user, db)

    allowed = {UserRole.agency_admin, UserRole.recruiter, UserRole.client}
    try:
        role = UserRole(body.role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {body.role}")
    if role not in allowed:
        raise HTTPException(status_code=400, detail="Invalid role for team member")

    # Check email not already taken
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="A user with this email already exists")

    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(days=7)

    member = User(
        email=body.email,
        first_name=body.first_name,
        last_name=body.last_name,
        hashed_password=hash_password(secrets.token_urlsafe(16)),  # random placeholder
        role=role,
        agency_id=current_user.agency_id,
        is_active=False,      # inactive until they accept
        is_verified=False,
        invitation_token=token,
        invitation_expires_at=expires,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)

    inviter_name = f"{current_user.first_name} {current_user.last_name}".strip() or current_user.email
    await _send_invite_email(member, inviter_name)

    return {"message": f"Invitation sent to {body.email}", "member_id": str(member.id)}


@router.post("/team/members/{member_id}/resend-invitation")
async def resend_invitation(
    member_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Re-generate the invitation token and resend the email."""
    if current_user.role not in (UserRole.agency_admin, UserRole.client):
        raise HTTPException(status_code=403, detail="Only admins can resend invitations")
    await _get_company(current_user, db)
    result = await db.execute(
        select(User).where(User.id == member_id, User.agency_id == current_user.agency_id)
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    if member.is_active and member.is_verified:
        raise HTTPException(status_code=400, detail="Member has already accepted their invitation")

    member.invitation_token = secrets.token_urlsafe(32)
    member.invitation_expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.commit()
    await db.refresh(member)

    inviter_name = f"{current_user.first_name} {current_user.last_name}".strip() or current_user.email
    await _send_invite_email(member, inviter_name)
    return {"message": f"Invitation resent to {member.email}"}


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
                "position": m.position or "",
                "department": m.department or "",
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
    position: Optional[str] = None
    department: Optional[str] = None


class ChangeRoleRequest(BaseModel):
    role: str


@router.patch("/team/members/{member_id}/role")
async def change_team_member_role(
    member_id: UUID,
    body: ChangeRoleRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Change a team member's role."""
    if current_user.role not in (UserRole.agency_admin, UserRole.client):
        raise HTTPException(status_code=403, detail="Only admins can change roles")
    from app.models.user import UserRole as UserRoleEnum

    await _get_company(current_user, db)

    allowed = {UserRoleEnum.agency_admin, UserRoleEnum.recruiter, UserRoleEnum.client}
    try:
        new_role = UserRoleEnum(body.role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {body.role}")
    if new_role not in allowed:
        raise HTTPException(status_code=400, detail="Role cannot be set through team management")

    result = await db.execute(
        select(User).where(
            User.id == member_id,
            User.agency_id == current_user.agency_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")

    member.role = new_role
    await db.commit()
    await db.refresh(member)
    return {"id": str(member.id), "role": member.role.value}


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
    if body.position is not None:
        member.position = body.position
    if body.department is not None:
        member.department = body.department

    await db.commit()
    await db.refresh(member)
    return {
        "id": str(member.id),
        "first_name": member.first_name,
        "last_name": member.last_name,
        "phone": member.phone,
        "position": member.position or "",
        "department": member.department or "",
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
