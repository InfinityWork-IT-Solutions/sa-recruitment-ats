"""
Onboarding Service — post-hire checklist for new employees (SA HR defaults included)
"""
from typing import List, Optional, Dict
from uuid import UUID
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.onboarding import OnboardingChecklist, OnboardingChecklistItem, ChecklistItemCategory


DEFAULT_SA_ONBOARDING_ITEMS = [
    {"title": "Signed offer letter", "category": "documents", "description": "Collect countersigned offer letter from candidate.", "order_index": 0},
    {"title": "Certified copy of ID document", "category": "documents", "description": "SA ID or valid passport (certified within 3 months).", "order_index": 1},
    {"title": "SARS tax number (IT150)", "category": "documents", "description": "Obtain employee's income tax reference number.", "order_index": 2},
    {"title": "Bank details confirmation", "category": "documents", "description": "Bank account details for payroll (stamped bank letter or statement).", "order_index": 3},
    {"title": "Signed NDA / confidentiality agreement", "category": "documents", "description": "Company NDA signed before start date.", "order_index": 4},
    {"title": "Qualifications verification", "category": "documents", "description": "Certified copies of relevant qualifications and certificates.", "order_index": 5},
    {"title": "IT access request submitted", "category": "access", "description": "Email, systems, VPN and software access provisioned.", "order_index": 6},
    {"title": "Equipment ordered / prepared", "category": "equipment", "description": "Laptop, phone, desk accessories ready for day 1.", "order_index": 7},
    {"title": "Payroll registered", "category": "hr", "description": "Employee added to payroll system with correct details.", "order_index": 8},
    {"title": "Welcome email sent", "category": "hr", "description": "Send welcome email with day-1 details, parking, dress code.", "order_index": 9},
]


class OnboardingService:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_checklist(self, application_id: UUID) -> Optional[dict]:
        result = await self.db.execute(
            select(OnboardingChecklist)
            .where(OnboardingChecklist.application_id == application_id)
        )
        checklist = result.scalar_one_or_none()
        if not checklist:
            return None
        return await self._serialize(checklist)

    async def create_checklist(
        self,
        application_id: UUID,
        created_by: UUID,
        custom_items: Optional[List[Dict]] = None,
    ) -> dict:
        checklist = OnboardingChecklist(
            application_id=application_id,
            created_by=created_by,
        )
        self.db.add(checklist)
        await self.db.flush()

        items_data = custom_items if custom_items else DEFAULT_SA_ONBOARDING_ITEMS
        for item_data in items_data:
            item = OnboardingChecklistItem(
                checklist_id=checklist.id,
                title=item_data["title"],
                description=item_data.get("description"),
                category=ChecklistItemCategory(item_data.get("category", "other")),
                order_index=item_data.get("order_index", 0),
            )
            self.db.add(item)

        await self.db.flush()
        return await self._serialize(checklist)

    async def update_item(
        self,
        item_id: UUID,
        is_completed: bool,
        completed_by: UUID,
    ) -> dict:
        result = await self.db.execute(
            select(OnboardingChecklistItem).where(OnboardingChecklistItem.id == item_id)
        )
        item = result.scalar_one_or_none()
        if not item:
            raise ValueError("Checklist item not found")

        item.is_completed = is_completed
        if is_completed:
            item.completed_at = datetime.utcnow()
            item.completed_by = completed_by
        else:
            item.completed_at = None
            item.completed_by = None

        return {
            "id": str(item.id),
            "is_completed": item.is_completed,
            "completed_at": item.completed_at.isoformat() if item.completed_at else None,
        }

    async def _serialize(self, checklist: OnboardingChecklist) -> dict:
        result = await self.db.execute(
            select(OnboardingChecklistItem)
            .where(OnboardingChecklistItem.checklist_id == checklist.id)
            .order_by(OnboardingChecklistItem.order_index)
        )
        items = result.scalars().all()
        completed = sum(1 for i in items if i.is_completed)
        total = len(items)

        return {
            "id": str(checklist.id),
            "application_id": str(checklist.application_id),
            "created_at": checklist.created_at.isoformat(),
            "progress_percent": round((completed / total) * 100) if total > 0 else 0,
            "completed_count": completed,
            "total_count": total,
            "items": [
                {
                    "id": str(i.id),
                    "title": i.title,
                    "description": i.description,
                    "category": i.category.value,
                    "order_index": i.order_index,
                    "is_completed": i.is_completed,
                    "completed_at": i.completed_at.isoformat() if i.completed_at else None,
                    "due_date": i.due_date.isoformat() if i.due_date else None,
                }
                for i in items
            ],
        }
