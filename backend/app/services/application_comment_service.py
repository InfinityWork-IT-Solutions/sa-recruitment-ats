"""
Application Comment Service — internal hiring team discussion threads
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.comment import ApplicationComment
from app.models.user import User
from app.services.notification_service import NotificationService


class ApplicationCommentService:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_comments(self, application_id: UUID) -> List[dict]:
        result = await self.db.execute(
            select(ApplicationComment)
            .where(ApplicationComment.application_id == application_id)
            .order_by(ApplicationComment.created_at.asc())
        )
        comments = result.scalars().all()

        output = []
        for c in comments:
            author_result = await self.db.execute(
                select(User).where(User.id == c.user_id)
            )
            author = author_result.scalar_one_or_none()
            output.append({
                "id": str(c.id),
                "application_id": str(c.application_id),
                "user_id": str(c.user_id) if c.user_id else None,
                "author_name": f"{author.first_name} {author.last_name}" if author else "Unknown",
                "author_avatar": author.avatar_url if author else None,
                "content": c.content,
                "mentioned_user_ids": c.mentioned_user_ids or [],
                "is_internal": c.is_internal,
                "created_at": c.created_at.isoformat(),
                "updated_at": c.updated_at.isoformat(),
            })
        return output

    async def create_comment(
        self,
        application_id: UUID,
        user_id: UUID,
        content: str,
        mentioned_user_ids: Optional[List[UUID]] = None,
    ) -> dict:
        comment = ApplicationComment(
            application_id=application_id,
            user_id=user_id,
            content=content,
            mentioned_user_ids=[str(uid) for uid in (mentioned_user_ids or [])],
        )
        self.db.add(comment)
        await self.db.flush()

        # Notify mentioned users
        if mentioned_user_ids:
            notification_svc = NotificationService(self.db)
            for mentioned_id in mentioned_user_ids:
                try:
                    await notification_svc.create_notification(
                        user_id=mentioned_id,
                        title="You were mentioned in a comment",
                        message=f"Someone mentioned you in an application discussion.",
                        notification_type="application",
                        link=f"/applications/{application_id}",
                    )
                except Exception:
                    pass

        return {
            "id": str(comment.id),
            "application_id": str(comment.application_id),
            "user_id": str(comment.user_id),
            "content": comment.content,
            "mentioned_user_ids": comment.mentioned_user_ids,
            "is_internal": comment.is_internal,
            "created_at": comment.created_at.isoformat(),
        }

    async def delete_comment(self, comment_id: UUID, requesting_user_id: UUID) -> bool:
        result = await self.db.execute(
            select(ApplicationComment).where(ApplicationComment.id == comment_id)
        )
        comment = result.scalar_one_or_none()
        if not comment:
            return False
        if comment.user_id != requesting_user_id:
            return False
        await self.db.delete(comment)
        return True
