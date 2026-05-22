"""
Application Comments API — internal hiring team discussion threads
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import User
from app.services.application_comment_service import ApplicationCommentService

router = APIRouter()


class CommentCreate(BaseModel):
    content: str
    mentioned_user_ids: Optional[List[UUID]] = []


@router.get("/{application_id}/comments")
async def get_comments(
    application_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all comments for an application."""
    service = ApplicationCommentService(db)
    return await service.get_comments(application_id)


@router.post("/{application_id}/comments", status_code=status.HTTP_201_CREATED)
async def add_comment(
    application_id: UUID,
    body: CommentCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a comment to an application."""
    service = ApplicationCommentService(db)
    return await service.create_comment(
        application_id=application_id,
        user_id=current_user.id,
        content=body.content,
        mentioned_user_ids=body.mentioned_user_ids,
    )


@router.delete("/{application_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    application_id: UUID,
    comment_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a comment (author only)."""
    service = ApplicationCommentService(db)
    deleted = await service.delete_comment(comment_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Comment not found or not yours")
