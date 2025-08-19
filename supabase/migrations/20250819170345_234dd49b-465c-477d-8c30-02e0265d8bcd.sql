
-- Update tier names to match frontend expectations
UPDATE pricing_tiers 
SET tier_name = 'mid' 
WHERE tier_name = 'premium';

UPDATE pricing_tiers 
SET tier_name = 'pro' 
WHERE tier_name = 'enterprise';

-- Clear existing data and insert correct tiers that match the frontend
DELETE FROM pricing_tiers;

INSERT INTO pricing_tiers (tier_name, display_name, price_usdc, features, active) VALUES 
(
  'basic', 
  'Starter', 
  0, 
  '["Create up to 3 services", "Basic profile listing", "Standard support", "Community access"]'::jsonb, 
  true
),
(
  'mid', 
  'Plus', 
  25, 
  '["Unlimited services", "Priority listing", "Analytics dashboard", "Lower platform fees (12%)", "Priority support"]'::jsonb, 
  true
),
(
  'pro', 
  'Pro', 
  50, 
  '["Everything in Plus", "Video intro uploads", "Featured homepage placement", "Custom branding", "Lowest platform fees (10%)", "Dedicated support"]'::jsonb, 
  true
);
