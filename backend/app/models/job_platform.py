from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Index, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.core.database import Base

class JobPlatformPosting(Base):
    """Track which jobs are posted on which platforms"""
    __tablename__ = "job_platform_postings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(50), nullable=False)
    
    # External platform's job ID
    platform_job_id = Column(String(255))
    
    # Status tracking
    status = Column(String(20), nullable=False, default='active') # 'active', 'closed', 'paused', 'error'
    error_message = Column(Text)
    
    # Metrics
    views_count = Column(Integer, default=0)
    applications_count = Column(Integer, default=0)
    
    # Timestamps
    posted_at = Column(DateTime)
    closed_at = Column(DateTime)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('job_id', 'platform', name='uix_job_platform'),
        Index('idx_job_platform_postings_job', 'job_id'),
        Index('idx_job_platform_postings_platform', 'platform'),
    )

    # Relationships
    job = relationship("Job", backref="platform_postings")
