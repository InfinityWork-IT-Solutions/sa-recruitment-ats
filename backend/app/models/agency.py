"""
Agency model for multi-tenancy (UPDATED with Sprint 2 relationships)
"""
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, String, Integer, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class SubscriptionTier(str, enum.Enum):
    """Subscription tiers"""
    LITE = "lite"              # R725/seat/month - Basic features
    STANDARD = "standard"      # R925/seat/month - Standard features
    PREMIUM = "premium"        # R1,150/seat/month - All features


class Agency(Base):
    """Agency model - Tenant for multi-tenancy"""
    __tablename__ = "agencies"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Company Information
    name = Column(String(255), nullable=False, index=True)
    registration_number = Column(String(100))  # SA company registration
    vat_number = Column(String(100))
    
    # Contact Information
    email = Column(String(255), nullable=False)
    phone = Column(String(50))
    website = Column(String(255))
    
    # Address
    address_line1 = Column(String(255))
    address_line2 = Column(String(255))
    city = Column(String(100))
    province = Column(String(100))
    postal_code = Column(String(20))
    country = Column(String(100), default="South Africa")
    
    # Subscription
    subscription_tier = Column(Enum(SubscriptionTier), nullable=False, default=SubscriptionTier.STANDARD)
    max_users = Column(Integer, default=5, nullable=False)  # Seat limit
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_trial = Column(Boolean, default=True, nullable=False)
    trial_ends_at = Column(DateTime(timezone=True))
    subscription_starts_at = Column(DateTime(timezone=True))
    subscription_ends_at = Column(DateTime(timezone=True))
    
    # Billing
    billing_email = Column(String(255))
    next_billing_date = Column(DateTime(timezone=True))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    users = relationship("User", back_populates="agency", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="agency", cascade="all, delete-orphan")
    client_companies = relationship("ClientCompany", back_populates="agency", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="agency", cascade="all, delete-orphan")
    candidates = relationship("Candidate", back_populates="agency", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="agency", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Agency {self.name}>"
    
    @property
    def is_subscribed(self) -> bool:
        """Check if agency has active subscription"""
        if self.is_trial:
            return self.trial_ends_at and self.trial_ends_at > datetime.utcnow()
        return self.subscription_ends_at and self.subscription_ends_at > datetime.utcnow()
    
    def can_add_users(self, current_user_count: int) -> bool:
        """Check if agency can add more users"""
        return current_user_count < self.max_users
    
    def get_seat_price(self) -> int:
        """Get price per seat in ZAR cents"""
        prices = {
            SubscriptionTier.LITE: 72500,      # R725.00
            SubscriptionTier.STANDARD: 92500,  # R925.00
            SubscriptionTier.PREMIUM: 115000,  # R1,150.00
        }
        return prices.get(self.subscription_tier, 92500)
