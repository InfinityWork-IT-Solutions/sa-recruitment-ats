from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from uuid import UUID
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User, UserRole
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, NotificationListResponse, NotificationUpdate
from app.schemas.notification_preference import NotificationPreferenceResponse, NotificationPreferenceUpdate
from app.services.notification_service import NotificationService
from app.services.notification_preference_service import NotificationPreferenceService

router = APIRouter()


# ---------------------------------------------------------------------------
# Fixed-path routes MUST come before wildcard /{notification_id} routes.
# FastAPI matches in registration order, so "preferences" would otherwise be
# parsed as a UUID path param and rejected with a 422.
# ---------------------------------------------------------------------------

# --- Preferences (GET + PUT /preferences before any /{id} routes) ----------

@router.get("/preferences", response_model=NotificationPreferenceResponse)
async def get_notification_preferences(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's notification preferences (creates defaults if none exist)."""
    prefs = await NotificationPreferenceService.get_or_create(db, current_user.id)
    return prefs


@router.put("/preferences", response_model=NotificationPreferenceResponse)
async def update_notification_preferences(
    update_data: NotificationPreferenceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user's notification preferences."""
    prefs = await NotificationPreferenceService.update(db, current_user.id, update_data)
    return prefs


# --- Other fixed-path routes -----------------------------------------------

@router.get("", response_model=NotificationListResponse)
async def get_my_notifications(
    limit: int = 20,
    offset: int = 0,
    unread_only: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's notifications."""
    notifications = await NotificationService.get_user_notifications(
        db, current_user.id, limit, offset, unread_only
    )
    unread_count = await NotificationService.get_unread_count(db, current_user.id)
    return {"notifications": notifications, "unread_count": unread_count}


@router.get("/admin/all", response_model=NotificationListResponse)
async def get_all_notifications_admin(
    limit: int = 50,
    offset: int = 0,
    unread_only: bool = False,
    notification_type: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Super-admin only: fetch all notifications across all users."""
    if current_user.role != UserRole.super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required")

    query = select(Notification)
    if unread_only:
        query = query.where(Notification.is_read == False)
    if notification_type:
        query = query.where(Notification.type == notification_type)
    query = query.order_by(desc(Notification.created_at)).limit(limit).offset(offset)

    result = await db.execute(query)
    notifications = result.scalars().all()

    from sqlalchemy import func
    unread_q = select(func.count(Notification.id)).where(Notification.is_read == False)
    unread_result = await db.execute(unread_q)
    unread_count = unread_result.scalar() or 0

    return {"notifications": notifications, "unread_count": unread_count}


@router.post("/mark-all-read")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark all user's notifications as read."""
    await NotificationService.mark_all_as_read(db, current_user.id)
    return {"message": "All notifications marked as read"}


# --- Wildcard /{notification_id} routes LAST --------------------------------

@router.put("/{notification_id}", response_model=NotificationResponse)
async def update_notification(
    notification_id: UUID,
    update_data: NotificationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a notification (e.g. mark as read)."""
    if update_data.is_read:
        await NotificationService.mark_as_read(db, current_user.id, notification_id)

    notification = await db.get(Notification, notification_id)
    if not notification or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a notification."""
    success = await NotificationService.delete_notification(db, current_user.id, notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted"}
