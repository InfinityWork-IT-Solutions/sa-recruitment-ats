"""
Agency Pydantic schemas for API requests/responses
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from uuid import UUID

from app.models.agency import SubscriptionTier


# Base schema with common fields
class AgencyBase(BaseModel):
    """Base agency schema"""
    name: str = Field(..., min_length=2, max_length=255, description="Agency name")
    email: EmailStr = Field(..., description="Primary email address")
    phone: Optional[str] = Field(None, max_length=50)
    website: Optional[str] = Field(None, max_length=255)


# Schema for creating an agency (registration)
class AgencyCreate(AgencyBase):
    """Schema for creating a new agency"""
    subscription_tier: SubscriptionTier = Field(SubscriptionTier.standard, description="Subscription tier")
    
    # Optional company details
    registration_number: Optional[str] = Field(None, max_length=100)
    vat_number: Optional[str] = Field(None, max_length=100)
    
    # Optional address
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    province: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "Cape Town Recruiting",
            "email": "contact@capetownrecruiting.co.za",
            "phone": "+27 21 123 4567",
            "website": "https://capetownrecruiting.co.za",
            "subscription_tier": "standard",
            "city": "Cape Town",
            "province": "Western Cape"
        }
    })


# Schema for updating agency
class AgencyUpdate(BaseModel):
    """Schema for updating agency details"""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    website: Optional[str] = Field(None, max_length=255)
    
    registration_number: Optional[str] = Field(None, max_length=100)
    vat_number: Optional[str] = Field(None, max_length=100)
    
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    province: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    
    billing_email: Optional[EmailStr] = None


# Schema for agency response
class AgencyResponse(AgencyBase):
    """Schema for agency in responses"""
    id: UUID
    registration_number: Optional[str] = None
    vat_number: Optional[str] = None
    
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None
    country: str
    
    subscription_tier: SubscriptionTier
    max_users: int
    
    is_active: bool
    is_trial: bool
    trial_ends_at: Optional[datetime] = None
    subscription_ends_at: Optional[datetime] = None
    
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Schema for brief agency info (used in other responses)
class AgencyBrief(BaseModel):
    """Brief agency information"""
    id: UUID
    name: str
    subscription_tier: SubscriptionTier
    
    model_config = ConfigDict(from_attributes=True)
