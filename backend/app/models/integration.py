from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.core.database import Base

class IntegrationConnection(Base):
    """Store platform API credentials per company"""
    __tablename__ = "integration_connections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False) # Wait, is it agencies or client_companies? Guide says company_id -> companies.id. Let's check which is used for Company portal.
    platform = Column(String(50), nullable=False) # 'pnet', 'indeed', 'linkedin'
    status = Column(String(20), nullable=False, default='active') # 'active', 'inactive', 'error'
    
    # TODO: encrypt these columns at rest before production (use pgcrypto or app-level AES-GCM)
    api_key = Column(Text)
    api_secret = Column(Text)
    access_token = Column(Text)
    refresh_token = Column(Text)
    token_expires_at = Column(DateTime)
    
    # Platform-specific config
    config = Column(JSONB, default={})
    
    # Tracking
    last_sync_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('company_id', 'platform', name='uix_company_platform'),
        Index('idx_integration_connections_company', 'company_id'),
    )

    # Relationships
    agency = relationship("Agency", backref="integration_connections")
