"""
Career Page API — branded public jobs page per client company
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from pydantic import BaseModel
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import User, ClientCompany
from app.services.career_page_service import CareerPageService

router = APIRouter()


class CareerPageUpdate(BaseModel):
    headline: Optional[str] = None
    tagline: Optional[str] = None
    hero_image_url: Optional[str] = None
    primary_color: Optional[str] = None
    show_perks: Optional[bool] = None
    perks: Optional[List[dict]] = None
    culture_description: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    is_published: Optional[bool] = None


async def _get_company_id(user: User, db: AsyncSession) -> UUID:
    result = await db.execute(select(ClientCompany).where(ClientCompany.user_id == user.id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")
    return company.id


@router.get("/company/career-page")
async def get_career_page(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get (or auto-create) the career page for the current user's company."""
    company_id = await _get_company_id(current_user, db)
    service = CareerPageService(db)
    return await service.get_or_create(company_id)


@router.put("/company/career-page")
async def update_career_page(
    body: CareerPageUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the career page settings."""
    company_id = await _get_company_id(current_user, db)
    service = CareerPageService(db)
    return await service.update(company_id, body.model_dump(exclude_none=True))


@router.get("/p/{slug}")
async def get_public_career_page(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Public career page — no authentication required."""
    service = CareerPageService(db)
    page = await service.get_public_page(slug)
    if not page:
        raise HTTPException(status_code=404, detail="Career page not found or not published")
    return page
