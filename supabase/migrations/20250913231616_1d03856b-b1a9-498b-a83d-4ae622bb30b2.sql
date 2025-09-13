-- Create referral_cashouts table for tracking cash-out requests
CREATE TABLE public.referral_cashouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credit_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  selected_currency TEXT NOT NULL, -- 'USDC' or 'USDM'
  selected_network TEXT NOT NULL, -- 'ethereum', 'base', 'solana', etc.
  payout_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  tx_hash TEXT NULL,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE NULL,
  processed_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_cashouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own cash-out requests" 
ON public.referral_cashouts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cash-out requests" 
ON public.referral_cashouts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins have full access to cash-out requests" 
ON public.referral_cashouts 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_referral_cashouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_referral_cashouts_updated_at
  BEFORE UPDATE ON public.referral_cashouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_referral_cashouts_updated_at();