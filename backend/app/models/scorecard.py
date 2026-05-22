"""
InterviewScorecard model — structured per-interviewer feedback
"""
from datetime import datetime
from sqlalchemy import Column, DateTime, Text, ForeignKey, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class ScorecardRecommendation(str, enum.Enum):
    strong_hire = "strong_hire"
    hire = "hire"
    maybe = "maybe"
    no_hire = "no_hire"


class InterviewScorecard(Base):
    __tablename__ = "interview_scorecards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("scheduled_interviews.id", ondelete="CASCADE"), nullable=True, index=True)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    scored_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # 1-5 overall rating
    overall_rating = Column(Integer, nullable=False)

    # Criteria scores: {technical: 80, culture_fit: 90, communication: 75, problem_solving: 85}
    criteria_scores = Column(JSONB, default=dict)

    strengths = Column(Text, nullable=True)
    concerns = Column(Text, nullable=True)
    recommendation = Column(Enum(ScorecardRecommendation), nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    application = relationship("Application", back_populates="scorecards")
    scorer = relationship("User", foreign_keys=[scored_by])
