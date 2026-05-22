"""
SavedSearch model — saved filter presets for candidates/jobs/applications views
"""
from datetime import datetime
from sqlalchemy import Column, DateTime, String, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class SearchType(str, enum.Enum):
    candidates = "candidates"
    jobs = "jobs"
    applications = "applications"


class SavedSearch(Base):
    __tablename__ = "saved_searches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    search_type = Column(Enum(SearchType), nullable=False)
    filters = Column(JSONB, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="saved_searches")
