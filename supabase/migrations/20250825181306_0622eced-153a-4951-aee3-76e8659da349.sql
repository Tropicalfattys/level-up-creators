
-- Update the handle_referral_credit function to award credits when booking status becomes 'accepted'
-- This aligns with the actual booking workflow where clients accept delivered work
CREATE OR REPLACE FUNCTION public.handle_referral_credit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referrer_id uuid;
BEGIN
  -- Only award credit on first successful booking (status = 'accepted')
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Check if this client was referred by someone
    SELECT referred_by INTO referrer_id
    FROM public.users 
    WHERE id = NEW.client_id AND referred_by IS NOT NULL;
    
    -- Award $1 credit to the referrer if this is the client's first accepted booking
    IF referrer_id IS NOT NULL THEN
      -- Check if this is the first accepted booking for this client
      IF NOT EXISTS (
        SELECT 1 FROM public.bookings 
        WHERE client_id = NEW.client_id 
        AND status = 'accepted' 
        AND id != NEW.id
      ) THEN
        UPDATE public.users 
        SET referral_credits = referral_credits + 1, updated_at = now()
        WHERE id = referrer_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;
