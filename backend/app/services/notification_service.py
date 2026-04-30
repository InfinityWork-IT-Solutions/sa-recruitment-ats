
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc, func
from uuid import UUID
from datetime import datetime
from typing import List, Optional, Dict, Any

from app.models.notification import Notification
from app.schemas.notification import NotificationCreate

class NotificationService:
    @staticmethod
    async def create_notification(
        db: AsyncSession,
        user_id: UUID,
        title: str,
        message: str,
        notification_type: str = "info",
        link: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Notification:
        """
        Create a new notification for a user
        """
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notification_type,
            link=link,
            metadata=metadata
        )
        db.add(notification)
        await db.commit()
        await db.refresh(notification)
        return notification

    @staticmethod
    async def get_user_notifications(
        db: AsyncSession,
        user_id: UUID,
        limit: int = 20,
        offset: int = 0,
        unread_only: bool = False
    ) -> List[Notification]:
        """
        Get notifications for a user
        """
        query = select(Notification).where(Notification.user_id == user_id)
        
        if unread_only:
            query = query.where(Notification.is_read == False)
            
        query = query.order_by(desc(Notification.created_at)).limit(limit).offset(offset)
        
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_unread_count(db: AsyncSession, user_id: UUID) -> int:
        """
        Get count of unread notifications for a user
        """
        query = select(func.count(Notification.id)).where(
            Notification.user_id == user_id,
            Notification.is_read == False
        )
        result = await db.execute(query)
        return result.scalar() or 0

    @staticmethod
    async def mark_as_read(db: AsyncSession, user_id: UUID, notification_id: UUID) -> bool:
        """
        Mark a specific notification as read
        """
        stmt = (
            update(Notification)
            .where(Notification.id == notification_id, Notification.user_id == user_id)
            .values(is_read=True, read_at=datetime.utcnow())
        )
        await db.execute(stmt)
        await db.commit()
        return True

    @staticmethod
    async def mark_all_as_read(db: AsyncSession, user_id: UUID) -> bool:
        """
        Mark all notifications for a user as read
        """
        stmt = (
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
            .values(is_read=True, read_at=datetime.utcnow())
        )
        await db.execute(stmt)
        await db.commit()
        return True

    @staticmethod
    async def delete_notification(db: AsyncSession, user_id: UUID, notification_id: UUID) -> bool:
        """
        Delete a notification
        """
        query = select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id)
        result = await db.execute(query)
        notification = result.scalar_one_or_none()
        
        if notification:
            await db.delete(notification)
            await db.commit()
            return True
        return False
