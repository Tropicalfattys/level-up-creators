
-- Force delete ALL pricing tiers first
TRUNCATE TABLE pricing_tiers RESTART IDENTITY CASCADE;

-- Insert the correct three tiers with exact naming that frontend expects
INSERT INTO pricing_tiers (tier_name, display_name, price_usdc, features, active) VALUES
('basic', 'Starter', 0, '[
  "Create up to 3 services",
  "Basic profile listing", 
  "Standard support",
  "Community access"
]'::jsonb, true),

('mid', 'Plus', 25, '[
  "Unlimited services",
  "Priority listing",
  "Analytics dashboard",
  "Lower platform fees (12%)",
  "Priority support"
]'::jsonb, true),

('pro', 'Pro', 50, '[
  "Everything in Plus",
  "Video intro uploads",
  "Featured homepage placement", 
  "Custom branding",
  "Lowest platform fees (10%)",
  "Dedicated support"
]'::jsonb, true);

-- Verify the data was inserted correctly
SELECT tier_name, display_name, price_usdc, active FROM pricing_tiers ORDER BY price_usdc;
