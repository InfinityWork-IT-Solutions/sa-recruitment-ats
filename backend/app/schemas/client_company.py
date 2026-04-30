"""
Client Company Pydantic schemas
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from uuid import UUID


# Base schema
class ClientCompanyBase(BaseModel):
    """Base client company schema"""
    name: str = Field(..., min_length=2, max_length=255, description="Company name")
    logo_url: Optional[str] = Field(None, max_length=500, description="Company logo URL")
    industry: Optional[str] = Field(None, max_length=100, description="Industry")
    company_size: Optional[str] = Field(None, description="Company size")
    website: Optional[str] = Field(None, max_length=255, description="Company website")
    description: Optional[str] = Field(None, description="Company description")
    
    # Contact
    contact_name: Optional[str] = Field(None, max_length=255)
    contact_person: Optional[str] = Field(None, alias="contact_name")
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=50)
    contact_position: Optional[str] = Field(None, max_length=100)
    
    # Address
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    province: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)


# Create schema
class ClientCompanyCreate(ClientCompanyBase):
    """Schema for creating a client company"""
    registration_number: Optional[str] = Field(None, max_length=100)
    vat_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "TechCorp SA",
            "industry": "Information Technology",
            "company_size": "201-500",
            "website": "https://techcorp.co.za",
            "contact_name": "Jane Smith",
            "contact_email": "jane@techcorp.co.za",
            "contact_phone": "+27 21 555 1234",
            "city": "Cape Town",
            "province": "Western Cape"
        }
    })


# Update schema
class ClientCompanyUpdate(ClientCompanyBase):
    """Schema for updating client company"""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    is_active: Optional[bool] = None
    notes: Optional[str] = None


# Response schema
class ClientCompanyResponse(ClientCompanyBase):
    """Schema for client company in responses"""
    id: UUID
    agency_id: UUID
    user_id: Optional[UUID] = None
    
    registration_number: Optional[str] = None
    vat_number: Optional[str] = None
    
    is_active: bool
    notes: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# Brief schema
class ClientCompanyBrief(BaseModel):
    """Brief client company information for listings"""
    id: UUID
    name: str
    industry: Optional[str] = None
    website: Optional[str] = None
    contact_person: Optional[str] = Field(None, alias="contact_name")
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    country: Optional[str] = None
    jobs_count: int = Field(0, alias="total_jobs")
    active_jobs: int = 0
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
