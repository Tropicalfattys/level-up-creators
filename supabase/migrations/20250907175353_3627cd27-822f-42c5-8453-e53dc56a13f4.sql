-- Fix the ambiguous column reference in handle_referral_credit function
CREATE OR REPLACE FUNCTION public.handle_referral_credit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_referrer_id uuid;
  credit_already_awarded boolean;
BEGIN
  -- Only award credit on first successful booking (status = 'accepted')
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Check if this client was referred by someone
    SELECT referred_by INTO v_referrer_id
    FROM public.users 
    WHERE id = NEW.client_id AND referred_by IS NOT NULL;
    
    -- Award $1 credit to the referrer if this is the client's first accepted booking
    IF v_referrer_id IS NOT NULL THEN
      -- Check if credit has already been awarded for this referral pair
      SELECT EXISTS(
        SELECT 1 FROM public.referral_credits_awarded 
        WHERE referrer_id = v_referrer_id AND referred_user_id = NEW.client_id
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
        WHERE id = v_referrer_id;
        
        -- Track the awarded credit
        INSERT INTO public.referral_credits_awarded (referrer_id, referred_user_id, booking_id)
        VALUES (v_referrer_id, NEW.client_id, NEW.id);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$