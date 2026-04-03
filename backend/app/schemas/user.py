"""
User Pydantic schemas for API requests/responses
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from uuid import UUID

from app.models.user import UserRole
from app.schemas.agency import AgencyBrief


# Base schema with common fields
class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr = Field(..., description="User email address")
    first_name: str = Field(..., min_length=1, max_length=100, description="First name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Last name")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    avatar_url: Optional[str] = Field(None, max_length=255, description="Profile picture URL")


# Schema for user registration
class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=8, max_length=100, description="Password (min 8 characters)")
    role: UserRole = Field(UserRole.recruiter, description="User role")
    agency_id: Optional[UUID] = Field(None, description="Agency ID (optional for candidates)")
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        
        has_upper = any(c.isupper() for c in v)
        has_lower = any(c.islower() for c in v)
        has_digit = any(c.isdigit() for c in v)
        
        if not (has_upper and has_lower and has_digit):
            raise ValueError('Password must contain uppercase, lowercase, and number')
        
        return v
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "email": "mpumelelo@capetownrecruiting.co.za",
            "first_name": "Mpumelelo",
            "last_name": "Magagula",
            "phone": "+27 82 123 4567",
            "password": "SecurePass123",
            "role": "agency_admin"
        }
    })


# Schema for updating user
class UserUpdate(BaseModel):
    """Schema for updating user details"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    avatar_url: Optional[str] = Field(None, max_length=255)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


# Schema for changing password
class PasswordChange(BaseModel):
    """Schema for password change"""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        
        has_upper = any(c.isupper() for c in v)
        has_lower = any(c.islower() for c in v)
        has_digit = any(c.isdigit() for c in v)
        
        if not (has_upper and has_lower and has_digit):
            raise ValueError('Password must contain uppercase, lowercase, and number')
        
        return v


# Schema for user response
class UserResponse(UserBase):
    """Schema for user in responses"""
    id: UUID
    agency_id: Optional[UUID] = None
    role: UserRole
    is_active: bool
    is_verified: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Include agency info
    agency: Optional[AgencyBrief] = None
    
    @property
    def company_id(self) -> Optional[UUID]:
        """Helper to get company ID for client users"""
        return self.client_company.id if hasattr(self, 'client_company') and self.client_company else None
    
    @property
    def agency_name(self) -> Optional[str]:
        """Helper to get agency name"""
        return self.agency.name if hasattr(self, 'agency') and self.agency else None

    @property
    def managed_clients_count(self) -> int:
        """Helper to get number of clients for this agency"""
        return len(self.agency.client_companies) if hasattr(self, 'agency') and self.agency and hasattr(self.agency, 'client_companies') else 0
    
    model_config = ConfigDict(from_attributes=True)


# Schema for user with full name
class UserBrief(BaseModel):
    """Brief user information"""
    id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole
    
    model_config = ConfigDict(from_attributes=True)
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
