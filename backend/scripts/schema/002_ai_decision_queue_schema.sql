-- ============================================================================
-- AI DECISION QUEUE SCHEMA (For Semi-Auto Mode)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- What this decision is about
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    
    -- Decision details
    decision_type VARCHAR(50) NOT NULL CHECK (decision_type IN (
        'auto_reject',
        'send_video_screening',
        'fast_track_interview',
        'schedule_interview',
        'send_outreach'
    )),
    
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'approved',
        'rejected',
        'modified'
    )),
    
    -- AI reasoning
    ai_reasoning TEXT NOT NULL,
    ai_confidence INTEGER CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
    
    -- Proposed action (JSON)
    proposed_action JSONB NOT NULL,
    -- Example: {
    --   "action": "reject",
    --   "candidate_name": "John Doe",
    --   "reason": "Match score 65% - missing Python, Django",
    --   "details": {
    --     "match_score": 65,
    --     "missing_skills": ["Python", "Django"],
    --     "strengths": ["Leadership", "Communication"]
    --   }
    -- }
    
    -- Approval tracking
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    modifications JSONB,
    
    -- Execution tracking
    executed_at TIMESTAMP,
    execution_status VARCHAR(20),
    execution_error TEXT,
    
    -- Metadata
    created_by_service VARCHAR(100), -- 'automated_screening', 'video_screening', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_decisions_job (job_id),
    INDEX idx_decisions_status (status),
    INDEX idx_decisions_type (decision_type),
    INDEX idx_decisions_created (created_at DESC)
);

-- ============================================================================
-- DECISION AUDIT LOG (Track all changes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_decision_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL REFERENCES ai_decisions(id) ON DELETE CASCADE,
    
    -- What changed
    action VARCHAR(50) NOT NULL, -- 'created', 'approved', 'rejected', 'modified', 'executed'
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    
    -- Who made the change
    changed_by UUID REFERENCES users(id),
    change_reason TEXT,
    
    -- Changes made (if modified)
    changes JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_audit_decision (decision_id),
    INDEX idx_audit_created (created_at DESC)
);

-- ============================================================================
-- DECISION STATISTICS (For analytics dashboard)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_decision_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time period
    stat_date DATE NOT NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Counts by decision type
    auto_reject_count INTEGER DEFAULT 0,
    video_screening_count INTEGER DEFAULT 0,
    fast_track_count INTEGER DEFAULT 0,
    schedule_interview_count INTEGER DEFAULT 0,
    outreach_count INTEGER DEFAULT 0,
    
    -- Approval metrics
    total_decisions INTEGER DEFAULT 0,
    approved_count INTEGER DEFAULT 0,
    rejected_count INTEGER DEFAULT 0,
    modified_count INTEGER DEFAULT 0,
    pending_count INTEGER DEFAULT 0,
    
    -- Performance metrics
    approval_rate DECIMAL(5,2), -- Percentage
    avg_time_to_approval_minutes INTEGER,
    time_saved_hours DECIMAL(8,2),
    
    -- AI accuracy
    ai_accuracy_rate DECIMAL(5,2), -- approved / (approved + rejected)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(stat_date, job_id, company_id)
);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to log decision changes
CREATE OR REPLACE FUNCTION log_decision_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Only log if status changed
        IF OLD.status != NEW.status THEN
            INSERT INTO ai_decision_audit_log (
                decision_id,
                action,
                previous_status,
                new_status,
                changed_by
            ) VALUES (
                NEW.id,
                CASE
                    WHEN NEW.status = 'approved' THEN 'approved'
                    WHEN NEW.status = 'rejected' THEN 'rejected'
                    WHEN NEW.status = 'modified' THEN 'modified'
                    ELSE 'updated'
                END,
                OLD.status,
                NEW.status,
                NEW.approved_by
            );
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO ai_decision_audit_log (
            decision_id,
            action,
            new_status
        ) VALUES (
            NEW.id,
            'created',
            NEW.status
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS ai_decision_change_trigger ON ai_decisions;
CREATE TRIGGER ai_decision_change_trigger
    AFTER INSERT OR UPDATE ON ai_decisions
    FOR EACH ROW
    EXECUTE FUNCTION log_decision_change();

-- ============================================================================
-- VIEWS FOR DASHBOARD
-- ============================================================================

-- Pending decisions summary view
CREATE OR REPLACE VIEW pending_decisions_summary AS
SELECT 
    job_id,
    decision_type,
    COUNT(*) as count,
    AVG(ai_confidence) as avg_confidence,
    MIN(created_at) as oldest_decision,
    MAX(created_at) as newest_decision
FROM ai_decisions
WHERE status = 'pending'
GROUP BY job_id, decision_type;

-- Daily decision stats view
CREATE OR REPLACE VIEW daily_decision_stats AS
SELECT 
    DATE(created_at) as decision_date,
    job_id,
    COUNT(*) as total_decisions,
    COUNT(*) FILTER (WHERE status = 'approved') as approved,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
    COUNT(*) FILTER (WHERE status = 'modified') as modified,
    COUNT(*) FILTER (WHERE status = 'pending') as pending,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'approved')::numeric / 
        NULLIF(COUNT(*), 0) * 100, 
        2
    ) as approval_rate
FROM ai_decisions
GROUP BY DATE(created_at), job_id;

-- ============================================================================
-- SAMPLE DATA (For Testing)
-- ============================================================================

-- Example decision (commented out - uncomment for testing)
/*
INSERT INTO ai_decisions (
    job_id,
    application_id,
    candidate_id,
    decision_type,
    status,
    ai_reasoning,
    ai_confidence,
    proposed_action,
    created_by_service
) VALUES (
    'some-job-uuid',
    'some-application-uuid',
    'some-candidate-uuid',
    'auto_reject',
    'pending',
    'Candidate scored 65% overall. Missing critical skills: Python, Django. Experience below minimum requirement (2 years vs 5 required).',
    85,
    '{
        "action": "reject",
        "candidate_name": "John Doe",
        "candidate_email": "john@example.com",
        "reason": "After careful review, we have decided to move forward with candidates whose experience more closely matches our requirements.",
        "details": {
            "match_score": 65,
            "skills_score": 40,
            "experience_score": 50,
            "missing_skills": ["Python", "Django", "AWS"],
            "strengths": ["Leadership", "Communication"],
            "years_experience": 2,
            "required_experience": 5
        }
    }',
    'automated_screening'
);
*/
