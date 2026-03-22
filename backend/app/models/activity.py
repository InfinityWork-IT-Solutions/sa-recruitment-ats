"""
Activity model for audit logging and tracking
"""
from datetime import datetime
from sqlalchemy import Column, DateTime, String, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class Activity(Base):
    """Activity/audit log"""
    __tablename__ = "activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False)
    
    # Activity details
    action = Column(String(100), nullable=False)  # e.g., "job_created", "candidate_hired"
    entity_type = Column(String(50))  # e.g., "job", "candidate", "application"
    entity_id = Column(UUID(as_uuid=True))
    
    description = Column(String(255))
    activity_metadata = Column(JSON)  # Renamed from metadata to avoid reserved keyword conflict
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="activities")
    agency = relationship("Agency")

    def __repr__(self):
        return f"<Activity {self.action} by {self.user_id}>"
