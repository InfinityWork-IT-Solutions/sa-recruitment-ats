"""
Application model - Links candidates to jobs
"""
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, String, Integer, Text, ForeignKey, Enum, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class ApplicationStatus(str, enum.Enum):
    """Application status - Kanban pipeline"""
    APPLIED = "applied"                  # Initial application
    SCREENING = "screening"              # Under review
    SHORTLISTED = "shortlisted"          # Passed screening
    INTERVIEW_SCHEDULED = "interview_scheduled"  # Interview booked
    INTERVIEWED = "interviewed"          # Interview completed
    OFFER_PENDING = "offer_pending"      # Offer being prepared
    OFFER_MADE = "offer_made"            # Offer sent to candidate
    OFFER_ACCEPTED = "offer_accepted"    # Candidate accepted
    HIRED = "hired"                      # Successfully hired
    REJECTED = "rejected"                # Rejected at any stage
    WITHDRAWN = "withdrawn"              # Candidate withdrew


class ApplicationSource(str, enum.Enum):
    """How application was received"""
    DIRECT_APPLY = "direct_apply"        # Applied directly
    RECRUITER_ADDED = "recruiter_added"  # Added by recruiter
    REFERRAL = "referral"                # Referred by someone
    HEADHUNTED = "headhunted"            # Proactively sourced
    IMPORTED = "imported"                # Imported from job board


class RejectionReason(str, enum.Enum):
    """Reason for rejection"""
    QUALIFICATIONS = "qualifications"    # Doesn't meet requirements
    EXPERIENCE = "experience"            # Not enough experience
    SALARY = "salary"                    # Salary mismatch
    LOCATION = "location"                # Location constraints
    CULTURE_FIT = "culture_fit"          # Not a culture fit
    BETTER_CANDIDATE = "better_candidate"  # Another candidate selected
    POSITION_FILLED = "position_filled"  # Position already filled
    OTHER = "other"


class Application(Base):
    """Application model - Candidate applying to Job"""
    __tablename__ = "applications"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Agency relationship (multi-tenancy)
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Foreign Keys
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Optional: Client company (denormalized for reporting)
    client_company_id = Column(UUID(as_uuid=True), ForeignKey("client_companies.id", ondelete="SET NULL"))
    
    # Assigned recruiter
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    
    # Application Details
    status = Column(Enum(ApplicationStatus), nullable=False, default=ApplicationStatus.APPLIED, index=True)
    source = Column(Enum(ApplicationSource), default=ApplicationSource.DIRECT_APPLY)
    
    # Cover Letter & Resume
    cover_letter = Column(Text)
    resume_version = Column(String(255))  # Which version of resume was used
    
    # Screening
    screening_score = Column(Integer)  # 0-100
    screening_notes = Column(Text)
    screening_passed = Column(Boolean)
    screened_at = Column(DateTime(timezone=True))
    screened_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    
    # Interview
    interview_scheduled_at = Column(DateTime(timezone=True))
    interview_completed_at = Column(DateTime(timezone=True))
    interview_feedback = Column(Text)
    interview_rating = Column(Integer)  # 1-5 stars
    
    # Offer
    offer_amount = Column(Integer)  # In ZAR
    offer_currency = Column(String(10), default="ZAR")
    offer_sent_at = Column(DateTime(timezone=True))
    offer_accepted_at = Column(DateTime(timezone=True))
    offer_rejected_at = Column(DateTime(timezone=True))
    start_date = Column(DateTime(timezone=True))
    
    # Rejection
    rejected_at = Column(DateTime(timezone=True))
    rejection_reason = Column(Enum(RejectionReason))
    rejection_notes = Column(Text)
    rejected_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    
    # Withdrawal
    withdrawn_at = Column(DateTime(timezone=True))
    withdrawal_reason = Column(Text)
    
    # Match Score (AI-based)
    match_score = Column(Integer)  # 0-100, AI-calculated job-candidate match
    match_explanation = Column(JSONB)  # AI explanation of match
    
    # Timeline tracking
    status_history = Column(JSONB, default=list)  # [{status, timestamp, changed_by}]
    
    # Notes & Communication
    notes = Column(Text)  # Internal notes
    communication_log = Column(JSONB, default=list)  # [{date, type, subject, from, to}]
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    agency = relationship("Agency", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    candidate = relationship("Candidate", back_populates="applications")
    client_company = relationship("ClientCompany", back_populates="applications")
    recruiter = relationship("User", foreign_keys=[assigned_to])
    screener = relationship("User", foreign_keys=[screened_by])
    rejecter = relationship("User", foreign_keys=[rejected_by])
    
    # Indexes
    __table_args__ = (
        # Composite indexes for common queries
        Index('idx_applications_job_status', 'job_id', 'status'),
        Index('idx_applications_candidate_status', 'candidate_id', 'status'),
        Index('idx_applications_agency_status', 'agency_id', 'status'),
        # Unique constraint: One application per candidate per job
        Index('idx_applications_unique', 'candidate_id', 'job_id', unique=True),
    )
    
    def __repr__(self):
        return f"<Application {self.id}>"
    
    def add_status_change(self, new_status: ApplicationStatus, changed_by_id: UUID):
        """Add status change to history"""
        if not self.status_history:
            self.status_history = []
        
        self.status_history.append({
            "status": new_status.value,
            "timestamp": datetime.utcnow().isoformat(),
            "changed_by": str(changed_by_id)
        })
    
    def move_to_screening(self):
        """Move application to screening"""
        self.status = ApplicationStatus.SCREENING
        self.updated_at = datetime.utcnow()
    
    def shortlist(self, score: int, notes: str, screener_id: UUID):
        """Shortlist candidate"""
        self.status = ApplicationStatus.SHORTLISTED
        self.screening_score = score
        self.screening_notes = notes
        self.screening_passed = True
        self.screened_at = datetime.utcnow()
        self.screened_by = screener_id
    
    def schedule_interview(self, interview_time: datetime):
        """Schedule interview"""
        self.status = ApplicationStatus.INTERVIEW_SCHEDULED
        self.interview_scheduled_at = interview_time
    
    def complete_interview(self, rating: int, feedback: str):
        """Mark interview as completed"""
        self.status = ApplicationStatus.INTERVIEWED
        self.interview_completed_at = datetime.utcnow()
        self.interview_rating = rating
        self.interview_feedback = feedback
    
    def make_offer(self, amount: int):
        """Make job offer"""
        self.status = ApplicationStatus.OFFER_MADE
        self.offer_amount = amount
        self.offer_sent_at = datetime.utcnow()
    
    def accept_offer(self, start_date: datetime):
        """Accept offer"""
        self.status = ApplicationStatus.OFFER_ACCEPTED
        self.offer_accepted_at = datetime.utcnow()
        self.start_date = start_date
    
    def hire(self):
        """Mark as hired"""
        self.status = ApplicationStatus.HIRED
    
    def reject(self, reason: RejectionReason, notes: str, rejected_by_id: UUID):
        """Reject application"""
        self.status = ApplicationStatus.REJECTED
        self.rejection_reason = reason
        self.rejection_notes = notes
        self.rejected_at = datetime.utcnow()
        self.rejected_by = rejected_by_id
    
    def withdraw(self, reason: str):
        """Candidate withdraws"""
        self.status = ApplicationStatus.WITHDRAWN
        self.withdrawal_reason = reason
        self.withdrawn_at = datetime.utcnow()
