-- ============================================================================
-- SA RECRUITMENT ATS - DATABASE SCHEMA
-- PostgreSQL 15+
-- Company: InfinityWork IT Solutions (Pty) Ltd
-- Version: 1.0
-- Date: 2026-01-21
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Agencies table (tenant root)
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    subscription_tier VARCHAR(50) NOT NULL CHECK (subscription_tier IN ('lite', 'standard', 'premium')),
    subscription_start_date DATE,
    subscription_end_date DATE,
    max_users INTEGER DEFAULT 5,
    max_jobs INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agencies_email ON agencies(email);
CREATE INDEX idx_agencies_is_active ON agencies(is_active);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'agency_admin', 'recruiter', 'viewer')),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_agency_id ON users(agency_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- User sessions table (for token blacklisting)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Client companies table
CREATE TABLE client_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    website VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_client_companies_agency_id ON client_companies(agency_id);
CREATE INDEX idx_client_companies_name ON client_companies(name);

-- Jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id),
    client_id UUID NOT NULL REFERENCES client_companies(id),
    title VARCHAR(255) NOT NULL,
    reference_number VARCHAR(100) UNIQUE,
    description TEXT,
    requirements TEXT,
    location VARCHAR(255),
    salary_min DECIMAL(12,2),
    salary_max DECIMAL(12,2),
    salary_currency VARCHAR(10) DEFAULT 'ZAR',
    employment_type VARCHAR(50) CHECK (employment_type IN ('permanent', 'contract', 'temporary', 'internship')),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'on_hold', 'filled', 'closed', 'cancelled')),
    required_skills TEXT[],
    required_experience_years INTEGER,
    required_education_level VARCHAR(100),
    posted_date DATE,
    closing_date DATE,
    filled_date DATE,
    filled_candidate_id UUID,
    is_remote BOOLEAN DEFAULT false,
    is_urgent BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_agency_id ON jobs(agency_id);
CREATE INDEX idx_jobs_client_id ON jobs(client_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_posted_date ON jobs(posted_date);
CREATE INDEX idx_jobs_required_skills ON jobs USING GIN(required_skills);
CREATE INDEX idx_jobs_reference_number ON jobs(reference_number);
CREATE INDEX idx_jobs_search ON jobs USING GIN(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '')));

-- Candidates table
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    alternate_phone VARCHAR(50),
    location VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(100),
    current_job_title VARCHAR(255),
    current_company VARCHAR(255),
    years_of_experience INTEGER,
    highest_qualification VARCHAR(255),
    skills TEXT[],
    resume_file_url VARCHAR(500),
    resume_file_key VARCHAR(500),
    resume_parsed_text TEXT,
    resume_parsed_at TIMESTAMPTZ,
    linkedin_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'placed', 'blacklisted', 'archived')),
    source VARCHAR(100),
    willing_to_relocate BOOLEAN DEFAULT false,
    notice_period_days INTEGER,
    expected_salary_min DECIMAL(12,2),
    expected_salary_max DECIMAL(12,2),
    salary_currency VARCHAR(10) DEFAULT 'ZAR',
    availability_date DATE,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agency_id, email)
);

CREATE INDEX idx_candidates_agency_id ON candidates(agency_id);
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_skills ON candidates USING GIN(skills);
CREATE INDEX idx_candidates_location ON candidates(location);
CREATE INDEX idx_candidates_search ON candidates USING GIN(to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' || COALESCE(resume_parsed_text, '')));

-- Candidate education
CREATE TABLE candidate_education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    institution VARCHAR(255),
    qualification VARCHAR(255),
    field_of_study VARCHAR(255),
    qualification_level VARCHAR(100),
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT false,
    grade_percentage DECIMAL(5,2),
    achievements TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_candidate_education_candidate_id ON candidate_education(candidate_id);

-- Candidate experience
CREATE TABLE candidate_experience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    company VARCHAR(255),
    job_title VARCHAR(255),
    location VARCHAR(255),
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT false,
    description TEXT,
    achievements TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_candidate_experience_candidate_id ON candidate_experience(candidate_id);

-- Applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'screening', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'accepted', 'rejected', 'withdrawn', 'hired')),
    match_score DECIMAL(5,2),
    match_explanation JSONB,
    applied_date DATE DEFAULT CURRENT_DATE,
    last_status_change TIMESTAMPTZ DEFAULT NOW(),
    interview_date TIMESTAMPTZ,
    interview_location VARCHAR(255),
    interview_type VARCHAR(50),
    offer_amount DECIMAL(12,2),
    offer_currency VARCHAR(10) DEFAULT 'ZAR',
    offer_date DATE,
    offer_expiry_date DATE,
    start_date DATE,
    rejection_reason TEXT,
    recruiter_notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_id, candidate_id)
);

CREATE INDEX idx_applications_agency_id ON applications(agency_id);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_applied_date ON applications(applied_date);

-- Application status history
CREATE TABLE application_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_application_status_history_application_id ON application_status_history(application_id);

-- POPIA: Consent records
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL CHECK (consent_type IN ('data_processing', 'marketing', 'third_party_sharing', 'ee_data_collection')),
    consent_version VARCHAR(50),
    is_granted BOOLEAN NOT NULL,
    consent_method VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    granted_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consent_records_candidate_id ON consent_records(candidate_id);

-- POPIA: Data Subject Access Requests
CREATE TABLE data_subject_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES candidates(id),
    request_type VARCHAR(100) NOT NULL CHECK (request_type IN ('access', 'rectification', 'erasure', 'portability', 'restriction')),
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'processing', 'completed', 'rejected')),
    verification_token VARCHAR(255),
    verification_expires_at TIMESTAMPTZ,
    data_export_url VARCHAR(500),
    export_expires_at TIMESTAMPTZ,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    notes TEXT
);

CREATE INDEX idx_dsar_candidate_id ON data_subject_requests(candidate_id);
CREATE INDEX idx_dsar_email ON data_subject_requests(email);

-- POPIA: Audit logs (partitioned)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_audit_logs_agency_id ON audit_logs(agency_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Create 2026 partitions
CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE audit_logs_2026_02 PARTITION OF audit_logs FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE audit_logs_2026_03 PARTITION OF audit_logs FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE audit_logs_2026_04 PARTITION OF audit_logs FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE audit_logs_2026_05 PARTITION OF audit_logs FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE audit_logs_2026_06 PARTITION OF audit_logs FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE audit_logs_2026_07 PARTITION OF audit_logs FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE audit_logs_2026_08 PARTITION OF audit_logs FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE audit_logs_2026_09 PARTITION OF audit_logs FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE audit_logs_2026_10 PARTITION OF audit_logs FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE audit_logs_2026_11 PARTITION OF audit_logs FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE audit_logs_2026_12 PARTITION OF audit_logs FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- Employment Equity data
CREATE TABLE ee_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    race VARCHAR(50) CHECK (race IN ('african', 'coloured', 'indian', 'white', 'other')),
    gender VARCHAR(50) CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say')),
    disability BOOLEAN,
    age_group VARCHAR(50) CHECK (age_group IN ('<35', '35-55', '>55')),
    is_sa_citizen BOOLEAN,
    consent_provided BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(candidate_id)
);

CREATE INDEX idx_ee_data_candidate_id ON ee_data(candidate_id);

-- Email templates
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    template_type VARCHAR(100),
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_templates_agency_id ON email_templates(agency_id);

-- Email logs
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id),
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(500),
    body TEXT,
    template_id UUID REFERENCES email_templates(id),
    status VARCHAR(50) NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
    sendgrid_message_id VARCHAR(255),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    bounce_reason TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_logs_agency_id ON email_logs(agency_id);
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient_email);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_companies_updated_at BEFORE UPDATE ON client_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for application status history
CREATE OR REPLACE FUNCTION log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO application_status_history (application_id, from_status, to_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, NEW.created_by);
        NEW.last_status_change = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_application_status BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION log_application_status_change();

-- Views
CREATE OR REPLACE VIEW active_jobs_summary AS
SELECT 
    j.id, j.title, j.reference_number, c.name AS client_name, j.location, j.posted_date, j.closing_date,
    COUNT(DISTINCT a.id) AS total_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'new' THEN a.id END) AS new_count,
    COUNT(DISTINCT CASE WHEN a.status = 'shortlisted' THEN a.id END) AS shortlisted_count,
    COUNT(DISTINCT CASE WHEN a.status = 'interviewed' THEN a.id END) AS interviewed_count
FROM jobs j
LEFT JOIN client_companies c ON j.client_id = c.id
LEFT JOIN applications a ON j.id = a.job_id
WHERE j.status = 'active'
GROUP BY j.id, j.title, j.reference_number, c.name, j.location, j.posted_date, j.closing_date;
