
-- Add service_limit column to pricing_tiers table
ALTER TABLE public.pricing_tiers 
ADD COLUMN service_limit integer;

-- Set initial values for existing tiers
-- Basic tier: 5 services
UPDATE public.pricing_tiers 
SET service_limit = 5 
WHERE tier_name = 'basic';

-- Mid tier: 10 services  
UPDATE public.pricing_tiers 
SET service_limit = 10 
WHERE tier_name = 'mid';

-- Pro tier: unlimited (NULL means no limit)
UPDATE public.pricing_tiers 
SET service_limit = NULL 
WHERE tier_name = 'pro';
