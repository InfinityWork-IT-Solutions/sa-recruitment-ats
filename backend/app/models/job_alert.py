"""JobAlert — candidates subscribe to notifications for new matching jobs"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class JobAlert(Base):
    __tablename__ = "job_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    keywords = Column(String(500))
    location = Column(String(200))
    employment_type = Column(String(50))
    salary_min = Column(Integer)
    frequency = Column(String(20), default="daily")  # immediate | daily | weekly
    is_active = Column(Boolean, default=True, nullable=False)
    last_sent_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
