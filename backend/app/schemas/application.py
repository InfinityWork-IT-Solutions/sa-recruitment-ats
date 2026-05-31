"""
Application Pydantic schemas
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID

from app.models.application import ApplicationStatus, ApplicationSource, RejectionReason


# Base schema
class ApplicationBase(BaseModel):
    """Base application schema"""
    cover_letter: Optional[str] = Field(None, description="Cover letter text")


# Create schema
class ApplicationCreate(ApplicationBase):
    """Schema for creating an application"""
    job_id: UUID = Field(..., description="Job ID to apply to")
    candidate_id: UUID = Field(..., description="Candidate ID")
    source: Optional[str] = Field("direct")
    external_application_id: Optional[str] = Field(None, description="ID from external platform")
    source_url: Optional[str] = Field(None, description="URL candidate applied from")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "job_id": "123e4567-e89b-12d3-a456-426614174000",
            "candidate_id": "123e4567-e89b-12d3-a456-426614174001",
            "cover_letter": "I am excited to apply for this position...",
            "source": "direct_apply"
        }
    })


# Update schema
class ApplicationUpdate(BaseModel):
    """Schema for updating application"""
    status: Optional[ApplicationStatus] = None
    cover_letter: Optional[str] = None
    screening_score: Optional[int] = Field(None, ge=0, le=100)
    screening_notes: Optional[str] = None
    interview_feedback: Optional[str] = None
    interview_rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None
    assigned_to: Optional[UUID] = None


# Response schema
class ApplicationResponse(ApplicationBase):
    """Schema for application in responses"""
    id: UUID
    agency_id: UUID
    job_id: UUID
    candidate_id: UUID
    client_company_id: Optional[UUID] = None
    assigned_to: Optional[UUID] = None
    
    status: ApplicationStatus
    source: Optional[str] = "direct"
    external_application_id: Optional[str] = None
    source_url: Optional[str] = None
    
    # Screening
    screening_score: Optional[int] = None
    screening_notes: Optional[str] = None
    screening_passed: Optional[bool] = None
    screened_at: Optional[datetime] = None
    screened_by: Optional[UUID] = None
    
    # Interview
    interview_scheduled_at: Optional[datetime] = None
    interview_completed_at: Optional[datetime] = None
    interview_feedback: Optional[str] = None
    interview_rating: Optional[int] = None
    
    # Offer
    offer_amount: Optional[int] = None
    offer_currency: str
    offer_sent_at: Optional[datetime] = None
    offer_accepted_at: Optional[datetime] = None
    offer_rejected_at: Optional[datetime] = None
    start_date: Optional[datetime] = None
    
    # Rejection
    rejected_at: Optional[datetime] = None
    rejection_reason: Optional[RejectionReason] = None
    rejection_notes: Optional[str] = None
    rejected_by: Optional[UUID] = None
    
    # Withdrawal
    withdrawn_at: Optional[datetime] = None
    withdrawal_reason: Optional[str] = None
    
    # Match
    match_score: Optional[int] = None
    match_explanation: Optional[Dict[str, Any]] = None
    
    # History
    status_history: Optional[List[Dict[str, Any]]] = None
    communication_log: Optional[List[Dict[str, Any]]] = None
    
    notes: Optional[str] = None
    
    # Joined fields
    candidate_name: Optional[str] = None
    job_title: Optional[str] = None
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Brief schema
class ApplicationBrief(BaseModel):
    """Brief application information for listings"""
    id: UUID
    job_id: UUID
    candidate_id: UUID
    status: ApplicationStatus
    match_score: Optional[int] = None
    created_at: datetime
    
    # Joined fields
    candidate_name: Optional[str] = None
    candidate_photo: Optional[str] = None
    job_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# Status update schema
class ApplicationStatusUpdate(BaseModel):
    """Schema for updating application status"""
    status: ApplicationStatus = Field(..., description="New status")
    notes: Optional[str] = Field(None, description="Notes about status change")


# Screening schema
class ApplicationScreening(BaseModel):
    """Schema for screening an application"""
    passed: bool = Field(..., description="Did candidate pass screening?")
    score: int = Field(..., ge=0, le=100, description="Screening score (0-100)")
    notes: Optional[str] = Field(None, description="Screening notes")


# Interview schema
class InterviewSchedule(BaseModel):
    """Schema for scheduling interview"""
    interview_time: datetime = Field(..., description="Interview date/time")
    notes: Optional[str] = Field(None, description="Interview notes")


class InterviewComplete(BaseModel):
    """Schema for completing interview"""
    rating: int = Field(..., ge=1, le=5, description="Interview rating (1-5 stars)")
    feedback: str = Field(..., description="Interview feedback")


# Offer schema
class OfferMake(BaseModel):
    """Schema for making an offer"""
    amount: int = Field(..., ge=0, description="Offer amount in ZAR")
    start_date: Optional[datetime] = Field(None, description="Expected start date")
    notes: Optional[str] = Field(None, description="Offer notes")


class OfferRespond(BaseModel):
    """Schema for candidate responding to offer"""
    accepted: bool = Field(..., description="Offer accepted?")
    start_date: Optional[datetime] = Field(None, description="Start date if accepted")
    notes: Optional[str] = Field(None, description="Response notes")


# Rejection schema
class ApplicationReject(BaseModel):
    """Schema for rejecting an application"""
    reason: RejectionReason = Field(..., description="Rejection reason")
    notes: Optional[str] = Field(None, description="Additional notes")


# Withdrawal schema
class ApplicationWithdraw(BaseModel):
    """Schema for candidate withdrawal"""
    reason: str = Field(..., description="Withdrawal reason")


# Filter schema
class ApplicationFilter(BaseModel):
    """Schema for application filtering"""
    job_id: Optional[UUID] = None
    candidate_id: Optional[UUID] = None
    status: Optional[ApplicationStatus] = None
    statuses: Optional[List[ApplicationStatus]] = None
    assigned_to: Optional[UUID] = None
    
    # Date filters
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    
    # Pagination
    skip: int = Field(0, ge=0)
    limit: int = Field(20, ge=1, le=100)
    
    # Sorting
    sort_by: str = Field("created_at")
    sort_order: str = Field("desc")


# Pipeline/Kanban view
class ApplicationPipelineStage(BaseModel):
    """Application counts by status for Kanban board"""
    status: ApplicationStatus
    count: int
    applications: List[ApplicationBrief]


class ApplicationPipeline(BaseModel):
    """Full pipeline view for Kanban board"""
    job_id: UUID
    job_title: str
    stages: List[ApplicationPipelineStage]
    total_applications: int


# Statistics schema
class ApplicationStatistics(BaseModel):
    """Application statistics"""
    total_applications: int
    by_status: Dict[str, int]
    avg_time_to_hire_days: Optional[float] = None
    conversion_rates: Dict[str, float]  # % moving from one stage to next
