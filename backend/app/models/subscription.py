from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Numeric, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), nullable=False, unique=True)
    display_name = Column(String(100), nullable=False)
    description = Column(String)
    
    price_monthly = Column(Numeric(10, 2), nullable=False)
    price_annual = Column(Numeric(10, 2))
    
    seats_included = Column(Integer, default=1, nullable=False)
    max_searches_per_month = Column(Integer)  # NULL = unlimited
    
    video_screening_enabled = Column(Boolean, default=False)
    ai_matching_enabled = Column(Boolean, default=False)
    advanced_analytics_enabled = Column(Boolean, default=False)
    api_access_enabled = Column(Boolean, default=False)
    white_label_enabled = Column(Boolean, default=False)
    priority_support = Column(Boolean, default=False)
    
    trial_days = Column(Integer, default=14)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    subscriptions = relationship("RecruiterSubscription", back_populates="plan")


class RecruiterSubscription(Base):
    __tablename__ = "recruiter_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recruiter_agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id", ondelete="CASCADE"))
    plan_id = Column(UUID(as_uuid=True), ForeignKey("subscription_plans.id"))
    
    status = Column(String(50), default="trialing", nullable=False)
    billing_cycle = Column(String(20), default="monthly", nullable=False)
    
    trial_start_date = Column(DateTime)
    trial_end_date = Column(DateTime)
    current_period_start = Column(DateTime, nullable=False)
    current_period_end = Column(DateTime, nullable=False)
    canceled_at = Column(DateTime)
    ended_at = Column(DateTime)
    
    seats_allocated = Column(Integer, default=1, nullable=False)
    seats_used = Column(Integer, default=1, nullable=False)
    
    searches_used_this_month = Column(Integer, default=0)
    searches_reset_date = Column(DateTime)
    
    payfast_subscription_token = Column(String(255), unique=True)
    payfast_payment_id = Column(String(255))
    
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="ZAR")
    auto_renew = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    plan = relationship("SubscriptionPlan", back_populates="subscriptions")
    recruiter_agency = relationship("Agency")
    transactions = relationship("PaymentTransaction", back_populates="subscription")
    invoices = relationship("Invoice", back_populates="subscription")
    seats = relationship("RecruiterSeat", back_populates="subscription")


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("recruiter_subscriptions.id"))
    recruiter_agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id"))
    
    transaction_type = Column(String(50), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="ZAR")
    
    payfast_payment_id = Column(String(255), unique=True)
    payfast_transaction_id = Column(String(255))
    payment_status = Column(String(50), nullable=False)
    payment_method = Column(String(50))
    
    description = Column(String)
    invoice_number = Column(String(50), unique=True)
    payfast_data = Column(JSON)
    
    payment_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    subscription = relationship("RecruiterSubscription", back_populates="transactions")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("recruiter_subscriptions.id"))
    recruiter_agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id"))
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("payment_transactions.id"))
    
    invoice_number = Column(String(50), unique=True, nullable=False)
    status = Column(String(50), default="draft", nullable=False)
    
    subtotal = Column(Numeric(10, 2), nullable=False)
    tax_rate = Column(Numeric(5, 2), default=15.00)
    tax_amount = Column(Numeric(10, 2))
    total = Column(Numeric(10, 2), nullable=False)
    amount_paid = Column(Numeric(10, 2), default=0.00)
    currency = Column(String(3), default="ZAR")
    
    line_items = Column(JSON, nullable=False)
    issue_date = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=False)
    paid_date = Column(DateTime)
    
    pdf_url = Column(String)
    notes = Column(String)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    subscription = relationship("RecruiterSubscription", back_populates="invoices")


class RecruiterSeat(Base):
    __tablename__ = "recruiter_seats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("recruiter_subscriptions.id", ondelete="CASCADE"))
    recruiter_agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    role = Column(String(50), default="recruiter")
    is_active = Column(Boolean, default=True)
    
    assigned_at = Column(DateTime, default=datetime.utcnow)
    deactivated_at = Column(DateTime)

    subscription = relationship("RecruiterSubscription", back_populates="seats")


class FeatureUsage(Base):
    __tablename__ = "feature_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("recruiter_subscriptions.id"))
    recruiter_agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    feature_name = Column(String(100), nullable=False)
    usage_count = Column(Integer, default=1)
    usage_metadata = Column("metadata", JSON)
    usage_month = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class PayFastWebhook(Base):
    __tablename__ = "payfast_webhooks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(String(100))
    payment_id = Column(String(255))
    subscription_token = Column(String(255))
    payload = Column(JSON, nullable=False)
    
    processed = Column(Boolean, default=False)
    processed_at = Column(DateTime)
    error_message = Column(String)
    
    signature_valid = Column(Boolean)
    ip_address = Column(String(50))
    
    created_at = Column(DateTime, default=datetime.utcnow)
