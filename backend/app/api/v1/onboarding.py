"""
Onboarding Checklist API — post-hire new employee onboarding
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import User
from app.services.onboarding_service import OnboardingService

router = APIRouter()


class ChecklistCreate(BaseModel):
    custom_items: Optional[List[dict]] = None


class ItemUpdate(BaseModel):
    is_completed: bool


@router.get("/{application_id}/onboarding")
async def get_checklist(
    application_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get onboarding checklist for a hired candidate."""
    service = OnboardingService(db)
    checklist = await service.get_checklist(application_id)
    if not checklist:
        raise HTTPException(status_code=404, detail="Onboarding checklist not found")
    return checklist


@router.post("/{application_id}/onboarding", status_code=status.HTTP_201_CREATED)
async def create_checklist(
    application_id: UUID,
    body: ChecklistCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create onboarding checklist for a hired candidate (SA HR defaults pre-populated)."""
    service = OnboardingService(db)
    return await service.create_checklist(
        application_id=application_id,
        created_by=current_user.id,
        custom_items=body.custom_items,
    )


@router.patch("/{application_id}/onboarding/items/{item_id}")
async def update_checklist_item(
    application_id: UUID,
    item_id: UUID,
    body: ItemUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark an onboarding checklist item as complete or incomplete."""
    service = OnboardingService(db)
    return await service.update_item(item_id, body.is_completed, current_user.id)
