"""
Career Page Service — branded public jobs page per client company
"""
import re
import uuid
from typing import Optional, Dict, List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.career_page import CareerPage
from app.models.client_company import ClientCompany
from app.models.job import Job, JobStatus


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text[:80]


class CareerPageService:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create(self, company_id: UUID) -> dict:
        result = await self.db.execute(
            select(CareerPage).where(CareerPage.company_id == company_id)
        )
        page = result.scalar_one_or_none()
        if page:
            return self._serialize(page)

        # Auto-generate slug from company name
        company_result = await self.db.execute(
            select(ClientCompany).where(ClientCompany.id == company_id)
        )
        company = company_result.scalar_one_or_none()
        base_slug = _slugify(company.name if company else str(company_id))
        slug = await self._unique_slug(base_slug)

        page = CareerPage(
            company_id=company_id,
            slug=slug,
            headline=f"Join {company.name}" if company else "Join Our Team",
            tagline="We're looking for talented people to help us grow.",
        )
        self.db.add(page)
        await self.db.flush()
        return self._serialize(page)

    async def update(self, company_id: UUID, data: Dict) -> dict:
        result = await self.db.execute(
            select(CareerPage).where(CareerPage.company_id == company_id)
        )
        page = result.scalar_one_or_none()
        if not page:
            return await self.get_or_create(company_id)

        allowed = ['headline', 'tagline', 'hero_image_url', 'primary_color',
                   'show_perks', 'perks', 'culture_description', 'seo_title',
                   'seo_description', 'is_published']
        for field in allowed:
            if field in data:
                setattr(page, field, data[field])

        return self._serialize(page)

    async def get_public_page(self, slug: str) -> Optional[dict]:
        result = await self.db.execute(
            select(CareerPage).where(CareerPage.slug == slug, CareerPage.is_published == True)
        )
        page = result.scalar_one_or_none()
        if not page:
            return None

        company_result = await self.db.execute(
            select(ClientCompany).where(ClientCompany.id == page.company_id)
        )
        company = company_result.scalar_one_or_none()

        jobs_result = await self.db.execute(
            select(Job).where(
                Job.client_company_id == page.company_id,
                Job.status == JobStatus.active,
                Job.is_template == False,
            ).order_by(Job.created_at.desc())
        )
        jobs = jobs_result.scalars().all()

        return {
            **self._serialize(page),
            "company_name": company.name if company else "",
            "company_logo": company.logo_url if company else None,
            "company_website": company.website if company else None,
            "active_jobs": [
                {
                    "id": str(j.id),
                    "title": j.title,
                    "location": j.location,
                    "employment_type": j.employment_type.value,
                    "experience_level": j.experience_level.value,
                    "is_remote": j.is_remote,
                    "salary_min": j.salary_min,
                    "salary_max": j.salary_max,
                    "show_salary": j.show_salary,
                    "posted_at": j.created_at.isoformat(),
                }
                for j in jobs
            ],
        }

    async def _unique_slug(self, base: str) -> str:
        slug = base
        attempt = 0
        while True:
            result = await self.db.execute(
                select(CareerPage).where(CareerPage.slug == slug)
            )
            if not result.scalar_one_or_none():
                return slug
            attempt += 1
            slug = f"{base}-{attempt}"

    def _serialize(self, page: CareerPage) -> dict:
        return {
            "id": str(page.id),
            "company_id": str(page.company_id),
            "slug": page.slug,
            "headline": page.headline,
            "tagline": page.tagline,
            "hero_image_url": page.hero_image_url,
            "primary_color": page.primary_color,
            "show_perks": page.show_perks,
            "perks": page.perks or [],
            "culture_description": page.culture_description,
            "seo_title": page.seo_title,
            "seo_description": page.seo_description,
            "is_published": page.is_published,
            "public_url": f"/p/{page.slug}",
            "created_at": page.created_at.isoformat(),
            "updated_at": page.updated_at.isoformat(),
        }
