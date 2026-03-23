"""
Authentication Pydantic schemas
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from uuid import UUID

from app.schemas.agency import AgencyCreate
from app.schemas.user import UserCreate, UserResponse
from app.schemas.candidate import CandidateCreate
from app.schemas.client_company import ClientCompanyCreate


# Login schemas
class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., description="User password")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "email": "mpumelelo@capetownrecruiting.co.za",
            "password": "SecurePass123"
        }
    })


class TokenResponse(BaseModel):
    """Token response schema"""
    access_token: str = Field(..., description="JWT access token (1 hour)")
    refresh_token: str = Field(..., description="JWT refresh token (7 days)")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(3600, description="Access token expiry in seconds")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "bearer",
            "expires_in": 3600
        }
    })


class LoginResponse(BaseModel):
    """Login response with user and tokens"""
    user: UserResponse
    tokens: TokenResponse
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "user": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "mpumelelo@capetownrecruiting.co.za",
                "first_name": "Mpumelelo",
                "last_name": "Magagula",
                "role": "agency_admin",
                "is_active": True
            },
            "tokens": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 3600
            }
        }
    })


# Registration schemas
class RegisterRequest(BaseModel):
    """Registration request with agency and user"""
    agency: AgencyCreate = Field(..., description="Agency details")
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "agency": {
                "name": "Cape Town Recruiting",
                "email": "contact@capetownrecruiting.co.za",
                "phone": "+27 21 123 4567",
                "subscription_tier": "standard",
                "city": "Cape Town",
                "province": "Western Cape"
            },
            "user": {
                "email": "mpumelelo@capetownrecruiting.co.za",
                "first_name": "Mpumelelo",
                "last_name": "Magagula",
                "phone": "+27 82 123 4567",
                "password": "SecurePass123",
                "role": "agency_admin"
            }
        }
    })


class CandidateRegisterRequest(BaseModel):
    """Candidate registration request"""
    user: UserCreate
    candidate: CandidateCreate


class CompanyRegisterRequest(BaseModel):
    """Company registration request"""
    user: UserCreate
    company: ClientCompanyCreate


class RegisterResponse(BaseModel):
    """Registration response"""
    message: str = Field(..., description="Success message")
    agency_id: Optional[UUID] = Field(None, description="Created agency ID")
    user_id: UUID = Field(..., description="Created user ID")
    tokens: TokenResponse = Field(..., description="Authentication tokens")


# Refresh token schemas
class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str = Field(..., description="Refresh token")


# Password reset schemas
class PasswordResetRequest(BaseModel):
    """Password reset request"""
    email: EmailStr = Field(..., description="User email")


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation"""
    token: str = Field(..., description="Reset token from email")
    new_password: str = Field(..., min_length=8, description="New password")


# Email verification
class EmailVerifyRequest(BaseModel):
    """Email verification request"""
    token: str = Field(..., description="Verification token from email")


# Generic message response
class MessageResponse(BaseModel):
    """Generic message response"""
    message: str = Field(..., description="Response message")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "message": "Email verification sent successfully"
        }
    })
