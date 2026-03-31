"""
Candidate model for job applicants
"""
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, String, Integer, Text, ForeignKey, Enum, ARRAY, Index, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class CandidateStatus(str, enum.Enum):
    """Candidate status"""
    active = "active"                # Actively looking
    passive = "passive"              # Open to opportunities
    placed = "placed"                # Successfully placed
    not_interested = "not_interested"  # No longer interested
    blacklisted = "blacklisted"      # Do not contact


class CandidateSource(str, enum.Enum):
    """How candidate was sourced"""
    direct_application = "direct_application"
    referral = "referral"
    linkedin = "linkedin"
    pnet = "pnet"
    career_junction = "career_junction"
    headhunted = "headhunted"
    walk_in = "walk_in"
    other = "other"


class Candidate(Base):
    """Candidate model"""
    __tablename__ = "candidates"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Agency relationship (multi-tenancy)
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # User relationship
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    
    # Added by
    added_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    
    # Personal Information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50))
    alternative_phone = Column(String(50))
    
    # Location
    city = Column(String(100))
    province = Column(String(100))
    country = Column(String(100), default="South Africa")
    is_willing_to_relocate = Column(Boolean, default=False)
    
    # Professional Information
    current_job_title = Column(String(255))
    current_company = Column(String(255))
    years_of_experience = Column(Integer, default=0)
    skills = Column(ARRAY(String), default=list)  # ["Python", "AWS", "Docker"]
    
    # Education
    education_level = Column(String(100))  # "Matric", "BCom", "BSc Computer Science"
    education_details = Column(JSONB)  # [{degree, institution, year, field}]
    certifications = Column(ARRAY(String), default=list)  # ["AWS Certified", "PMP"]
    
    # Employment
    employment_type_preference = Column(String(50))  # "full_time", "contract", etc.
    notice_period_days = Column(Integer)  # Notice period in days
    
    # Salary
    current_salary = Column(Integer)  # In ZAR
    expected_salary_min = Column(Integer)  # In ZAR
    expected_salary_max = Column(Integer)  # In ZAR
    salary_currency = Column(String(10), default="ZAR")
    
    # Resume/CV
    resume_filename = Column(String(255))
    resume_url = Column(String(500))  # S3 URL or local path
    resume_text = Column(Text)  # Extracted text for searching
    resume_parsed_data = Column(JSONB)  # AI-parsed resume data
    
    # LinkedIn & Social
    linkedin_url = Column(String(255))
    portfolio_url = Column(String(255))
    github_url = Column(String(255))
    
    # Status & Source
    status = Column(Enum(CandidateStatus), nullable=False, default=CandidateStatus.active, index=True)
    source = Column(Enum(CandidateSource), default=CandidateSource.direct_application)
    source_details = Column(String(255))  # E.g., "Referred by John Doe"
    
    # Availability
    is_immediately_available = Column(Boolean, default=False)
    available_from = Column(DateTime(timezone=True))
    
    # Notes & Tags
    notes = Column(Text)  # Internal notes
    tags = Column(ARRAY(String), default=list)  # ["senior", "python", "urgent"]
    
    # POPIA Compliance
    consent_to_contact = Column(Boolean, default=False, nullable=False)
    consent_date = Column(DateTime(timezone=True))
    consent_ip = Column(String(45))
    gdpr_consent = Column(Boolean, default=False)
    
    # Metrics
    applications_count = Column(Integer, default=0)
    interviews_count = Column(Integer, default=0)
    placements_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_contacted_at = Column(DateTime(timezone=True))
    
    # Relationships
    agency = relationship("Agency", back_populates="candidates")
    user = relationship("User", foreign_keys="Candidate.user_id", back_populates="candidate")
    recruiter = relationship("User", foreign_keys=[added_by])
    applications = relationship("Application", back_populates="candidate", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        # GIN index for skills array search
        Index('idx_candidates_skills', 'skills', postgresql_using='gin'),
        # GIN index for tags search
        Index('idx_candidates_tags', 'tags', postgresql_using='gin'),
        # Composite index for agency + status
        Index('idx_candidates_agency_status', 'agency_id', 'status'),
        # Index for email searches
        Index('idx_candidates_email_lower', func.lower(email)),
    )
    
    def __repr__(self):
        return f"<Candidate {self.first_name} {self.last_name}>"
    
    @property
    def full_name(self) -> str:
        """Get candidate's full name"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def expected_salary_range(self) -> str:
        """Get formatted expected salary range"""
        if not self.expected_salary_min:
            return "Not specified"
        
        currency = self.salary_currency or "ZAR"
        
        if self.expected_salary_max:
            return f"{currency} {self.expected_salary_min:,} - {self.expected_salary_max:,}"
        return f"{currency} {self.expected_salary_min:,}+"
    
    @property
    def is_available(self) -> bool:
        """Check if candidate is available"""
        if self.status not in [CandidateStatus.active, CandidateStatus.passive]:
            return False
        
        if self.is_immediately_available:
            return True
        
        if self.available_from:
            return datetime.utcnow() >= self.available_from
        
        return True
