"""
Job model for job postings
"""
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, String, Integer, Text, ForeignKey, Enum, ARRAY, Index
from sqlalchemy.dialects.postgresql import UUID, TSVECTOR
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class JobStatus(str, enum.Enum):
    """Job status"""
    draft = "draft"              # Not yet published
    active = "active"            # Published and accepting applications
    paused = "paused"            # Temporarily paused
    closed = "closed"            # Closed, no longer accepting applications
    filled = "filled"            # Position filled
    expired = "expired"          # Past closing date


class EmploymentType(str, enum.Enum):
    """Employment type"""
    full_time = "full_time"
    part_time = "part_time"
    contract = "contract"
    temporary = "temporary"
    internship = "internship"
    freelance = "freelance"


class ExperienceLevel(str, enum.Enum):
    """Experience level required"""
    entry_level = "entry_level"        # 0-2 years
    mid_level = "mid_level"            # 3-5 years
    senior_level = "senior_level"      # 6-10 years
    executive = "executive"            # 10+ years


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
    category = Column(String(50), nullable=False, index=True, default="other")
    description = Column(Text, nullable=False)
    requirements = Column(ARRAY(String), default=list)
    responsibilities = Column(ARRAY(String), default=list)
    qualifications = Column(ARRAY(String), default=list)
    benefits = Column(ARRAY(String), default=list)
    positions_available = Column(Integer, default=1)
    
    # Skills & Experience
    skills = Column(ARRAY(String), default=list)  # ["Python", "AWS", "Docker"]
    years_of_experience_min = Column(Integer, default=0)
    years_of_experience_max = Column(Integer)
    experience_level = Column(Enum(ExperienceLevel), nullable=False, default=ExperienceLevel.entry_level)
    
    # Education
    education_level = Column(String(100))  # "Matric", "BCom", "BSc Computer Science"
    certifications = Column(ARRAY(String), default=list)  # ["AWS Certified", "PMP"]
    
    # Location & Work Arrangement
    location = Column(String(255), nullable=False)
    city = Column(String(100))
    province = Column(String(100))
    country = Column(String(100))
    is_remote = Column(Boolean, default=False)
    remote_type = Column(String(50))  # "fully_remote", "hybrid", "office_only"
    
    # Employment Details
    employment_type = Column(Enum(EmploymentType), nullable=False, default=EmploymentType.full_time)
    
    # Salary
    salary_min = Column(Integer)
    salary_max = Column(Integer)
    salary_currency = Column(String(10))
    salary_period = Column(String(20), default="monthly")  # "monthly", "annually", "hourly"
    show_salary = Column(Boolean, default=False)
    
    # Dates
    posting_date = Column(DateTime(timezone=True), default=datetime.utcnow)
    closing_date = Column(DateTime(timezone=True))
    start_date = Column(DateTime(timezone=True))  # Expected start date
    
    # Status
    status = Column(Enum(JobStatus), nullable=False, default=JobStatus.active, index=True)
    is_urgent = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)
    
    # Multi-board posting
    post_to_pnet = Column(Boolean, default=False)
    post_to_careerjunction = Column(Boolean, default=False)
    post_to_linkedin = Column(Boolean, default=False)
    post_to_indeed = Column(Boolean, default=False)
    pnet_job_id = Column(String(100))
    careerjunction_job_id = Column(String(100))
    linkedin_job_id = Column(String(100))
    indeed_job_id = Column(String(100))
    
    # Template flag — saved job templates reused as new postings
    is_template = Column(Boolean, default=False, nullable=False, index=True)

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
    creator = relationship("User", foreign_keys="Job.created_by")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Job {self.reference}: {self.title}>"

class JobView(Base):
    """Analytics model for tracking job impressions and views"""
    __tablename__ = "job_views"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    viewer_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    viewed_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    
    job = relationship("Job")
