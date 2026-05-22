"""
User model for authentication and authorization
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Boolean, Column, DateTime, String, ForeignKey, Enum, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    """User roles for RBAC"""
    super_admin = "super_admin"      # Full system access
    agency_admin = "agency_admin"    # Agency-level admin
    recruiter = "recruiter"          # Can manage jobs, candidates, applications
    candidate = "candidate"          # Job applicant
    client = "client"                # Hiring company representative
    viewer = "viewer"                # Read-only access


class User(Base):
    """User model"""
    __tablename__ = "users"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Agency relationship (multi-tenancy)
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False)
    
    # Authentication
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    
    # Profile
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(50))
    avatar_url = Column(String(255))
    
    # Authorization
    role = Column(Enum(UserRole), nullable=False, default=UserRole.recruiter)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    email_verified_at = Column(DateTime(timezone=True))
    
    # Enhanced Profile Fields
    profile_photo = Column(String(500))
    professional_summary = Column(Text)
    profile_views_count = Column(Integer, default=0)
    profile_completion_percentage = Column(Integer, default=0)
    
    # MFA
    mfa_enabled = Column(Boolean, default=False, nullable=False)
    mfa_secret = Column(String(255), nullable=True)

    # Security
    last_login_at = Column(DateTime(timezone=True))
    last_login_ip = Column(String(45))  # IPv6 compatible
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime(timezone=True))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    agency = relationship("Agency", back_populates="users")
    activities = relationship("Activity", back_populates="user")
    candidate = relationship("Candidate", foreign_keys="Candidate.user_id", back_populates="user", uselist=False)
    client_company = relationship("ClientCompany", back_populates="user", uselist=False)
    saved_searches = relationship("SavedSearch", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.email}>"
    
    @property
    def full_name(self) -> str:
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def candidate_id(self) -> Optional[uuid.UUID]:
        """Get associated candidate ID safely"""
        try:
            return self.candidate.id if self.candidate else None
        except Exception:
            return None

    def is_super_admin(self) -> bool:
        """Check if user is super admin"""
        return self.role == UserRole.super_admin
    
    def is_agency_admin(self) -> bool:
        """Check if user is agency admin"""
        return self.role == UserRole.agency_admin
    
    def can_manage_users(self) -> bool:
        """Check if user can manage other users"""
        return self.role in [UserRole.super_admin, UserRole.agency_admin]
    
    def can_manage_jobs(self) -> bool:
        """Check if user can manage jobs"""
        return self.role in [UserRole.super_admin, UserRole.agency_admin, UserRole.recruiter]


class ProfileView(Base):
    """Profile View Analytics Model"""
    __tablename__ = "profile_views"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    viewer_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    viewer_company = Column(String(255))
    viewed_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    profile_user = relationship("User", foreign_keys=[profile_user_id])
    viewer_user = relationship("User", foreign_keys=[viewer_user_id])
