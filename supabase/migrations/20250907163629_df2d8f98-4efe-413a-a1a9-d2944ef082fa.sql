-- Create referral credits tracking table to prevent duplicate awards
CREATE TABLE public.referral_credits_awarded (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES users(id),
  referred_user_id UUID NOT NULL REFERENCES users(id),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  credit_amount NUMERIC(10,2) NOT NULL DEFAULT 1.00,
  awarded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_user_id) -- Prevent duplicate credits for same referral pair
);

-- Enable RLS
ALTER TABLE public.referral_credits_awarded ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own referral credits" 
ON public.referral_credits_awarded 
FOR SELECT 
USING (auth.uid() = referrer_id);

CREATE POLICY "Admins have full access to referral credits" 
ON public.referral_credits_awarded 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Update the referral credit function to prevent duplicate awards
CREATE OR REPLACE FUNCTION public.handle_referral_credit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referrer_id uuid;
  credit_already_awarded boolean;
BEGIN
  -- Only award credit on first successful booking (status = 'accepted')
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Check if this client was referred by someone
    SELECT referred_by INTO referrer_id
    FROM public.users 
    WHERE id = NEW.client_id AND referred_by IS NOT NULL;
    
    -- Award $1 credit to the referrer if this is the client's first accepted booking
    IF referrer_id IS NOT NULL THEN
      -- Check if credit has already been awarded for this referral pair
      SELECT EXISTS(
        SELECT 1 FROM public.referral_credits_awarded 
        WHERE referrer_id = referrer_id AND referred_user_id = NEW.client_id
      ) INTO credit_already_awarded;
      
      -- Only award credit if not already awarded and this is first accepted booking
      IF NOT credit_already_awarded AND NOT EXISTS (
        SELECT 1 FROM public.bookings 
        WHERE client_id = NEW.client_id 
        AND status = 'accepted' 
        AND id != NEW.id
      ) THEN
        -- Award the credit
        UPDATE public.users 
        SET referral_credits = referral_credits + 1, updated_at = now()
        WHERE id = referrer_id;
        
        -- Track the awarded credit
        INSERT INTO public.referral_credits_awarded (referrer_id, referred_user_id, booking_id)
        VALUES (referrer_id, NEW.client_id, NEW.id);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;