
-- Create a table to store dynamic pricing configuration
CREATE TABLE public.pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE CHECK (tier_name IN ('basic', 'premium', 'enterprise')),
  price_usdc NUMERIC NOT NULL DEFAULT 0 CHECK (price_usdc >= 0),
  display_name TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default pricing tiers
INSERT INTO public.pricing_tiers (tier_name, price_usdc, display_name, features) VALUES
('basic', 0, 'Basic (Free)', '["Basic listing", "Admin approval required"]'::jsonb),
('premium', 25, 'Premium', '["Priority placement", "Enhanced profile"]'::jsonb),
('enterprise', 50, 'Enterprise', '["Featured listing", "Video intro", "Priority support"]'::jsonb);

-- Enable RLS
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing pricing tiers (everyone can see them)
CREATE POLICY "Everyone can view pricing tiers" 
ON public.pricing_tiers 
FOR SELECT 
USING (true);

-- Create policy for admins to manage pricing tiers
CREATE POLICY "Admins can manage pricing tiers" 
ON public.pricing_tiers 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_pricing_tier_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at field
CREATE TRIGGER pricing_tiers_updated_at_trigger
  BEFORE UPDATE ON public.pricing_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_tier_updated_at();
