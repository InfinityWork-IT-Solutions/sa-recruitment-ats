"""
Client Company model - Companies that hire through the agency
"""
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class ClientCompany(Base):
    """Client Company model - Companies that use the recruitment agency"""
    __tablename__ = "client_companies"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Agency relationship (multi-tenancy)
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # User relationship (Primary contact/admin)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), unique=True)
    
    # Company Information
    name = Column(String(255), nullable=False, index=True)
    logo_url = Column(String(500))
    industry = Column(String(100))
    company_size = Column(String(50))  # "1-10", "11-50", "51-200", "201-500", "500+"
    website = Column(String(255))
    description = Column(Text)
    
    # Contact Information
    contact_name = Column(String(255))
    contact_email = Column(String(255))
    contact_phone = Column(String(50))
    contact_position = Column(String(100))
    
    # Address
    address_line1 = Column(String(255))
    address_line2 = Column(String(255))
    city = Column(String(100))
    province = Column(String(100))
    postal_code = Column(String(20))
    country = Column(String(100), default="South Africa")
    
    # Business Details
    registration_number = Column(String(100))
    vat_number = Column(String(100))
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Notes
    notes = Column(Text)  # Internal notes about the client
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    agency = relationship("Agency", back_populates="client_companies")
    user = relationship("User", back_populates="client_company")
    jobs = relationship("Job", back_populates="client_company")
    applications = relationship("Application", back_populates="client_company", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<ClientCompany {self.name}>"
    
    @property
    def total_jobs(self) -> int:
        """Get total number of jobs for this client"""
        return len(self.jobs) if self.jobs else 0
    
    @property
    def active_jobs(self) -> int:
        """Get number of active jobs"""
        if not self.jobs:
            return 0
        from app.models.job import JobStatus
        return len([j for j in self.jobs if j.status == JobStatus.ACTIVE])
