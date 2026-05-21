from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime

from app.models.notification_preference import NotificationPreference
from app.schemas.notification_preference import NotificationPreferenceUpdate


class NotificationPreferenceService:

    @staticmethod
    async def get_or_create(db: AsyncSession, user_id: UUID) -> NotificationPreference:
        """Get preferences for a user, creating defaults if they don't exist yet."""
        result = await db.execute(
            select(NotificationPreference).where(NotificationPreference.user_id == user_id)
        )
        prefs = result.scalar_one_or_none()
        if prefs is None:
            prefs = NotificationPreference(user_id=user_id)
            db.add(prefs)
            await db.commit()
            await db.refresh(prefs)
        return prefs

    @staticmethod
    async def update(
        db: AsyncSession, user_id: UUID, data: NotificationPreferenceUpdate
    ) -> NotificationPreference:
        prefs = await NotificationPreferenceService.get_or_create(db, user_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(prefs, field, value)
        prefs.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(prefs)
        return prefs

    @staticmethod
    async def should_notify(
        db: AsyncSession, user_id: UUID, channel: str, notification_type: str
    ) -> bool:
        """
        Check if a user wants to receive a given notification.
        channel: 'inapp' or 'email'
        notification_type: 'new_application', 'application_status', 'ai_match',
                           'interview', 'offer', 'billing', 'system'
        """
        prefs = await NotificationPreferenceService.get_or_create(db, user_id)
        field = f"{channel}_{notification_type}"
        return getattr(prefs, field, True)
