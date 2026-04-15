-- Usage Limits & Tracking Schema for RecruitPro SA
-- Protects against AI cost overruns

-- 1. Subscription plan limits configuration
CREATE TABLE subscription_plan_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name VARCHAR(50) NOT NULL UNIQUE, -- 'starter', 'professional', 'enterprise', 'free'
    
    -- CV Parsing Limits
    cv_parses_per_month INTEGER NOT NULL DEFAULT 0,
    
    -- AI Matching Limits
    ai_match_calculations_per_month INTEGER NOT NULL DEFAULT 0,
    ai_search_queries_per_month INTEGER NOT NULL DEFAULT 0,
    
    -- Optional Limits (set to -1 for unlimited)
    candidate_recommendations_per_month INTEGER DEFAULT -1,
    job_recommendations_per_month INTEGER DEFAULT -1,
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert default limits
INSERT INTO subscription_plan_limits (plan_name, cv_parses_per_month, ai_match_calculations_per_month, ai_search_queries_per_month) VALUES
('free', 1, 100, 50),              -- Candidates: 1 CV parse, 100 matches, 50 searches
('starter', 50, 500, 200),         -- R499: 50 CVs, 500 matches, 200 searches
('professional', 250, 2000, 1000), -- R1,499: 250 CVs, 2000 matches, 1000 searches
('enterprise', 1000, 10000, 5000); -- R4,999: 1000 CVs, 10000 matches, 5000 searches

-- 2. Company usage tracking (resets monthly)
CREATE TABLE company_usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Current billing period
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    
    -- Usage counters
    cv_parses_used INTEGER NOT NULL DEFAULT 0,
    ai_match_calculations_used INTEGER NOT NULL DEFAULT 0,
    ai_search_queries_used INTEGER NOT NULL DEFAULT 0,
    candidate_recommendations_used INTEGER NOT NULL DEFAULT 0,
    job_recommendations_used INTEGER NOT NULL DEFAULT 0,
    
    -- Cost tracking (for analytics)
    estimated_ai_cost_zar DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Ensure one record per company per billing period
    UNIQUE(company_id, billing_period_start)
);

CREATE INDEX idx_company_usage_company ON company_usage_tracking(company_id);
CREATE INDEX idx_company_usage_period ON company_usage_tracking(billing_period_start, billing_period_end);

-- 3. Candidate usage tracking (for free tier)
CREATE TABLE candidate_usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    
    -- Monthly period (resets each month)
    month_start DATE NOT NULL,
    month_end DATE NOT NULL,
    
    -- Usage counters
    cv_parses_used INTEGER NOT NULL DEFAULT 0,
    ai_search_queries_used INTEGER NOT NULL DEFAULT 0,
    job_recommendations_used INTEGER NOT NULL DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(candidate_id, month_start)
);

CREATE INDEX idx_candidate_usage_candidate ON candidate_usage_tracking(candidate_id);

-- 4. Detailed usage logs (for debugging and analytics)
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User identification
    user_id UUID NOT NULL REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    candidate_id UUID REFERENCES candidates(id),
    
    -- Usage type
    usage_type VARCHAR(50) NOT NULL, -- 'cv_parse', 'ai_match', 'ai_search', etc.
    
    -- Details
    resource_id UUID, -- e.g., CV ID, Job ID, Candidate ID
    tokens_used INTEGER, -- Actual AI tokens consumed
    estimated_cost_zar DECIMAL(10, 4), -- Cost in ZAR
    
    -- Result
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_logs_user ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_company ON usage_logs(company_id);
CREATE INDEX idx_usage_logs_type ON usage_logs(usage_type);
CREATE INDEX idx_usage_logs_date ON usage_logs(created_at);

-- 5. Usage alerts (notify when approaching limits)
CREATE TABLE usage_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    alert_type VARCHAR(50) NOT NULL, -- 'cv_parse_80', 'cv_parse_100', 'ai_match_80', etc.
    threshold_percentage INTEGER NOT NULL, -- 80, 90, 100
    
    triggered_at TIMESTAMP NOT NULL DEFAULT NOW(),
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_alerts_company ON usage_alerts(company_id);

-- 6. Helper function: Get current usage for a company
CREATE OR REPLACE FUNCTION get_company_current_usage(p_company_id UUID)
RETURNS TABLE (
    plan_name VARCHAR,
    cv_parses_limit INTEGER,
    cv_parses_used INTEGER,
    cv_parses_remaining INTEGER,
    cv_parses_percentage INTEGER,
    ai_match_limit INTEGER,
    ai_match_used INTEGER,
    ai_match_remaining INTEGER,
    billing_period_start DATE,
    billing_period_end DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.subscription_plan::VARCHAR AS plan_name,
        spl.cv_parses_per_month AS cv_parses_limit,
        COALESCE(cut.cv_parses_used, 0) AS cv_parses_used,
        (spl.cv_parses_per_month - COALESCE(cut.cv_parses_used, 0)) AS cv_parses_remaining,
        CASE 
            WHEN spl.cv_parses_per_month > 0 THEN 
                ROUND((COALESCE(cut.cv_parses_used, 0)::DECIMAL / spl.cv_parses_per_month) * 100)::INTEGER
            ELSE 0
        END AS cv_parses_percentage,
        spl.ai_match_calculations_per_month AS ai_match_limit,
        COALESCE(cut.ai_match_calculations_used, 0) AS ai_match_used,
        (spl.ai_match_calculations_per_month - COALESCE(cut.ai_match_calculations_used, 0)) AS ai_match_remaining,
        cut.billing_period_start,
        cut.billing_period_end
    FROM companies c
    LEFT JOIN subscription_plan_limits spl ON spl.plan_name = c.subscription_plan
    LEFT JOIN company_usage_tracking cut ON cut.company_id = c.id 
        AND cut.billing_period_start <= CURRENT_DATE 
        AND cut.billing_period_end >= CURRENT_DATE
    WHERE c.id = p_company_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Helper function: Check if usage allowed
CREATE OR REPLACE FUNCTION check_usage_allowed(
    p_company_id UUID,
    p_usage_type VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_limit INTEGER;
    v_used INTEGER;
BEGIN
    -- Get limit and current usage
    IF p_usage_type = 'cv_parse' THEN
        SELECT spl.cv_parses_per_month, COALESCE(cut.cv_parses_used, 0)
        INTO v_limit, v_used
        FROM companies c
        LEFT JOIN subscription_plan_limits spl ON spl.plan_name = c.subscription_plan
        LEFT JOIN company_usage_tracking cut ON cut.company_id = c.id 
            AND cut.billing_period_start <= CURRENT_DATE 
            AND cut.billing_period_end >= CURRENT_DATE
        WHERE c.id = p_company_id;
    ELSIF p_usage_type = 'ai_match' THEN
        SELECT spl.ai_match_calculations_per_month, COALESCE(cut.ai_match_calculations_used, 0)
        INTO v_limit, v_used
        FROM companies c
        LEFT JOIN subscription_plan_limits spl ON spl.plan_name = c.subscription_plan
        LEFT JOIN company_usage_tracking cut ON cut.company_id = c.id 
            AND cut.billing_period_start <= CURRENT_DATE 
            AND cut.billing_period_end >= CURRENT_DATE
        WHERE c.id = p_company_id;
    ELSIF p_usage_type = 'ai_search' THEN
        SELECT spl.ai_search_queries_per_month, COALESCE(cut.ai_search_queries_used, 0)
        INTO v_limit, v_used
        FROM companies c
        LEFT JOIN subscription_plan_limits spl ON spl.plan_name = c.subscription_plan
        LEFT JOIN company_usage_tracking cut ON cut.company_id = c.id 
            AND cut.billing_period_start <= CURRENT_DATE 
            AND cut.billing_period_end >= CURRENT_DATE
        WHERE c.id = p_company_id;
    END IF;
    
    -- Check if under limit (-1 means unlimited)
    RETURN (v_limit = -1) OR (v_used < v_limit);
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger: Auto-create usage tracking record on company creation
CREATE OR REPLACE FUNCTION create_company_usage_tracking()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO company_usage_tracking (
        company_id,
        billing_period_start,
        billing_period_end
    ) VALUES (
        NEW.id,
        DATE_TRUNC('month', CURRENT_DATE)::DATE,
        (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_company_usage_tracking
AFTER INSERT ON companies
FOR EACH ROW
EXECUTE FUNCTION create_company_usage_tracking();

-- 9. Monthly reset job (run via cron or scheduled task)
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
    -- Archive old usage to history table (optional)
    -- INSERT INTO company_usage_tracking_history SELECT * FROM company_usage_tracking WHERE billing_period_end < CURRENT_DATE;
    
    -- Delete old usage records
    DELETE FROM company_usage_tracking WHERE billing_period_end < CURRENT_DATE;
    
    -- Create new usage records for active companies
    INSERT INTO company_usage_tracking (company_id, billing_period_start, billing_period_end)
    SELECT 
        c.id,
        DATE_TRUNC('month', CURRENT_DATE)::DATE,
        (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE
    FROM companies c
    WHERE c.subscription_status = 'active'
    ON CONFLICT (company_id, billing_period_start) DO NOTHING;
    
    -- Same for candidates
    DELETE FROM candidate_usage_tracking WHERE month_end < CURRENT_DATE;
    
    INSERT INTO candidate_usage_tracking (candidate_id, month_start, month_end)
    SELECT 
        c.id,
        DATE_TRUNC('month', CURRENT_DATE)::DATE,
        (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE
    FROM candidates c
    ON CONFLICT (candidate_id, month_start) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Run this function monthly via cron:
-- 0 0 1 * * psql -U postgres -d recruitpro -c "SELECT reset_monthly_usage();"

COMMENT ON TABLE subscription_plan_limits IS 'Defines usage limits for each subscription tier';
COMMENT ON TABLE company_usage_tracking IS 'Tracks monthly AI usage per company to enforce limits';
COMMENT ON TABLE candidate_usage_tracking IS 'Tracks monthly AI usage per candidate (free tier)';
COMMENT ON TABLE usage_logs IS 'Detailed log of every AI operation for debugging and cost analysis';
COMMENT ON TABLE usage_alerts IS 'Alerts when companies approach usage limits';
