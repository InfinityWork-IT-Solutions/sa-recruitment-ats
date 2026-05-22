"""
Saved Search Service — persist and retrieve filter presets per user
"""
from typing import List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.saved_search import SavedSearch, SearchType


class SavedSearchService:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_saved_searches(self, user_id: UUID, search_type: Optional[str] = None) -> List[dict]:
        query = select(SavedSearch).where(SavedSearch.user_id == user_id)
        if search_type:
            query = query.where(SavedSearch.search_type == SearchType(search_type))
        query = query.order_by(SavedSearch.created_at.desc())

        result = await self.db.execute(query)
        searches = result.scalars().all()
        return [self._serialize(s) for s in searches]

    async def create_saved_search(
        self,
        user_id: UUID,
        name: str,
        search_type: str,
        filters: dict,
    ) -> dict:
        search = SavedSearch(
            user_id=user_id,
            name=name,
            search_type=SearchType(search_type),
            filters=filters,
        )
        self.db.add(search)
        await self.db.flush()
        return self._serialize(search)

    async def delete_saved_search(self, search_id: UUID, user_id: UUID) -> bool:
        result = await self.db.execute(
            select(SavedSearch).where(SavedSearch.id == search_id, SavedSearch.user_id == user_id)
        )
        search = result.scalar_one_or_none()
        if not search:
            return False
        await self.db.delete(search)
        return True

    def _serialize(self, search: SavedSearch) -> dict:
        return {
            "id": str(search.id),
            "user_id": str(search.user_id),
            "name": search.name,
            "search_type": search.search_type.value,
            "filters": search.filters or {},
            "created_at": search.created_at.isoformat(),
        }
