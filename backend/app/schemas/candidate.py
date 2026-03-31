"""
Candidate Pydantic schemas
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from uuid import UUID

from app.models.candidate import CandidateStatus, CandidateSource


# Base schema
class CandidateBase(BaseModel):
    """Base candidate schema"""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr = Field(..., description="Email address")
    phone: Optional[str] = Field(None, max_length=50)
    alternative_phone: Optional[str] = Field(None, max_length=50)
    
    # Location
    city: Optional[str] = Field(None, max_length=100)
    province: Optional[str] = Field(None, max_length=100)
    is_willing_to_relocate: bool = Field(False)
    
    # Professional
    current_job_title: Optional[str] = Field(None, max_length=255)
    current_company: Optional[str] = Field(None, max_length=255)
    years_of_experience: int = Field(0, ge=0, le=50)
    skills: List[str] = Field(default_factory=list)
    
    # Education
    education_level: Optional[str] = Field(None, max_length=100)
    certifications: List[str] = Field(default_factory=list)
    
    # Employment preferences
    employment_type_preference: Optional[str] = None
    notice_period_days: Optional[int] = Field(None, ge=0, le=365)
    
    # Salary
    current_salary: Optional[int] = Field(None, ge=0)
    expected_salary_min: Optional[int] = Field(None, ge=0)
    expected_salary_max: Optional[int] = Field(None, ge=0)
    
    # Social
    linkedin_url: Optional[str] = Field(None, max_length=255)
    portfolio_url: Optional[str] = Field(None, max_length=255)
    github_url: Optional[str] = Field(None, max_length=255)
    
    # Status
    source: CandidateSource = Field(CandidateSource.direct_application)
    source_details: Optional[str] = Field(None, max_length=255)
    
    # Availability
    is_immediately_available: bool = Field(False)
    available_from: Optional[datetime] = None
    
    # Notes
    notes: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


# Create schema
class CandidateCreate(CandidateBase):
    """Schema for creating a candidate"""
    # POPIA consent
    consent_to_contact: bool = Field(..., description="Must consent to contact")
    
    # Optional education details
    education_details: Optional[List[Dict[str, Any]]] = Field(None, description="Education history")
    
    @field_validator('consent_to_contact')
    @classmethod
    def validate_consent(cls, v):
        if not v:
            raise ValueError('Consent to contact is required (POPIA compliance)')
        return v
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "first_name": "Thabo",
            "last_name": "Molefe",
            "email": "thabo.molefe@example.com",
            "phone": "+27 82 555 1234",
            "city": "Johannesburg",
            "province": "Gauteng",
            "current_job_title": "Senior Python Developer",
            "current_company": "TechCorp",
            "years_of_experience": 7,
            "skills": ["Python", "Django", "PostgreSQL", "Docker", "AWS"],
            "education_level": "BSc Computer Science",
            "expected_salary_min": 60000,
            "expected_salary_max": 80000,
            "linkedin_url": "https://linkedin.com/in/thabomolefe",
            "source": "linkedin",
            "consent_to_contact": True
        }
    })


# Update schema
class CandidateUpdate(BaseModel):
    """Schema for updating candidate"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    alternative_phone: Optional[str] = Field(None, max_length=50)
    
    city: Optional[str] = Field(None, max_length=100)
    province: Optional[str] = Field(None, max_length=100)
    is_willing_to_relocate: Optional[bool] = None
    
    current_job_title: Optional[str] = Field(None, max_length=255)
    current_company: Optional[str] = Field(None, max_length=255)
    years_of_experience: Optional[int] = Field(None, ge=0, le=50)
    skills: Optional[List[str]] = None
    
    education_level: Optional[str] = Field(None, max_length=100)
    education_details: Optional[List[Dict[str, Any]]] = None
    certifications: Optional[List[str]] = None
    
    employment_type_preference: Optional[str] = None
    notice_period_days: Optional[int] = Field(None, ge=0, le=365)
    
    current_salary: Optional[int] = Field(None, ge=0)
    expected_salary_min: Optional[int] = Field(None, ge=0)
    expected_salary_max: Optional[int] = Field(None, ge=0)
    
    linkedin_url: Optional[str] = Field(None, max_length=255)
    portfolio_url: Optional[str] = Field(None, max_length=255)
    github_url: Optional[str] = Field(None, max_length=255)
    
    status: Optional[CandidateStatus] = None
    is_immediately_available: Optional[bool] = None
    available_from: Optional[datetime] = None
    
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


# Response schema
class CandidateResponse(CandidateBase):
    """Schema for candidate in responses"""
    id: UUID
    agency_id: UUID
    user_id: Optional[UUID] = None
    added_by: Optional[UUID] = None
    
    country: str
    salary_currency: str
    
    status: CandidateStatus
    education_details: Optional[List[Dict[str, Any]]] = None
    
    # Resume
    resume_filename: Optional[str] = None
    resume_url: Optional[str] = None
    
    # Parsed data
    resume_parsed_data: Optional[Dict[str, Any]] = None
    
    # POPIA
    consent_to_contact: bool
    consent_date: Optional[datetime] = None
    
    # Metrics
    applications_count: int
    interviews_count: int
    placements_count: int
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    last_contacted_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# Brief schema
class CandidateBrief(BaseModel):
    """Brief candidate information for listings"""
    id: UUID
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    current_job_title: Optional[str] = None
    city: Optional[str] = None
    years_of_experience: int
    skills: List[str]
    status: CandidateStatus
    applications_count: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Filter schema
class CandidateFilter(BaseModel):
    """Schema for candidate search and filtering"""
    search: Optional[str] = Field(None, description="Search in name, email, title")
    status: Optional[CandidateStatus] = None
    skills: Optional[List[str]] = Field(None, description="Filter by skills")
    city: Optional[str] = None
    province: Optional[str] = None
    years_of_experience_min: Optional[int] = Field(None, ge=0)
    years_of_experience_max: Optional[int] = Field(None, ge=0)
    expected_salary_min: Optional[int] = Field(None, ge=0)
    expected_salary_max: Optional[int] = Field(None, ge=0)
    is_willing_to_relocate: Optional[bool] = None
    is_immediately_available: Optional[bool] = None
    source: Optional[CandidateSource] = None
    tags: Optional[List[str]] = None
    
    # Pagination
    skip: int = Field(0, ge=0)
    limit: int = Field(20, ge=1, le=100)
    
    # Sorting
    sort_by: str = Field("created_at", description="Field to sort by")
    sort_order: str = Field("desc", description="asc or desc")


# Resume upload schema
class ResumeUploadResponse(BaseModel):
    """Response after resume upload"""
    filename: str
    url: str
    size: int
    parsed_data: Optional[Dict[str, Any]] = None


# Statistics schema
class CandidateStatistics(BaseModel):
    """Candidate statistics"""
    total_candidates: int
    active_candidates: int
    passive_candidates: int
    placed_candidates: int
    total_applications: int
    avg_applications_per_candidate: float
