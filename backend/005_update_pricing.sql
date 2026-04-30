CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Plan details
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Pricing (in South African Rand) - UPDATED!
    price_monthly DECIMAL(10,2) NOT NULL,
    price_annual DECIMAL(10,2),
    
    -- Features & limits
    seats_included INTEGER NOT NULL DEFAULT 1,
    max_searches_per_month INTEGER,
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
    display_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert plans with UPDATED PRICING
INSERT INTO subscription_plans (
    name, display_name, description, 
    price_monthly, price_annual,
    seats_included, max_searches_per_month,
    video_screening_enabled, ai_matching_enabled, 
    advanced_analytics_enabled, api_access_enabled,
    white_label_enabled, priority_support,
    display_order
) VALUES
-- STARTER PLAN (UPDATED PRICE: R2,030)
(
    'starter', 
    'Starter', 
    'Perfect for small teams getting started',
    2030.00,   -- R2,030/month (was R2,500)
    20300.00,  -- R20,300/year (~17% discount)
    2,         -- 2 seats (was 1)
    50,        -- 50 searches/month
    false,     -- No video screening
    true,      -- Basic AI matching
    false,     -- No advanced analytics
    false,     -- No API access
    false,     -- No white-label
    false,     -- Email support only
    1
),
-- PROFESSIONAL PLAN (UPDATED PRICE: R4,199)
(
    'professional',
    'Professional',
    'Best for growing teams',
    4199.00,   -- R4,199/month (was R7,500)
    41990.00,  -- R41,990/year (~17% discount)
    5,         -- 5 seats (was 3)
    NULL,      -- Unlimited searches
    true,      -- Video screening included
    true,      -- AI matching
    true,      -- Advanced analytics
    false,     -- No API access
    false,     -- No white-label
    true,      -- Priority support
    2
),
-- ENTERPRISE PLAN (Custom pricing)
(
    'enterprise',
    'Enterprise',
    'For large organizations with custom needs',
    0.00,      -- Custom pricing
    0.00,      -- Custom pricing
    10,        -- 10+ seats
    NULL,      -- Unlimited searches
    true,      -- Everything enabled
    true,
    true,
    true,      -- API access
    true,      -- White-label option
    true,      -- Dedicated support
    3
)
ON CONFLICT (name) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_annual = EXCLUDED.price_annual,
    seats_included = EXCLUDED.seats_included,
    description = EXCLUDED.description;
