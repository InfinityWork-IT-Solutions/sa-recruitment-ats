-- ============================================================================
-- SUBSCRIPTION & BILLING SCHEMA - PAYFAST INTEGRATION
-- ============================================================================
--
-- This schema handles:
-- - Subscription plans (Starter, Professional, Enterprise)
-- - Recruiter subscriptions
-- - Seat management
-- - PayFast payment processing
-- - Billing history
-- - Invoices
-- - Feature usage tracking
--
-- ============================================================================

-- ============================================================================
-- TABLE 1: SUBSCRIPTION PLANS
-- ============================================================================

CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Plan details
    name VARCHAR(50) NOT NULL UNIQUE,  -- 'starter', 'professional', 'enterprise'
    display_name VARCHAR(100) NOT NULL,  -- 'Starter', 'Professional', 'Enterprise'
    description TEXT,
    
    -- Pricing (in South African Rand)
    price_monthly DECIMAL(10,2) NOT NULL,  -- e.g., 2500.00
    price_annual DECIMAL(10,2),  -- Annual discount (e.g., 25000.00 = ~17% off)
    
    -- Features & limits
    seats_included INTEGER NOT NULL DEFAULT 1,  -- Number of recruiter seats
    max_searches_per_month INTEGER,  -- NULL = unlimited
    video_screening_enabled BOOLEAN DEFAULT false,
    ai_matching_enabled BOOLEAN DEFAULT false,
    advanced_analytics_enabled BOOLEAN DEFAULT false,
    api_access_enabled BOOLEAN DEFAULT false,
    white_label_enabled BOOLEAN DEFAULT false,
    priority_support BOOLEAN DEFAULT false,
    
    -- Trial
    trial_days INTEGER DEFAULT 14,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,  -- For sorting on pricing page
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default plans
INSERT INTO subscription_plans (
    name, display_name, description, 
    price_monthly, price_annual,
    seats_included, max_searches_per_month,
    video_screening_enabled, ai_matching_enabled, 
    advanced_analytics_enabled, api_access_enabled,
    white_label_enabled, priority_support,
    display_order
) VALUES
-- STARTER PLAN
(
    'starter', 
    'Starter', 
    'Perfect for independent recruiters getting started',
    2500.00,   -- R2,500/month
    25000.00,  -- R25,000/year (~17% discount)
    1,         -- 1 seat
    50,        -- 50 searches/month
    false,     -- No video screening
    true,      -- Basic AI matching
    false,     -- No advanced analytics
    false,     -- No API access
    false,     -- No white-label
    false,     -- Email support only
    1
),
-- PROFESSIONAL PLAN (MOST POPULAR)
(
    'professional',
    'Professional',
    'Best for growing recruitment agencies',
    7500.00,   -- R7,500/month
    75000.00,  -- R75,000/year (~17% discount)
    3,         -- 3 seats
    NULL,      -- Unlimited searches
    true,      -- Video screening included
    true,      -- AI matching
    true,      -- Advanced analytics
    false,     -- No API access
    false,     -- No white-label
    true,      -- Priority support
    2
),
-- ENTERPRISE PLAN
(
    'enterprise',
    'Enterprise',
    'For large agencies with custom needs',
    0.00,      -- Custom pricing
    0.00,      -- Custom pricing
    999,       -- Unlimited seats (or set high number)
    NULL,      -- Unlimited searches
    true,      -- Everything enabled
    true,
    true,
    true,      -- API access
    true,      -- White-label option
    true,      -- Dedicated support
    3
);


-- ============================================================================
-- TABLE 2: RECRUITER SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE recruiter_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_agency_id UUID REFERENCES recruiter_agencies(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    
    -- Subscription details
    status VARCHAR(50) NOT NULL DEFAULT 'trialing',
    -- Status values: 'trialing', 'active', 'past_due', 'canceled', 'paused'
    
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',  -- 'monthly' or 'annual'
    
    -- Dates
    trial_start_date TIMESTAMP,
    trial_end_date TIMESTAMP,
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    canceled_at TIMESTAMP,
    ended_at TIMESTAMP,
    
    -- Seat management
    seats_allocated INTEGER NOT NULL DEFAULT 1,
    seats_used INTEGER NOT NULL DEFAULT 1,
    
    -- Usage tracking
    searches_used_this_month INTEGER DEFAULT 0,
    searches_reset_date TIMESTAMP,
    
    -- PayFast details
    payfast_subscription_token VARCHAR(255) UNIQUE,  -- PayFast subscription token
    payfast_payment_id VARCHAR(255),
    
    -- Pricing snapshot (in case plan changes)
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ZAR',
    
    -- Auto-renewal
    auto_renew BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_agency ON recruiter_subscriptions(recruiter_agency_id);
CREATE INDEX idx_subscriptions_status ON recruiter_subscriptions(status);
CREATE INDEX idx_subscriptions_payfast_token ON recruiter_subscriptions(payfast_subscription_token);


-- ============================================================================
-- TABLE 3: PAYMENT TRANSACTIONS
-- ============================================================================

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES recruiter_subscriptions(id),
    recruiter_agency_id UUID REFERENCES recruiter_agencies(id),
    
    -- Transaction details
    transaction_type VARCHAR(50) NOT NULL,  -- 'subscription', 'upgrade', 'downgrade', 'refund'
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ZAR',
    
    -- PayFast details
    payfast_payment_id VARCHAR(255) UNIQUE,
    payfast_transaction_id VARCHAR(255),
    payment_status VARCHAR(50) NOT NULL,  -- 'pending', 'complete', 'failed', 'refunded'
    payment_method VARCHAR(50),  -- 'eft', 'credit_card', 'debit_card', etc.
    
    -- Billing details
    description TEXT,
    invoice_number VARCHAR(50) UNIQUE,
    
    -- Metadata from PayFast
    payfast_data JSONB,  -- Full PayFast ITN/webhook data
    
    -- Dates
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_subscription ON payment_transactions(subscription_id);
CREATE INDEX idx_transactions_agency ON payment_transactions(recruiter_agency_id);
CREATE INDEX idx_transactions_status ON payment_transactions(payment_status);
CREATE INDEX idx_transactions_payfast_id ON payment_transactions(payfast_payment_id);


-- ============================================================================
-- TABLE 4: INVOICES
-- ============================================================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES recruiter_subscriptions(id),
    recruiter_agency_id UUID REFERENCES recruiter_agencies(id),
    transaction_id UUID REFERENCES payment_transactions(id),
    
    -- Invoice details
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',  -- 'draft', 'sent', 'paid', 'overdue', 'void'
    
    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 15.00,  -- South African VAT is 15%
    tax_amount DECIMAL(10,2),
    total DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'ZAR',
    
    -- Line items
    line_items JSONB NOT NULL,
    /* Example:
    [
        {
            "description": "Professional Plan - Monthly",
            "quantity": 1,
            "unit_price": 7500.00,
            "amount": 7500.00
        },
        {
            "description": "Additional Seat",
            "quantity": 2,
            "unit_price": 1000.00,
            "amount": 2000.00
        }
    ]
    */
    
    -- Dates
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    
    -- PDF
    pdf_url TEXT,  -- S3 URL to PDF invoice
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX idx_invoices_agency ON invoices(recruiter_agency_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);


-- ============================================================================
-- TABLE 5: SEAT ASSIGNMENTS
-- ============================================================================

CREATE TABLE recruiter_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES recruiter_subscriptions(id) ON DELETE CASCADE,
    recruiter_agency_id UUID REFERENCES recruiter_agencies(id),
    user_id UUID REFERENCES users(id),  -- The recruiter user
    
    -- Seat details
    role VARCHAR(50) DEFAULT 'recruiter',  -- 'owner', 'admin', 'recruiter'
    is_active BOOLEAN DEFAULT true,
    
    -- Dates
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deactivated_at TIMESTAMP
);

CREATE INDEX idx_seats_subscription ON recruiter_seats(subscription_id);
CREATE INDEX idx_seats_user ON recruiter_seats(user_id);


-- ============================================================================
-- TABLE 6: FEATURE USAGE TRACKING
-- ============================================================================

CREATE TABLE feature_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES recruiter_subscriptions(id),
    recruiter_agency_id UUID REFERENCES recruiter_agencies(id),
    user_id UUID REFERENCES users(id),
    
    -- Usage details
    feature_name VARCHAR(100) NOT NULL,  -- 'candidate_search', 'video_screening', 'ai_matching', etc.
    usage_count INTEGER DEFAULT 1,
    
    -- Metadata
    metadata JSONB,  -- Additional context
    
    -- Date tracking (monthly reset)
    usage_month DATE NOT NULL,  -- e.g., '2026-04-01' for April 2026
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usage_subscription ON feature_usage(subscription_id);
CREATE INDEX idx_usage_month ON feature_usage(usage_month);
CREATE INDEX idx_usage_feature ON feature_usage(feature_name);


-- ============================================================================
-- TABLE 7: PAYFAST WEBHOOKS LOG
-- ============================================================================

CREATE TABLE payfast_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Webhook details
    event_type VARCHAR(100),  -- 'subscription_created', 'payment_complete', etc.
    payment_id VARCHAR(255),
    subscription_token VARCHAR(255),
    
    -- Full payload
    payload JSONB NOT NULL,
    
    -- Processing
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP,
    error_message TEXT,
    
    -- Security
    signature_valid BOOLEAN,
    ip_address VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhooks_payment_id ON payfast_webhooks(payment_id);
CREATE INDEX idx_webhooks_processed ON payfast_webhooks(processed);


-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Auto-reset monthly search count
CREATE OR REPLACE FUNCTION reset_monthly_searches()
RETURNS void AS $$
BEGIN
    UPDATE recruiter_subscriptions
    SET 
        searches_used_this_month = 0,
        searches_reset_date = CURRENT_DATE
    WHERE 
        searches_reset_date <= CURRENT_DATE - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql;

-- Run daily via cron job


-- Function: Check if subscription is active
CREATE OR REPLACE FUNCTION is_subscription_active(subscription_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    sub_status VARCHAR;
    period_end TIMESTAMP;
BEGIN
    SELECT status, current_period_end 
    INTO sub_status, period_end
    FROM recruiter_subscriptions
    WHERE id = subscription_id;
    
    RETURN (sub_status IN ('active', 'trialing') AND period_end > CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;


-- Function: Check feature access
CREATE OR REPLACE FUNCTION has_feature_access(
    p_subscription_id UUID,
    p_feature_name VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_plan_id UUID;
    v_has_access BOOLEAN;
BEGIN
    -- Get plan
    SELECT plan_id INTO v_plan_id
    FROM recruiter_subscriptions
    WHERE id = p_subscription_id;
    
    -- Check feature based on plan
    CASE p_feature_name
        WHEN 'video_screening' THEN
            SELECT video_screening_enabled INTO v_has_access
            FROM subscription_plans WHERE id = v_plan_id;
        WHEN 'ai_matching' THEN
            SELECT ai_matching_enabled INTO v_has_access
            FROM subscription_plans WHERE id = v_plan_id;
        WHEN 'advanced_analytics' THEN
            SELECT advanced_analytics_enabled INTO v_has_access
            FROM subscription_plans WHERE id = v_plan_id;
        WHEN 'api_access' THEN
            SELECT api_access_enabled INTO v_has_access
            FROM subscription_plans WHERE id = v_plan_id;
        ELSE
            v_has_access := false;
    END CASE;
    
    RETURN v_has_access;
END;
$$ LANGUAGE plpgsql;


-- Trigger: Update seats_used count
CREATE OR REPLACE FUNCTION update_seats_used()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE recruiter_subscriptions
    SET seats_used = (
        SELECT COUNT(*) 
        FROM recruiter_seats 
        WHERE subscription_id = NEW.subscription_id 
        AND is_active = true
    )
    WHERE id = NEW.subscription_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_seats_used
AFTER INSERT OR UPDATE ON recruiter_seats
FOR EACH ROW
EXECUTE FUNCTION update_seats_used();


-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- View: Active Subscriptions Summary
CREATE OR REPLACE VIEW active_subscriptions_summary AS
SELECT 
    rs.id,
    ra.agency_name,
    sp.display_name AS plan_name,
    rs.status,
    rs.billing_cycle,
    rs.amount,
    rs.seats_allocated,
    rs.seats_used,
    rs.current_period_end,
    rs.trial_end_date
FROM recruiter_subscriptions rs
JOIN recruiter_agencies ra ON rs.recruiter_agency_id = ra.id
JOIN subscription_plans sp ON rs.plan_id = sp.id
WHERE rs.status IN ('active', 'trialing');


-- View: Monthly Recurring Revenue (MRR)
CREATE OR REPLACE VIEW monthly_recurring_revenue AS
SELECT 
    sp.display_name AS plan,
    COUNT(rs.id) AS active_subscriptions,
    SUM(CASE 
        WHEN rs.billing_cycle = 'monthly' THEN rs.amount
        WHEN rs.billing_cycle = 'annual' THEN rs.amount / 12
    END) AS mrr
FROM recruiter_subscriptions rs
JOIN subscription_plans sp ON rs.plan_id = sp.id
WHERE rs.status IN ('active', 'trialing')
GROUP BY sp.display_name;


-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Create test subscription (trialing)
-- INSERT INTO recruiter_subscriptions (...)
-- VALUES (...);


-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- Run this migration:
-- psql -U postgres -d recruitpro_db -f 004_subscription_billing_schema.sql
