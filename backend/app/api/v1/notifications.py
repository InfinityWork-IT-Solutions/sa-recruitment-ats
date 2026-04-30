
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.schemas.notification import NotificationResponse, NotificationListResponse, NotificationUpdate
from app.services.notification_service import NotificationService

router = APIRouter()

@router.get("/", response_model=NotificationListResponse)
async def get_my_notifications(
    limit: int = 20,
    offset: int = 0,
    unread_only: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's notifications
    """
    notifications = await NotificationService.get_user_notifications(
        db, current_user.id, limit, offset, unread_only
    )
    unread_count = await NotificationService.get_unread_count(db, current_user.id)
    
    return {
        "notifications": notifications,
        "unread_count": unread_count
    }

@router.put("/{notification_id}", response_model=NotificationResponse)
async def update_notification(
    notification_id: UUID,
    update_data: NotificationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a notification (e.g., mark as read)
    """
    if update_data.is_read:
        await NotificationService.mark_as_read(db, current_user.id, notification_id)
    
    # Return updated notification
    from app.models.notification import Notification
    notification = await db.get(Notification, notification_id)
    if not notification or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    return notification

@router.post("/mark-all-read")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark all user's notifications as read
    """
    await NotificationService.mark_all_as_read(db, current_user.id)
    return {"message": "All notifications marked as read"}

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a notification
    """
    success = await NotificationService.delete_notification(db, current_user.id, notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted"}
