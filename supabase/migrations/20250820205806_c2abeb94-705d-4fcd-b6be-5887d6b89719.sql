
-- Drop the existing check constraint that only allows 'basic', 'premium', 'enterprise'
ALTER TABLE pricing_tiers DROP CONSTRAINT IF EXISTS pricing_tiers_tier_name_check;

-- Add new check constraint that allows the correct tier names
ALTER TABLE pricing_tiers ADD CONSTRAINT pricing_tiers_tier_name_check 
CHECK (tier_name IN ('basic', 'mid', 'pro'));

-- Clear all existing pricing data with wrong tier names
DELETE FROM pricing_tiers;

-- Insert the three correct pricing tiers
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
