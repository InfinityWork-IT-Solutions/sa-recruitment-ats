from typing import List, Dict, Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field

class ScreenApplicationRequest(BaseModel):
    application_id: UUID

class VideoScreeningCreateRequest(BaseModel):
    application_id: UUID
    candidate_id: UUID
    job_id: UUID

class InterviewScheduleRequest(BaseModel):
    application_id: UUID
    candidate_id: UUID
    job_id: UUID
    slot_id: UUID

class SourcingCampaignCreateRequest(BaseModel):
    job_id: UUID
    company_id: UUID
    name: str = Field(..., example="Python Developers Hunt - Q2")
    target_skills: List[str]
    experience_years_min: int
    experience_years_max: int
    locations: List[str]
    max_candidates: int = 100

class ScreeningResultResponse(BaseModel):
    overall_score: int
    decision: str
    ai_summary: str
    strengths: List[str]
    weaknesses: List[str]
    red_flags: List[str]

    class Config:
        from_attributes = True
