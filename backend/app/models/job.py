"""
Job model for job postings
"""
from datetime import datetime, timedelta
from sqlalchemy import Boolean, Column, DateTime, String, Integer, Text, ForeignKey, Enum, ARRAY, Index
from sqlalchemy.dialects.postgresql import UUID, TSVECTOR
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class JobStatus(str, enum.Enum):
    """Job status"""
    DRAFT = "draft"              # Not yet published
    ACTIVE = "active"            # Published and accepting applications
    PAUSED = "paused"            # Temporarily paused
    CLOSED = "closed"            # Closed, no longer accepting applications
    FILLED = "filled"            # Position filled
    EXPIRED = "expired"          # Past closing date


class EmploymentType(str, enum.Enum):
    """Employment type"""
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    TEMPORARY = "temporary"
    INTERNSHIP = "internship"
    FREELANCE = "freelance"


class ExperienceLevel(str, enum.Enum):
    """Experience level required"""
    ENTRY_LEVEL = "entry_level"        # 0-2 years
    MID_LEVEL = "mid_level"            # 3-5 years
    SENIOR_LEVEL = "senior_level"      # 6-10 years
    EXECUTIVE = "executive"            # 10+ years


class Job(Base):
    """Job model"""
    __tablename__ = "jobs"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Agency relationship (multi-tenancy)
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Client company (who the job is for)
    client_company_id = Column(UUID(as_uuid=True), ForeignKey("client_companies.id", ondelete="SET NULL"))
    
    # Created by
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    
    # Basic Information
    title = Column(String(255), nullable=False)
    reference = Column(String(50), unique=True, nullable=False, index=True)  # JOB-2026-0001
    description = Column(Text, nullable=False)
    requirements = Column(Text)
    responsibilities = Column(Text)
    benefits = Column(Text)
    
    # Skills & Experience
    skills = Column(ARRAY(String), default=list)  # ["Python", "AWS", "Docker"]
    years_of_experience_min = Column(Integer, default=0)
    years_of_experience_max = Column(Integer)
    experience_level = Column(Enum(ExperienceLevel))
    
    # Education
    education_level = Column(String(100))  # "Matric", "BCom", "BSc Computer Science"
    certifications = Column(ARRAY(String), default=list)  # ["AWS Certified", "PMP"]
    
    # Location & Work Arrangement
    location = Column(String(255), nullable=False)
    city = Column(String(100))
    province = Column(String(100))
    country = Column(String(100), default="South Africa")
    is_remote = Column(Boolean, default=False)
    remote_type = Column(String(50))  # "fully_remote", "hybrid", "office_only"
    
    # Employment Details
    employment_type = Column(Enum(EmploymentType), nullable=False, default=EmploymentType.FULL_TIME)
    
    # Salary
    salary_min = Column(Integer)  # In ZAR
    salary_max = Column(Integer)  # In ZAR
    salary_currency = Column(String(10), default="ZAR")
    salary_period = Column(String(20), default="monthly")  # "monthly", "annually", "hourly"
    show_salary = Column(Boolean, default=False)
    
    # Dates
    posting_date = Column(DateTime(timezone=True), default=datetime.utcnow)
    closing_date = Column(DateTime(timezone=True))
    start_date = Column(DateTime(timezone=True))  # Expected start date
    
    # Status
    status = Column(Enum(JobStatus), nullable=False, default=JobStatus.DRAFT, index=True)
    is_urgent = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)
    
    # Multi-board posting
    post_to_pnet = Column(Boolean, default=False)
    post_to_careerjunction = Column(Boolean, default=False)
    post_to_linkedin = Column(Boolean, default=False)
    pnet_job_id = Column(String(100))
    careerjunction_job_id = Column(String(100))
    linkedin_job_id = Column(String(100))
    
    # Metrics
    views_count = Column(Integer, default=0)
    applications_count = Column(Integer, default=0)
    
    # Full-text search
    search_vector = Column(TSVECTOR)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    published_at = Column(DateTime(timezone=True))
    closed_at = Column(DateTime(timezone=True))
    
    # Relationships
    agency = relationship("Agency", back_populates="jobs")
    client_company = relationship("ClientCompany", back_populates="jobs")
    creator = relationship("User", foreign_keys=[created_by])
    # applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
    
    # Indexes for performance
    __table_args__ = (
        # GIN index for skills array search
        Index('idx_jobs_skills', 'skills', postgresql_using='gin'),
        # GIN index for full-text search
        Index('idx_jobs_search', 'search_vector', postgresql_using='gin'),
        # Composite index for agency + status queries
        Index('idx_jobs_agency_status', 'agency_id', 'status'),
    )
    
    def __repr__(self):
        return f"<Job {self.reference}: {self.title}>"
    
    @property
    def is_active(self) -> bool:
        """Check if job is currently active"""
        return self.status == JobStatus.ACTIVE
    
    @property
    def is_expired(self) -> bool:
        """Check if job has expired"""
        if not self.closing_date:
            return False
        return datetime.utcnow() > self.closing_date
    
    @property
    def days_until_closing(self) -> int:
        """Get days until closing date"""
        if not self.closing_date:
            return -1
        delta = self.closing_date - datetime.utcnow()
        return max(0, delta.days)
    
    @property
    def salary_range_display(self) -> str:
        """Get formatted salary range"""
        if not self.show_salary or not self.salary_min:
            return "Salary not disclosed"
        
        currency = self.salary_currency or "ZAR"
        
        if self.salary_max:
            return f"{currency} {self.salary_min:,} - {self.salary_max:,}"
        return f"{currency} {self.salary_min:,}"
    
    def publish(self):
        """Publish the job (change status to active)"""
        self.status = JobStatus.ACTIVE
        self.published_at = datetime.utcnow()
        
        # Set default closing date if not set (30 days)
        if not self.closing_date:
            self.closing_date = datetime.utcnow() + timedelta(days=30)
    
    def close(self):
        """Close the job"""
        self.status = JobStatus.CLOSED
        self.closed_at = datetime.utcnow()
    
    def mark_as_filled(self):
        """Mark job as filled"""
        self.status = JobStatus.FILLED
        self.closed_at = datetime.utcnow()
