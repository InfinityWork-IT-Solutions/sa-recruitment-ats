"""
Subscription guard — FastAPI dependency that blocks access when the agency's
trial has expired and no active subscription exists.

Usage:
    @router.post("/jobs")
    async def create_job(
        ...,
        _: None = Depends(require_active_subscription),
    ):
"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import User
from app.models.agency import Agency
from app.models.subscription import RecruiterSubscription
from uuid import UUID


# ---------------------------------------------------------------------------
# Contact-masking helpers
# ---------------------------------------------------------------------------

def mask_email(email: str) -> str:
    """j.doe@gmail.com  →  j***@gmail.com"""
    if not email or '@' not in email:
        return '***@***.com'
    local, domain = email.split('@', 1)
    return f'{local[0]}***@{domain}' if local else f'***@{domain}'


def mask_phone(phone: str) -> str:
    """0821234567  →  082***567"""
    if not phone:
        return None
    p = phone.strip()
    if len(p) <= 6:
        return '***'
    return f'{p[:3]}***{p[-3:]}'


async def agency_is_paid(agency_id: UUID, db: AsyncSession) -> bool:
    """
    Returns True once the agency has gone through the billing setup flow,
    i.e. a RecruiterSubscription record exists with status 'trialing' or
    'active'.  The subscription is only created when the user submits the
    PayFast billing form, so its existence is sufficient proof that a payment
    method has been registered.

    Note: we intentionally do NOT require payfast_subscription_token here
    because that token is only delivered via the PayFast ITN webhook, which
    cannot reach localhost during development.
    """
    result = await db.execute(
        select(RecruiterSubscription).where(
            RecruiterSubscription.recruiter_agency_id == agency_id,
            RecruiterSubscription.status.in_(['trialing', 'active']),
        )
    )
    return result.scalar_one_or_none() is not None


async def require_active_subscription(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    Passes through if the user's agency is within a valid trial or has an
    active paid subscription.  Raises 402 Payment Required otherwise.

    Super-admins are always allowed through.
    """
    from app.models.user import UserRole

    if current_user.role == UserRole.super_admin:
        return  # admins always have access

    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="No agency associated with this account. Please contact support.",
        )

    agency = await db.get(Agency, current_user.agency_id)
    if not agency:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agency not found")

    # --- Trial window ---
    if agency.is_trial:
        if agency.trial_ends_at and agency.trial_ends_at > datetime.utcnow():
            return  # still within trial

        # Trial expired — check for an active paid subscription
        sub_result = await db.execute(
            select(RecruiterSubscription).where(
                RecruiterSubscription.recruiter_agency_id == agency.id,
                RecruiterSubscription.status == "active",
            )
        )
        if sub_result.scalar_one_or_none():
            return  # paid subscription exists

        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=(
                "Your 14-day free trial has ended. "
                "Please set up billing to continue using RecruitPro SA."
            ),
        )

    # --- Paid subscription ---
    sub_result = await db.execute(
        select(RecruiterSubscription).where(
            RecruiterSubscription.recruiter_agency_id == agency.id,
            RecruiterSubscription.status.in_(["active", "trialing"]),
        )
    )
    subscription = sub_result.scalar_one_or_none()

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="No active subscription found. Please update your billing details.",
        )

    # Check subscription period
    if subscription.current_period_end and subscription.current_period_end < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Your subscription has expired. Please update your billing details.",
        )
