"""
OnboardingChecklist models — post-hire document & task checklist for new hires
"""
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, String, Text, ForeignKey, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class ChecklistItemCategory(str, enum.Enum):
    documents = "documents"
    access = "access"
    equipment = "equipment"
    hr = "hr"
    other = "other"


class OnboardingChecklist(Base):
    __tablename__ = "onboarding_checklists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    application = relationship("Application", back_populates="onboarding_checklist")
    items = relationship("OnboardingChecklistItem", back_populates="checklist", order_by="OnboardingChecklistItem.order_index", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])


class OnboardingChecklistItem(Base):
    __tablename__ = "onboarding_checklist_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    checklist_id = Column(UUID(as_uuid=True), ForeignKey("onboarding_checklists.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    completed_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    order_index = Column(Integer, default=0, nullable=False)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    category = Column(Enum(ChecklistItemCategory), default=ChecklistItemCategory.other, nullable=False)

    checklist = relationship("OnboardingChecklist", back_populates="items")
    completer = relationship("User", foreign_keys=[completed_by])
    assignee = relationship("User", foreign_keys=[assigned_to])
