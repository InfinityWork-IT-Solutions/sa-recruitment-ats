"""
EmailSequence models — automated multi-step email drip campaigns
"""
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, String, Text, ForeignKey, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class SequenceTriggerEvent(str, enum.Enum):
    application_received = "application_received"
    shortlisted = "shortlisted"
    after_interview = "after_interview"
    offer_made = "offer_made"
    rejected = "rejected"


class EmailSequence(Base):
    __tablename__ = "email_sequences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("client_companies.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    trigger_event = Column(Enum(SequenceTriggerEvent), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    steps = relationship("EmailSequenceStep", back_populates="sequence", order_by="EmailSequenceStep.step_number", cascade="all, delete-orphan")
    enrollments = relationship("EmailSequenceEnrollment", back_populates="sequence", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])


class EmailSequenceStep(Base):
    __tablename__ = "email_sequence_steps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sequence_id = Column(UUID(as_uuid=True), ForeignKey("email_sequences.id", ondelete="CASCADE"), nullable=False, index=True)
    step_number = Column(Integer, nullable=False)
    # Hours to wait after previous step (or after enrollment for step 1)
    delay_hours = Column(Integer, default=0, nullable=False)
    subject = Column(String(300), nullable=False)
    body_template = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sequence = relationship("EmailSequence", back_populates="steps")


class EmailSequenceEnrollment(Base):
    __tablename__ = "email_sequence_enrollments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sequence_id = Column(UUID(as_uuid=True), ForeignKey("email_sequences.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=True, index=True)
    current_step = Column(Integer, default=0, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    next_send_at = Column(DateTime, nullable=True, index=True)
    completed_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sequence = relationship("EmailSequence", back_populates="enrollments")
    candidate = relationship("Candidate", foreign_keys=[candidate_id])
    application = relationship("Application", foreign_keys=[application_id])
