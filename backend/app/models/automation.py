from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, JSON, TEXT, DECIMAL, Date, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.core.database import Base

class AutomatedScreeningResult(Base):
    __tablename__ = "automated_screening_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    
    overall_score = Column(Integer, nullable=False)
    skills_score = Column(Integer)
    experience_score = Column(Integer)
    education_score = Column(Integer)
    location_score = Column(Integer)
    
    decision = Column(String(20), nullable=False)
    decision_reason = Column(TEXT)
    
    ai_summary = Column(TEXT)
    strengths = Column(JSONB)
    weaknesses = Column(JSONB)
    red_flags = Column(JSONB)
    
    rejection_email_sent = Column(Boolean, default=False)
    rejection_email_sent_at = Column(DateTime)
    rejection_reason_candidate = Column(TEXT)
    
    processed_at = Column(DateTime, default=datetime.utcnow)
    processed_by = Column(String(50), default="ai_auto_screener")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    application = relationship("Application")

class VideoScreeningTemplate(Base):
    __tablename__ = "video_screening_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("client_companies.id", ondelete="CASCADE"))
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"))
    
    name = Column(String(200), nullable=False)
    description = Column(TEXT)
    category = Column(String(100))
    
    questions = Column(JSONB, nullable=False)
    
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class VideoScreeningInvitation(Base):
    __tablename__ = "video_screening_invitations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    template_id = Column(UUID(as_uuid=True), ForeignKey("video_screening_templates.id"))
    
    invitation_sent_at = Column(DateTime)
    invitation_email_sent = Column(Boolean, default=False)
    
    access_token = Column(String(100), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    
    status = Column(String(50), default="pending")
    
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    reminder_sent_count = Column(Integer, default=0)
    last_reminder_sent_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class VideoScreeningResponse(Base):
    __tablename__ = "video_screening_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invitation_id = Column(UUID(as_uuid=True), ForeignKey("video_screening_invitations.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    
    question_index = Column(Integer, nullable=False)
    question_text = Column(TEXT, nullable=False)
    
    video_url = Column(String(500))
    video_duration_seconds = Column(Integer)
    recorded_at = Column(DateTime)
    
    transcript = Column(TEXT)
    transcript_confidence = Column(DECIMAL(5, 2))
    
    ai_score = Column(Integer)
    ai_analysis = Column(JSONB)
    
    technical_keywords_found = Column(JSONB)
    sentiment_analysis = Column(JSONB)
    
    needs_human_review = Column(Boolean, default=False)
    human_review_reason = Column(String(200))
    
    processed_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class VideoScreeningResult(Base):
    __tablename__ = "video_screening_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invitation_id = Column(UUID(as_uuid=True), ForeignKey("video_screening_invitations.id", ondelete="CASCADE"), nullable=False, unique=True)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    
    overall_score = Column(Integer, nullable=False)
    content_score = Column(Integer)
    communication_score = Column(Integer)
    technical_score = Column(Integer)
    
    ai_summary = Column(TEXT)
    key_strengths = Column(JSONB)
    key_concerns = Column(JSONB)
    recommended_action = Column(String(50))
    
    final_decision = Column(String(50))
    decision_made_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    decision_made_at = Column(DateTime)
    
    interview_invitation_sent = Column(Boolean, default=False)
    interview_invitation_sent_at = Column(DateTime)
    
    share_score_with_candidate = Column(Boolean, default=False)
    candidate_feedback = Column(TEXT)
    
    completed_at = Column(DateTime, default=datetime.utcnow)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SourcingCampaign(Base):
    __tablename__ = "sourcing_campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("client_companies.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(200), nullable=False)
    status = Column(String(50), default="active")
    
    target_skills = Column(JSONB)
    target_experience_years_min = Column(Integer)
    target_experience_years_max = Column(Integer)
    target_locations = Column(JSONB)
    target_education_levels = Column(JSONB)
    
    ai_search_query = Column(TEXT)
    
    max_candidates_to_contact = Column(Integer, default=100)
    candidates_contacted_count = Column(Integer, default=0)
    
    message_template_id = Column(UUID(as_uuid=True), ForeignKey("message_templates.id"))
    
    start_date = Column(Date)
    end_date = Column(Date)
    
    candidates_found = Column(Integer, default=0)
    candidates_messaged = Column(Integer, default=0)
    candidates_responded = Column(Integer, default=0)
    candidates_applied = Column(Integer, default=0)
    
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SourcingProspect(Base):
    __tablename__ = "sourcing_prospects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("sourcing_campaigns.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="SET NULL"))
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    
    match_score = Column(Integer, nullable=False)
    match_reason = Column(TEXT)
    
    status = Column(String(50), default="identified")
    
    message_sent_at = Column(DateTime)
    message_opened_at = Column(DateTime)
    message_clicked_at = Column(DateTime)
    responded_at = Column(DateTime)
    
    follow_up_count = Column(Integer, default=0)
    last_follow_up_at = Column(DateTime)
    next_follow_up_at = Column(DateTime)
    
    candidate_response = Column(TEXT)
    candidate_interest_level = Column(String(50))
    
    discovered_at = Column(DateTime, default=datetime.utcnow)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class InterviewAvailabilitySlot(Base):
    __tablename__ = "interview_availability_slots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    slot_date = Column(Date, nullable=False)
    start_time = Column(TEXT, nullable=False) # Changed from TIME to TEXT for easier SQLALchemy handling if needed, or use sqlalchemy.types.Time
    end_time = Column(TEXT, nullable=False)
    
    is_available = Column(Boolean, default=True)
    is_recurring = Column(Boolean, default=False)
    recurrence_pattern = Column(String(50))
    recurrence_end_date = Column(Date)
    
    is_booked = Column(Boolean, default=False)
    booked_by = Column(UUID(as_uuid=True), ForeignKey("applications.id"))
    booked_at = Column(DateTime)
    
    meeting_type = Column(String(50), default="video")
    meeting_url = Column(String(500))
    meeting_location = Column(String(200))
    
    notes = Column(TEXT)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ScheduledInterview(Base):
    __tablename__ = "scheduled_interviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    slot_id = Column(UUID(as_uuid=True), ForeignKey("interview_availability_slots.id"))
    
    interviewer_ids = Column(JSONB, nullable=False)
    
    scheduled_date = Column(Date, nullable=False)
    scheduled_start_time = Column(TEXT, nullable=False)
    scheduled_end_time = Column(TEXT, nullable=False)
    duration_minutes = Column(Integer, nullable=False, default=60)
    
    meeting_type = Column(String(50), default="video")
    meeting_url = Column(String(500))
    meeting_location = Column(String(200))
    meeting_password = Column(String(100))
    
    status = Column(String(50), default="scheduled")
    
    candidate_confirmed = Column(Boolean, default=False)
    candidate_confirmed_at = Column(DateTime)
    interviewer_confirmed = Column(Boolean, default=False)
    interviewer_confirmed_at = Column(DateTime)
    
    reminder_24h_sent = Column(Boolean, default=False)
    reminder_1h_sent = Column(Boolean, default=False)
    
    cancelled_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    cancelled_at = Column(DateTime)
    cancellation_reason = Column(TEXT)
    
    rescheduled_from = Column(UUID(as_uuid=True), ForeignKey("scheduled_interviews.id"))
    reschedule_count = Column(Integer, default=0)
    
    notes = Column(TEXT)
    
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class InterviewTranscript(Base):
    __tablename__ = "interview_transcripts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("scheduled_interviews.id", ondelete="CASCADE"), nullable=False)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    
    recording_url = Column(String(500))
    recording_duration_seconds = Column(Integer)
    recording_started_at = Column(DateTime)
    recording_ended_at = Column(DateTime)
    
    transcript = Column(TEXT)
    transcript_confidence = Column(DECIMAL(5, 2))
    speaker_labels = Column(JSONB)
    
    ai_summary = Column(TEXT)
    key_topics = Column(JSONB)
    sentiment_analysis = Column(JSONB)
    
    technical_skills_mentioned = Column(JSONB)
    behavioral_traits = Column(JSONB)
    red_flags = Column(JSONB)
    positive_signals = Column(JSONB)
    
    overall_assessment_score = Column(Integer)
    technical_score = Column(Integer)
    communication_score = Column(Integer)
    culture_fit_score = Column(Integer)
    
    ai_report_url = Column(String(500))
    
    processed_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class JobGenerationRequest(Base):
    __tablename__ = "job_generation_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("client_companies.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    job_title = Column(String(200), nullable=False)
    job_category = Column(String(100))
    required_skills = Column(JSONB)
    experience_level = Column(String(50))
    location = Column(String(200))
    salary_range = Column(String(100))
    
    company_culture = Column(TEXT)
    special_requirements = Column(TEXT)
    benefits = Column(JSONB)
    
    ai_provider = Column(String(50), default="openai")
    ai_model = Column(String(50))
    ai_prompt = Column(TEXT)
    
    generated_title = Column(String(200))
    generated_description = Column(TEXT)
    generated_responsibilities = Column(JSONB)
    generated_requirements = Column(JSONB)
    generated_qualifications = Column(JSONB)
    
    generation_quality_score = Column(Integer)
    
    status = Column(String(50), default="pending")
    
    user_accepted = Column(Boolean)
    user_edited = Column(Boolean)
    user_feedback = Column(TEXT)
    
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"))
    
    generated_at = Column(DateTime)
    error_message = Column(TEXT)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MessageTemplate(Base):
    __tablename__ = "message_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("client_companies.id", ondelete="CASCADE"))
    
    name = Column(String(200), nullable=False)
    template_type = Column(String(100), nullable=False)
    
    subject = Column(String(300))
    body_template = Column(TEXT, nullable=False)
    
    available_variables = Column(JSONB)
    
    send_from_email = Column(String(200))
    send_from_name = Column(String(200))
    cc_emails = Column(JSONB)
    bcc_emails = Column(JSONB)
    
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AutomatedMessage(Base):
    __tablename__ = "automated_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"))
    
    message_type = Column(String(100), nullable=False)
    template_id = Column(UUID(as_uuid=True), ForeignKey("message_templates.id"))
    
    subject = Column(String(300))
    body = Column(TEXT, nullable=False)
    
    delivery_method = Column(String(50), default="email")
    recipient_email = Column(String(200))
    recipient_phone = Column(String(50))
    
    status = Column(String(50), default="pending")
    
    sent_at = Column(DateTime)
    delivered_at = Column(DateTime)
    opened_at = Column(DateTime)
    clicked_at = Column(DateTime)
    failed_at = Column(DateTime)
    
    failure_reason = Column(TEXT)
    
    tracking_id = Column(String(100), unique=True)
    open_count = Column(Integer, default=0)
    click_count = Column(Integer, default=0)
    
    candidate_responded = Column(Boolean, default=False)
    candidate_response = Column(TEXT)
    responded_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AIAutomationMetric(Base):
    __tablename__ = "ai_automation_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    metric_date = Column(Date, nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("client_companies.id", ondelete="CASCADE"))
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"))
    
    applications_screened = Column(Integer, default=0)
    auto_rejections = Column(Integer, default=0)
    video_screening_invites = Column(Integer, default=0)
    fast_track_candidates = Column(Integer, default=0)
    
    video_screenings_sent = Column(Integer, default=0)
    video_screenings_completed = Column(Integer, default=0)
    video_screening_completion_rate = Column(DECIMAL(5, 2))
    avg_video_screening_score = Column(DECIMAL(5, 2))
    
    candidates_sourced = Column(Integer, default=0)
    sourcing_messages_sent = Column(Integer, default=0)
    sourcing_response_rate = Column(DECIMAL(5, 2))
    sourcing_applications = Column(Integer, default=0)
    
    interviews_scheduled = Column(Integer, default=0)
    interviews_completed = Column(Integer, default=0)
    no_show_rate = Column(DECIMAL(5, 2))
    avg_time_to_schedule_hours = Column(DECIMAL(8, 2))
    
    ai_api_calls = Column(Integer, default=0)
    ai_api_cost_usd = Column(DECIMAL(10, 2))
    avg_ai_processing_time_seconds = Column(DECIMAL(8, 2))
    
    estimated_hours_saved = Column(DECIMAL(8, 2))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AIProviderConfig(Base):
    __tablename__ = "ai_provider_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("client_companies.id", ondelete="CASCADE"))
    
    provider_name = Column(String(100), nullable=False)
    service_type = Column(String(100), nullable=False)
    
    api_key_encrypted = Column(TEXT)
    api_endpoint = Column(String(500))
    
    model_name = Column(String(100))
    settings = Column(JSONB)
    
    monthly_limit_usd = Column(DECIMAL(10, 2))
    current_month_usage_usd = Column(DECIMAL(10, 2), default=0)
    
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime)
    
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AIDecision(Base):
    __tablename__ = "ai_decisions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"))
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"))
    
    decision_type = Column(String(50), nullable=False)
    status = Column(String(50), default="pending")
    
    ai_reasoning = Column(TEXT)
    ai_confidence = Column(Integer)
    proposed_action = Column(JSONB)
    modifications = Column(JSONB)
    
    created_by_service = Column(String(100))
    
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    approved_at = Column(DateTime)
    rejection_reason = Column(TEXT)
    
    executed_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AIDecisionAuditLog(Base):
    __tablename__ = "ai_decision_audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    decision_id = Column(UUID(as_uuid=True), ForeignKey("ai_decisions.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(100), nullable=False)
    previous_status = Column(String(50))
    new_status = Column(String(50))
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    notes = Column(TEXT)
    created_at = Column(DateTime, default=datetime.utcnow)
