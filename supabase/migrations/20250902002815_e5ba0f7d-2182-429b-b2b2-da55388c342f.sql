
-- Add description column to pricing_tiers table
ALTER TABLE public.pricing_tiers 
ADD COLUMN description TEXT;

-- Update existing records with current hardcoded descriptions
UPDATE public.pricing_tiers 
SET description = CASE 
  WHEN tier_name = 'basic' THEN 'Perfect for getting started'
  WHEN tier_name = 'mid' THEN 'Enhanced features for growth'  
  WHEN tier_name = 'pro' THEN 'Premium features for professionals'
  ELSE 'Perfect for getting started'
END;

-- Make description column required for future records
ALTER TABLE public.pricing_tiers 
ALTER COLUMN description SET NOT NULL;

-- Set default value for new records
ALTER TABLE public.pricing_tiers 
ALTER COLUMN description SET DEFAULT 'Perfect for getting started';
