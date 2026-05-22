"""
Saved Searches API — persist filter presets per user
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import User
from app.services.saved_search_service import SavedSearchService

router = APIRouter()


class SavedSearchCreate(BaseModel):
    name: str
    search_type: str
    filters: dict = {}


@router.get("/saved-searches")
async def list_saved_searches(
    search_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List saved searches for the current user."""
    service = SavedSearchService(db)
    return await service.get_saved_searches(current_user.id, search_type)


@router.post("/saved-searches", status_code=status.HTTP_201_CREATED)
async def create_saved_search(
    body: SavedSearchCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Save a search filter preset."""
    service = SavedSearchService(db)
    return await service.create_saved_search(
        user_id=current_user.id,
        name=body.name,
        search_type=body.search_type,
        filters=body.filters,
    )


@router.delete("/saved-searches/{search_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_search(
    search_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a saved search."""
    service = SavedSearchService(db)
    deleted = await service.delete_saved_search(search_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Saved search not found")
