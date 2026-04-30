
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Numeric, Boolean, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, date

from app.core.database import Base

class SubscriptionPlanLimits(Base):
    """Configuration table for limits per plan tier"""
    __tablename__ = "subscription_plan_limits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_name = Column(String(50), unique=True, nullable=False, index=True) # starter, professional, enterprise
    
    # Limits (per month)
    cv_parses_per_month = Column(Integer, default=50)
    ai_match_calculations_per_month = Column(Integer, default=500)
    ai_search_queries_per_month = Column(Integer, default=200)
    
    # Costs (if we want per-item pricing later)
    price_zar = Column(Numeric(10, 2), default=0.00)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

class CompanyUsageTracking(Base):
    """Main usage counter for companies/agencies per billing period"""
    __tablename__ = "company_usage_tracking"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Billing Period
    billing_period_start = Column(Date, nullable=False)
    billing_period_end = Column(Date, nullable=False)
    
    # Usage Counters
    cv_parses_used = Column(Integer, default=0)
    ai_match_calculations_used = Column(Integer, default=0)
    ai_search_queries_used = Column(Integer, default=0)
    
    # Costs Financial Tracking
    estimated_ai_cost_zar = Column(Numeric(10, 2), default=0.00)
    
    # Last updated timestamp
    last_operation_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relationships
    agency = relationship("Agency", backref="usage_tracking")

class UsageLog(Base):
    """Detailed log of every AI operation for transparency and analytics"""
    __tablename__ = "usage_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    usage_type = Column(String(50), nullable=False) # cv_parse, ai_match, ai_search
    resource_id = Column(String(255), nullable=True)  # ID of the CV, Job, etc.
    
    tokens_used = Column(Integer, nullable=True)     # Raw LLM tokens if available
    estimated_cost_zar = Column(Numeric(10, 4), default=0.00)
    
    success = Column(Boolean, default=True)
    error_message = Column(String(500), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class UsageAlert(Base):
    """Threshold alerts when company reaches 80%, 90%, 100% usage"""
    __tablename__ = "usage_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    alert_type = Column(String(50), nullable=False) # cv_parse_80, cv_parse_100, etc.
    threshold_percentage = Column(Integer, nullable=False)
    
    is_resolved = Column(Boolean, default=False)
    triggered_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
