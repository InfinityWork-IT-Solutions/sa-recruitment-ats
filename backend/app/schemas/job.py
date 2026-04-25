"""
Job Pydantic schemas for API requests/responses
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict
from uuid import UUID

from app.models.job import JobStatus, EmploymentType, ExperienceLevel


# Base schema with common fields
class JobBase(BaseModel):
    """Base job schema"""
    title: str = Field(..., min_length=5, max_length=255, description="Job title")
    category: str = Field("other", description="Job category (e.g. it, health, finance)")
    description: str = Field(..., min_length=50, description="Job description")
    requirements: List[str] = Field(default_factory=list, description="Job requirements")
    responsibilities: List[str] = Field(default_factory=list, description="Job responsibilities")
    qualifications: List[str] = Field(default_factory=list, description="Job qualifications")
    benefits: List[str] = Field(default_factory=list, description="Benefits offered")
    positions_available: int = Field(1, ge=1, description="Number of positions available")
    
    # Skills & Experience
    skills: List[str] = Field(default_factory=list, description="Required skills")
    years_of_experience_min: int = Field(0, ge=0, le=50, description="Minimum years of experience")
    years_of_experience_max: Optional[int] = Field(None, ge=0, le=50, description="Maximum years of experience")
    experience_level: Optional[ExperienceLevel] = None
    
    # Education
    education_level: Optional[str] = Field(None, max_length=100, description="Required education level")
    certifications: List[str] = Field(default_factory=list, description="Required certifications")
    
    # Location
    location: str = Field(..., max_length=255, description="Job location")
    city: Optional[str] = Field(None, max_length=100)
    province: Optional[str] = Field(None, max_length=100)
    is_remote: bool = Field(False, description="Is this a remote position?")
    remote_type: Optional[str] = Field(None, description="Remote work type")
    
    # Employment
    employment_type: EmploymentType = Field(EmploymentType.full_time, description="Type of employment")
    
    # Salary
    salary_min: Optional[int] = Field(None, ge=0, description="Minimum salary in ZAR")
    salary_max: Optional[int] = Field(None, ge=0, description="Maximum salary in ZAR")
    show_salary: bool = Field(False, description="Show salary to applicants?")
    
    # Dates
    closing_date: Optional[datetime] = Field(None, description="Application closing date")
    start_date: Optional[datetime] = Field(None, description="Expected start date")
    
    # Flags
    is_urgent: bool = Field(False, description="Mark as urgent?")
    is_featured: bool = Field(False, description="Featured job?")
    
    # Multi-board posting
    post_to_pnet: bool = Field(False, description="Post to PNet?")
    post_to_careerjunction: bool = Field(False, description="Post to CareerJunction?")
    post_to_linkedin: bool = Field(False, description="Post to LinkedIn?")
    post_to_indeed: bool = Field(False, description="Post to Indeed?")
    
    @field_validator('salary_max')
    @classmethod
    def validate_salary_range(cls, v, info):
        """Validate salary max is greater than min"""
        if v is not None and info.data.get('salary_min') is not None:
            if v < info.data['salary_min']:
                raise ValueError('Maximum salary must be greater than minimum salary')
        return v


# Schema for creating a job
class JobCreate(JobBase):
    """Schema for creating a new job"""
    client_company_id: Optional[UUID] = Field(None, description="Client company ID")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "title": "Senior DevOps Engineer",
            "description": "We are looking for an experienced DevOps engineer...",
            "requirements": "- 5+ years experience\n- AWS expertise\n- Terraform experience",
            "skills": ["AWS", "Terraform", "Docker", "Kubernetes", "Python", "CI/CD"],
            "years_of_experience_min": 5,
            "years_of_experience_max": 10,
            "experience_level": "senior_level",
            "education_level": "BSc Computer Science or equivalent",
            "location": "Cape Town, Western Cape",
            "city": "Cape Town",
            "province": "Western Cape",
            "is_remote": False,
            "employment_type": "full_time",
            "salary_min": 65000,
            "salary_max": 85000,
            "show_salary": True,
            "is_urgent": False,
            "post_to_pnet": True,
            "post_to_careerjunction": True
        }
    })


# Schema for updating a job
class JobUpdate(BaseModel):
    """Schema for updating job details"""
    title: Optional[str] = Field(None, min_length=5, max_length=255)
    category: Optional[str] = None
    description: Optional[str] = Field(None, min_length=50)
    requirements: Optional[List[str]] = None
    responsibilities: Optional[List[str]] = None
    qualifications: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    positions_available: Optional[int] = Field(None, ge=1)
    
    skills: Optional[List[str]] = None
    years_of_experience_min: Optional[int] = Field(None, ge=0, le=50)
    years_of_experience_max: Optional[int] = Field(None, ge=0, le=50)
    experience_level: Optional[ExperienceLevel] = None
    
    education_level: Optional[str] = Field(None, max_length=100)
    certifications: Optional[List[str]] = None
    
    location: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    province: Optional[str] = Field(None, max_length=100)
    is_remote: Optional[bool] = None
    remote_type: Optional[str] = None
    
    employment_type: Optional[EmploymentType] = None
    
    salary_min: Optional[int] = Field(None, ge=0)
    salary_max: Optional[int] = Field(None, ge=0)
    show_salary: Optional[bool] = None
    
    closing_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    
    is_urgent: Optional[bool] = None
    is_featured: Optional[bool] = None
    
    client_company_id: Optional[UUID] = None


# Schema for job response
class JobResponse(JobBase):
    """Schema for job in responses"""
    id: UUID
    agency_id: UUID
    client_company_id: Optional[UUID] = None
    created_by: Optional[UUID] = None
    
    reference: str
    status: JobStatus
    
    # Computed fields
    country: str
    salary_currency: str
    salary_period: str
    
    # Multi-board IDs
    pnet_job_id: Optional[str] = None
    careerjunction_job_id: Optional[str] = None
    linkedin_job_id: Optional[str] = None
    
    # Metrics
    views_count: int
    applications_count: int
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    posting_date: datetime
    
    # Meta
    platform_results: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(from_attributes=True)


# Schema for brief job info (used in lists)
class JobBrief(BaseModel):
    """Brief job information for listings"""
    id: UUID
    reference: str
    title: str
    location: str
    employment_type: EmploymentType
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    show_salary: bool
    status: JobStatus
    is_urgent: bool
    is_remote: bool
    applications_count: int
    created_at: datetime
    closing_date: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# Schema for job search/filter
class JobFilter(BaseModel):
    """Schema for job search and filtering"""
    search: Optional[str] = Field(None, description="Search in title, description")
    status: Optional[JobStatus] = None
    employment_type: Optional[EmploymentType] = None
    experience_level: Optional[ExperienceLevel] = None
    is_remote: Optional[bool] = None
    city: Optional[str] = None
    province: Optional[str] = None
    skills: Optional[List[str]] = Field(None, description="Filter by skills")
    salary_min: Optional[int] = Field(None, ge=0, description="Minimum salary")
    salary_max: Optional[int] = Field(None, ge=0, description="Maximum salary")
    client_company_id: Optional[UUID] = None
    is_urgent: Optional[bool] = None
    
    # Pagination
    skip: int = Field(0, ge=0, description="Number of records to skip")
    limit: int = Field(20, ge=1, le=100, description="Number of records to return")
    
    # Sorting
    sort_by: str = Field("created_at", description="Field to sort by")
    sort_order: str = Field("desc", description="Sort order: asc or desc")


# Schema for job status update
class JobStatusUpdate(BaseModel):
    """Schema for updating job status"""
    status: JobStatus = Field(..., description="New job status")
    reason: Optional[str] = Field(None, description="Reason for status change")


# Schema for job statistics
class JobStatistics(BaseModel):
    """Job statistics"""
    total_jobs: int
    active_jobs: int
    draft_jobs: int
    closed_jobs: int
    filled_jobs: int
    total_applications: int
    avg_applications_per_job: float


# Schema for public job listings
class PublicJobBrief(BaseModel):
    """Public job information for anonymous browsing"""
    id: UUID
    title: str
    company_name: Optional[str] = "Confidential"
    location: str
    salary_range: Optional[str] = None
    job_type: str
    category: str
    description: str  # Short preview
    closing_date: datetime
    posted_date: datetime
    
    model_config = ConfigDict(from_attributes=True)
    
    @classmethod
    def from_orm_custom(cls, job: Any) -> "PublicJobBrief":
        salary_range = None
        if job.show_salary and job.salary_min:
            if job.salary_max:
                salary_range = f"R{job.salary_min:,} - R{job.salary_max:,}"
            else:
                salary_range = f"R{job.salary_min:,}+"
        
        return cls(
            id=job.id,
            title=job.title,
            company_name=job.client_company.name if job.client_company else "RecruitPro Client",
            location=job.location,
            salary_range=salary_range,
            job_type=job.employment_type.value if hasattr(job.employment_type, 'value') else str(job.employment_type),
            category=job.category or "other",
            description=job.description[:200] + "..." if len(job.description) > 200 else job.description,
            closing_date=job.closing_date or (job.published_at or datetime.utcnow()),
            posted_date=job.published_at or job.created_at
        )

# Schema for public job detail
class PublicJobDetail(PublicJobBrief):
    """Full public job details"""
    responsibilities: List[str]
    requirements: List[str]
    qualifications: List[str]
    benefits: List[str]
    experience_level: str
    positions_available: int
    
    @classmethod
    def from_orm_custom(cls, job: Any) -> "PublicJobDetail":
        base = PublicJobBrief.from_orm_custom(job)
        return cls(
            **base.model_dump(),
            responsibilities=job.responsibilities or [],
            requirements=job.requirements or [],
            qualifications=job.qualifications or [],
            benefits=job.benefits or [],
            experience_level=job.experience_level.value if hasattr(job.experience_level, 'value') else str(job.experience_level),
            positions_available=job.positions_available or 1
        )
