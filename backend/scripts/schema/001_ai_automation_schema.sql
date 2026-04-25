-- ============================================================================
-- RECRUITPRO SA - COMPLETE AI AUTOMATION DATABASE SCHEMA
-- ============================================================================
-- This migration adds ALL tables needed for 70% AI automation
-- Features: Auto-screening, AI video screening, proactive sourcing,
--           interview scheduling, AI transcription, job generation
-- ============================================================================

-- ============================================================================
-- 0. MESSAGE TEMPLATES (Required for Sourcing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES client_companies(id) ON DELETE CASCADE,
    
    name VARCHAR(200) NOT NULL,
    template_type VARCHAR(100) NOT NULL CHECK (template_type IN (
        'auto_rejection', 'video_screening_invitation', 'interview_invitation',
        'interview_reminder', 'sourcing_outreach', 'sourcing_followup',
        'offer_letter', 'candidate_update'
    )),
    
    -- Template Content
    subject VARCHAR(300), -- For emails
    body_template TEXT NOT NULL, -- Supports variables like {{candidate_name}}, {{job_title}}
    
    -- Variables Available
    available_variables JSONB, -- ["candidate_name", "job_title", "company_name", "interview_date"]
    
    -- Delivery Settings
    send_from_email VARCHAR(200),
    send_from_name VARCHAR(200),
    cc_emails JSONB,
    bcc_emails JSONB,
    
    -- Settings
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_template_type ON message_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_template_company ON message_templates(company_id);

-- ============================================================================
-- 1. AUTOMATED SCREENING & REJECTION
-- ============================================================================

-- Track automated screening decisions
CREATE TABLE IF NOT EXISTS automated_screening_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    
    -- AI Matching Score
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    skills_score INTEGER CHECK (skills_score >= 0 AND skills_score <= 100),
    experience_score INTEGER CHECK (experience_score >= 0 AND experience_score <= 100),
    education_score INTEGER CHECK (education_score >= 0 AND education_score <= 100),
    location_score INTEGER CHECK (location_score >= 0 AND location_score <= 100),
    
    -- Screening Decision
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('auto_reject', 'video_screening', 'fast_track', 'manual_review')),
    decision_reason TEXT,
    
    -- AI Analysis
    ai_summary TEXT,
    strengths JSONB, -- ["5+ years Python", "Django expert"]
    weaknesses JSONB, -- ["No AWS experience", "Outside preferred location"]
    red_flags JSONB, -- ["Resume gaps", "Salary too high"]
    
    -- Rejection Email
    rejection_email_sent BOOLEAN DEFAULT FALSE,
    rejection_email_sent_at TIMESTAMP,
    rejection_reason_candidate TEXT, -- Human-friendly version for candidate
    
    -- Metadata
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by VARCHAR(50) DEFAULT 'ai_auto_screener',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_screening_application ON automated_screening_results(application_id);
CREATE INDEX IF NOT EXISTS idx_screening_decision ON automated_screening_results(decision);
CREATE INDEX IF NOT EXISTS idx_screening_score ON automated_screening_results(overall_score DESC);

-- ============================================================================
-- 2. AI VIDEO SCREENING
-- ============================================================================

-- Video screening questions templates
CREATE TABLE IF NOT EXISTS video_screening_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES client_companies(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE, -- Null = reusable template
    
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- 'technical', 'behavioral', 'culture_fit'
    
    questions JSONB NOT NULL, -- [{"question": "...", "duration_seconds": 120, "order": 1}]
    
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Video screening invitations
CREATE TABLE IF NOT EXISTS video_screening_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    template_id UUID REFERENCES video_screening_templates(id),
    
    -- Invitation
    invitation_sent_at TIMESTAMP,
    invitation_email_sent BOOLEAN DEFAULT FALSE,
    
    -- Access
    access_token VARCHAR(100) UNIQUE NOT NULL, -- Unique link for candidate
    expires_at TIMESTAMP NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'expired', 'withdrawn')),
    
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Reminders
    reminder_sent_count INTEGER DEFAULT 0,
    last_reminder_sent_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_video_invitation_candidate ON video_screening_invitations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_video_invitation_status ON video_screening_invitations(status);
CREATE INDEX IF NOT EXISTS idx_video_invitation_token ON video_screening_invitations(access_token);

-- Video screening responses
CREATE TABLE IF NOT EXISTS video_screening_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID NOT NULL REFERENCES video_screening_invitations(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    
    question_index INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    
    -- Video Recording
    video_url VARCHAR(500), -- S3/cloud storage URL
    video_duration_seconds INTEGER,
    recorded_at TIMESTAMP,
    
    -- AI Transcription
    transcript TEXT,
    transcript_confidence DECIMAL(5,2), -- 0.00 to 100.00
    
    -- AI Analysis
    ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
    ai_analysis JSONB, -- {"content_score": 85, "communication_score": 90, "keywords": [...]}
    
    technical_keywords_found JSONB, -- ["Python", "Django", "AWS"]
    sentiment_analysis JSONB, -- {"overall": "positive", "confidence": 0.85}
    
    -- Flags
    needs_human_review BOOLEAN DEFAULT FALSE,
    human_review_reason VARCHAR(200),
    
    processed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_video_response_invitation ON video_screening_responses(invitation_id);
CREATE INDEX IF NOT EXISTS idx_video_response_candidate ON video_screening_responses(candidate_id);

-- Video screening overall results
CREATE TABLE IF NOT EXISTS video_screening_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID NOT NULL UNIQUE REFERENCES video_screening_invitations(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    
    -- Overall AI Assessment
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    content_score INTEGER CHECK (content_score >= 0 AND content_score <= 100),
    communication_score INTEGER CHECK (communication_score >= 0 AND communication_score <= 100),
    technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 100),
    
    -- AI Summary
    ai_summary TEXT,
    key_strengths JSONB,
    key_concerns JSONB,
    recommended_action VARCHAR(50) CHECK (recommended_action IN ('proceed_to_interview', 'manual_review', 'reject')),
    
    -- Decision
    final_decision VARCHAR(50) CHECK (final_decision IN ('pending', 'interview', 'reject', 'manual_review')),
    decision_made_by UUID REFERENCES users(id),
    decision_made_at TIMESTAMP,
    
    -- Interview Invitation
    interview_invitation_sent BOOLEAN DEFAULT FALSE,
    interview_invitation_sent_at TIMESTAMP,
    
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_video_result_candidate ON video_screening_results(candidate_id);
CREATE INDEX IF NOT EXISTS idx_video_result_score ON video_screening_results(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_video_result_action ON video_screening_results(recommended_action);

-- ============================================================================
-- 3. PROACTIVE CANDIDATE SOURCING
-- ============================================================================

-- Sourcing campaigns (AI hunts for candidates)
CREATE TABLE IF NOT EXISTS sourcing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES client_companies(id) ON DELETE CASCADE,
    
    name VARCHAR(200) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    
    -- Target Criteria (AI matching criteria)
    target_skills JSONB, -- ["Python", "Django", "AWS"]
    target_experience_years_min INTEGER,
    target_experience_years_max INTEGER,
    target_locations JSONB, -- ["Cape Town", "Johannesburg"]
    target_education_levels JSONB,
    
    -- AI Search Query
    ai_search_query TEXT,
    
    -- Outreach Settings
    max_candidates_to_contact INTEGER DEFAULT 100,
    candidates_contacted_count INTEGER DEFAULT 0,
    
    message_template_id UUID REFERENCES message_templates(id),
    
    -- Schedule
    start_date DATE,
    end_date DATE,
    
    -- Results
    candidates_found INTEGER DEFAULT 0,
    candidates_messaged INTEGER DEFAULT 0,
    candidates_responded INTEGER DEFAULT 0,
    candidates_applied INTEGER DEFAULT 0,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sourcing_job ON sourcing_campaigns(job_id);
CREATE INDEX IF NOT EXISTS idx_sourcing_status ON sourcing_campaigns(status);

-- Sourcing prospects (AI-found candidates)
CREATE TABLE IF NOT EXISTS sourcing_prospects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES sourcing_campaigns(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    
    -- Match Score
    match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
    match_reason TEXT,
    
    -- Contact Status
    status VARCHAR(50) DEFAULT 'identified' CHECK (status IN (
        'identified', 'message_sent', 'message_opened', 'message_clicked', 
        'responded', 'applied', 'declined', 'ignored'
    )),
    
    -- Outreach
    message_sent_at TIMESTAMP,
    message_opened_at TIMESTAMP,
    message_clicked_at TIMESTAMP,
    responded_at TIMESTAMP,
    
    -- Follow-up
    follow_up_count INTEGER DEFAULT 0,
    last_follow_up_at TIMESTAMP,
    next_follow_up_at TIMESTAMP,
    
    -- Response
    candidate_response TEXT,
    candidate_interest_level VARCHAR(50), -- 'high', 'medium', 'low', 'not_interested'
    
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prospect_campaign ON sourcing_prospects(campaign_id);
CREATE INDEX IF NOT EXISTS idx_prospect_candidate ON sourcing_prospects(candidate_id);
CREATE INDEX IF NOT EXISTS idx_prospect_status ON sourcing_prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospect_score ON sourcing_prospects(match_score DESC);

-- ============================================================================
-- 4. AUTOMATED INTERVIEW SCHEDULING
-- ============================================================================

-- Interview availability slots
CREATE TABLE IF NOT EXISTS interview_availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Time Slot
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Availability
    is_available BOOLEAN DEFAULT TRUE,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50), -- 'weekly', 'daily'
    recurrence_end_date DATE,
    
    -- Booking
    is_booked BOOLEAN DEFAULT FALSE,
    booked_by UUID REFERENCES applications(id),
    booked_at TIMESTAMP,
    
    -- Meeting Details
    meeting_type VARCHAR(50) DEFAULT 'video' CHECK (meeting_type IN ('video', 'phone', 'in_person')),
    meeting_url VARCHAR(500), -- Zoom/Teams link
    meeting_location VARCHAR(200), -- For in-person
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(interviewer_id, slot_date, start_time)
);

CREATE INDEX IF NOT EXISTS idx_availability_interviewer ON interview_availability_slots(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_availability_date ON interview_availability_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_availability_booked ON interview_availability_slots(is_booked, is_available);

-- Scheduled interviews
CREATE TABLE IF NOT EXISTS scheduled_interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES interview_availability_slots(id),
    
    -- Interviewers
    interviewer_ids JSONB NOT NULL, -- [UUID, UUID] - multiple interviewers
    
    -- Schedule
    scheduled_date DATE NOT NULL,
    scheduled_start_time TIME NOT NULL,
    scheduled_end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    
    -- Meeting Details
    meeting_type VARCHAR(50) DEFAULT 'video',
    meeting_url VARCHAR(500),
    meeting_location VARCHAR(200),
    meeting_password VARCHAR(100),
    
    -- Status
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'confirmed', 'reminder_sent', 'in_progress', 
        'completed', 'no_show', 'cancelled', 'rescheduled'
    )),
    
    -- Confirmations
    candidate_confirmed BOOLEAN DEFAULT FALSE,
    candidate_confirmed_at TIMESTAMP,
    interviewer_confirmed BOOLEAN DEFAULT FALSE,
    interviewer_confirmed_at TIMESTAMP,
    
    -- Reminders
    reminder_24h_sent BOOLEAN DEFAULT FALSE,
    reminder_1h_sent BOOLEAN DEFAULT FALSE,
    
    -- Cancellation
    cancelled_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    
    -- Rescheduling
    rescheduled_from UUID REFERENCES scheduled_interviews(id),
    reschedule_count INTEGER DEFAULT 0,
    
    -- Notes
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scheduled_interview_application ON scheduled_interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interview_candidate ON scheduled_interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interview_date ON scheduled_interviews(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_interview_status ON scheduled_interviews(status);

-- ============================================================================
-- 5. AI INTERVIEW TRANSCRIPTION & ANALYSIS
-- ============================================================================

-- Interview recordings and transcripts
CREATE TABLE IF NOT EXISTS interview_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES scheduled_interviews(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    
    -- Recording
    recording_url VARCHAR(500),
    recording_duration_seconds INTEGER,
    recording_started_at TIMESTAMP,
    recording_ended_at TIMESTAMP,
    
    -- Transcription
    transcript TEXT,
    transcript_confidence DECIMAL(5,2),
    speaker_labels JSONB, -- [{"speaker": "Interviewer", "start": 0, "end": 30, "text": "..."}]
    
    -- AI Analysis
    ai_summary TEXT,
    key_topics JSONB, -- ["Technical skills", "Team collaboration", "Problem solving"]
    sentiment_analysis JSONB,
    
    -- Candidate Assessment
    technical_skills_mentioned JSONB,
    behavioral_traits JSONB,
    red_flags JSONB,
    positive_signals JSONB,
    
    -- Scoring
    overall_assessment_score INTEGER CHECK (overall_assessment_score >= 0 AND overall_assessment_score <= 100),
    technical_score INTEGER,
    communication_score INTEGER,
    culture_fit_score INTEGER,
    
    -- Report
    ai_report_url VARCHAR(500), -- PDF report
    
    processed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transcript_interview ON interview_transcripts(interview_id);
CREATE INDEX IF NOT EXISTS idx_transcript_candidate ON interview_transcripts(candidate_id);

-- ============================================================================
-- 6. AI JOB DESCRIPTION GENERATOR
-- ============================================================================

-- Job description generation requests
CREATE TABLE IF NOT EXISTS job_generation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES client_companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- Input Parameters
    job_title VARCHAR(200) NOT NULL,
    job_category VARCHAR(100),
    required_skills JSONB,
    experience_level VARCHAR(50),
    location VARCHAR(200),
    salary_range VARCHAR(100),
    
    -- Additional Context
    company_culture TEXT,
    special_requirements TEXT,
    benefits JSONB,
    
    -- AI Generation
    ai_provider VARCHAR(50) DEFAULT 'openai', -- 'openai', 'anthropic'
    ai_model VARCHAR(50),
    ai_prompt TEXT,
    
    -- Generated Content
    generated_title VARCHAR(200),
    generated_description TEXT,
    generated_responsibilities JSONB,
    generated_requirements JSONB,
    generated_qualifications JSONB,
    
    -- Quality Score
    generation_quality_score INTEGER,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed', 'edited')),
    
    -- User Feedback
    user_accepted BOOLEAN,
    user_edited BOOLEAN,
    user_feedback TEXT,
    
    -- Job Created
    job_id UUID REFERENCES jobs(id),
    
    generated_at TIMESTAMP,
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_gen_company ON job_generation_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_job_gen_status ON job_generation_requests(status);

-- ============================================================================
-- 7. AUTOMATED MESSAGING LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS automated_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Recipient
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    
    -- Message Details
    message_type VARCHAR(100) NOT NULL,
    template_id UUID REFERENCES message_templates(id),
    
    subject VARCHAR(300),
    body TEXT NOT NULL,
    
    -- Delivery
    delivery_method VARCHAR(50) DEFAULT 'email' CHECK (delivery_method IN ('email', 'sms', 'in_app')),
    recipient_email VARCHAR(200),
    recipient_phone VARCHAR(50),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced')),
    
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    failed_at TIMESTAMP,
    
    failure_reason TEXT,
    
    -- Tracking
    tracking_id VARCHAR(100) UNIQUE,
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    
    -- Response
    candidate_responded BOOLEAN DEFAULT FALSE,
    candidate_response TEXT,
    responded_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_automated_msg_candidate ON automated_messages(candidate_id);
CREATE INDEX IF NOT EXISTS idx_automated_msg_type ON automated_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_automated_msg_status ON automated_messages(status);
CREATE INDEX IF NOT EXISTS idx_automated_msg_tracking ON automated_messages(tracking_id);

-- ============================================================================
-- 8. AI AUTOMATION ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_automation_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL,
    company_id UUID REFERENCES client_companies(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    
    -- Screening Metrics
    applications_screened INTEGER DEFAULT 0,
    auto_rejections INTEGER DEFAULT 0,
    video_screening_invites INTEGER DEFAULT 0,
    fast_track_candidates INTEGER DEFAULT 0,
    
    -- Video Screening Metrics
    video_screenings_sent INTEGER DEFAULT 0,
    video_screenings_completed INTEGER DEFAULT 0,
    video_screening_completion_rate DECIMAL(5,2),
    avg_video_screening_score DECIMAL(5,2),
    
    -- Sourcing Metrics
    candidates_sourced INTEGER DEFAULT 0,
    sourcing_messages_sent INTEGER DEFAULT 0,
    sourcing_response_rate DECIMAL(5,2),
    sourcing_applications INTEGER DEFAULT 0,
    
    -- Interview Metrics
    interviews_scheduled INTEGER DEFAULT 0,
    interviews_completed INTEGER DEFAULT 0,
    no_show_rate DECIMAL(5,2),
    avg_time_to_schedule_hours DECIMAL(8,2),
    
    -- AI Performance
    ai_api_calls INTEGER DEFAULT 0,
    ai_api_cost_usd DECIMAL(10,2),
    avg_ai_processing_time_seconds DECIMAL(8,2),
    
    -- Time Savings
    estimated_hours_saved DECIMAL(8,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(metric_date, company_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_metrics_date ON ai_automation_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_metrics_company ON ai_automation_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_metrics_job ON ai_automation_metrics(job_id);

-- ============================================================================
-- 8.5 AI DECISION QUEUE (Semi-Auto Mode)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    
    decision_type VARCHAR(50) NOT NULL, -- 'auto_reject', 'send_video_screening', 'fast_track_interview', etc.
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'modified', 'executed'
    
    ai_reasoning TEXT,
    ai_confidence INTEGER,
    proposed_action JSONB, -- The actual data to use for the action
    modifications JSONB, -- If recruiter modified the action
    
    created_by_service VARCHAR(100),
    
    -- Reviewers and Status
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    
    executed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_decision_job ON ai_decisions(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_decision_status ON ai_decisions(status);
CREATE INDEX IF NOT EXISTS idx_ai_decision_type ON ai_decisions(decision_type);

CREATE TABLE IF NOT EXISTS ai_decision_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL REFERENCES ai_decisions(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_audit_decision ON ai_decision_audit_logs(decision_id);

-- ============================================================================
-- 9. AI PROVIDER CONFIGURATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_provider_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES client_companies(id) ON DELETE CASCADE,
    
    provider_name VARCHAR(100) NOT NULL, -- 'openai', 'anthropic', 'assemblyai', 'deepgram'
    service_type VARCHAR(100) NOT NULL, -- 'text_generation', 'transcription', 'analysis'
    
    -- API Credentials (encrypted)
    api_key_encrypted TEXT,
    api_endpoint VARCHAR(500),
    
    -- Configuration
    model_name VARCHAR(100),
    settings JSONB, -- Provider-specific settings
    
    -- Usage Limits
    monthly_limit_usd DECIMAL(10,2),
    current_month_usage_usd DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(company_id, provider_name, service_type)
);

CREATE INDEX IF NOT EXISTS idx_provider_company ON ai_provider_configs(company_id);
CREATE INDEX IF NOT EXISTS idx_provider_active ON ai_provider_configs(is_active);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- Add timestamps trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', t, t);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END;
$$ language 'plpgsql';
