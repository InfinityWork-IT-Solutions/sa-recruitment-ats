"""
RecruitPro SA - Database Models
SQLAlchemy ORM models for all entities
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid
import enum

Base = declarative_base()

# Enums
class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    AGENCY_ADMIN = "agency_admin"
    RECRUITER = "recruiter"
    HIRING_MANAGER = "hiring_manager"

class JobStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"
    FILLED = "filled"
    EXPIRED = "expired"

class EmploymentType(str, enum.Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    TEMPORARY = "temporary"
    INTERNSHIP = "internship"
    FREELANCE = "freelance"

class ApplicationStatus(str, enum.Enum):
    APPLIED = "applied"
    SCREENING = "screening"
    SHORTLISTED = "shortlisted"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEWED = "interviewed"
    OFFER_PENDING = "offer_pending"
    OFFER_MADE = "offer_made"
    OFFER_ACCEPTED = "offer_accepted"
    HIRED = "hired"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"

class CandidateStatus(str, enum.Enum):
    ACTIVE = "active"
    PASSIVE = "passive"
    PLACED = "placed"
    INACTIVE = "inactive"


# Models
class Agency(Base):
    """Recruitment agency/company"""
    __tablename__ = "agencies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(50))
    website = Column(String(255))
    address = Column(Text)
    city = Column(String(100))
    province = Column(String(100))
    country = Column(String(100), default="South Africa")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="agency")
    jobs = relationship("Job", back_populates="agency")
    candidates = relationship("Candidate", back_populates="agency")
    client_companies = relationship("ClientCompany", back_populates="agency")


class User(Base):
    """Agency users (admins, recruiters, hiring managers)"""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id"), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.RECRUITER)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    agency = relationship("Agency", back_populates="users")
    jobs_created = relationship("Job", back_populates="created_by_user")
    applications_handled = relationship("Application", back_populates="assigned_to_user")
    activities = relationship("Activity", back_populates="user")


class ClientCompany(Base):
    """Client companies that have job openings"""
    __tablename__ = "client_companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id"), nullable=False)
    name = Column(String(255), nullable=False)
    industry = Column(String(100))
    website = Column(String(255))
    contact_person = Column(String(255))
    contact_email = Column(String(255))
    contact_phone = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    agency = relationship("Agency", back_populates="client_companies")
    jobs = relationship("Job", back_populates="client_company")


class Job(Base):
    """Job postings"""
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id"), nullable=False)
    client_company_id = Column(UUID(as_uuid=True), ForeignKey("client_companies.id"))
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Basic info
    reference = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(Text)
    responsibilities = Column(Text)
    benefits = Column(Text)
    
    # Job details
    employment_type = Column(SQLEnum(EmploymentType), nullable=False)
    experience_level = Column(String(50))
    skills = Column(ARRAY(String))
    
    # Location
    location_city = Column(String(100), nullable=False)
    location_province = Column(String(100), nullable=False)
    location_country = Column(String(100), default="South Africa")
    is_remote = Column(Boolean, default=False)
    
    # Salary
    salary_min = Column(Float)
    salary_max = Column(Float)
    salary_currency = Column(String(10), default="ZAR")
    
    # Status
    status = Column(SQLEnum(JobStatus), nullable=False, default=JobStatus.DRAFT)
    applications_count = Column(Integer, default=0)
    views_count = Column(Integer, default=0)
    
    # Dates
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    agency = relationship("Agency", back_populates="jobs")
    client_company = relationship("ClientCompany", back_populates="jobs")
    created_by_user = relationship("User", back_populates="jobs_created")
    applications = relationship("Application", back_populates="job")


class Candidate(Base):
    """Job candidates"""
    __tablename__ = "candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id"), nullable=False)
    
    # Personal info
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50))
    
    # Location
    city = Column(String(100))
    province = Column(String(100))
    country = Column(String(100), default="South Africa")
    
    # Professional info
    current_job_title = Column(String(255))
    current_company = Column(String(255))
    years_of_experience = Column(Integer, default=0)
    education_level = Column(String(100))
    skills = Column(ARRAY(String))
    
    # Resume
    resume_url = Column(String(500))
    resume_filename = Column(String(255))
    resume_parse_data = Column(JSON)
    
    # Salary expectations
    expected_salary_min = Column(Float)
    expected_salary_max = Column(Float)
    salary_currency = Column(String(10), default="ZAR")
    
    # Additional
    linkedin_url = Column(String(500))
    source = Column(String(100))
    status = Column(SQLEnum(CandidateStatus), default=CandidateStatus.ACTIVE)
    
    # POPIA Compliance
    consent_to_contact = Column(Boolean, default=False)
    consent_date = Column(DateTime)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    agency = relationship("Agency", back_populates="candidates")
    applications = relationship("Application", back_populates="candidate")


class Application(Base):
    """Job applications"""
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id"), nullable=False)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Status and tracking
    status = Column(SQLEnum(ApplicationStatus), nullable=False, default=ApplicationStatus.APPLIED)
    source = Column(String(100), default="direct_application")
    match_score = Column(Float)
    
    # Interview details
    interview_date = Column(DateTime)
    interview_notes = Column(Text)
    interview_rating = Column(Integer)
    
    # Offer details
    offer_amount = Column(Float)
    offer_currency = Column(String(10), default="ZAR")
    offer_date = Column(DateTime)
    offer_expiry_date = Column(DateTime)
    
    # Rejection
    rejection_reason = Column(Text)
    rejection_date = Column(DateTime)
    
    # Metadata
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    job = relationship("Job", back_populates="applications")
    candidate = relationship("Candidate", back_populates="applications")
    assigned_to_user = relationship("User", back_populates="applications_handled")


class Activity(Base):
    """Activity/audit log"""
    __tablename__ = "activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    user_name = Column(String(255), nullable=False)
    
    action = Column(String(50), nullable=False)  # created, updated, deleted, etc.
    entity_type = Column(String(50), nullable=False)  # job, candidate, application, etc.
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    entity_name = Column(String(255))
    
    metadata = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="activities")
