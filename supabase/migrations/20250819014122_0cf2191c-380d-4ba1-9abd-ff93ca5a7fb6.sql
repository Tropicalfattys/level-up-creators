
-- Fix the creator approval system to properly update user roles
CREATE OR REPLACE FUNCTION public.handle_creator_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a creator is approved, update their user role to 'creator'
  IF NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false) THEN
    UPDATE public.users 
    SET role = 'creator', updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  
  -- If approval is revoked, set role back to 'client'
  IF NEW.approved = false AND OLD.approved = true THEN
    UPDATE public.users 
    SET role = 'client', updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for creator approval
DROP TRIGGER IF EXISTS on_creator_approval_change ON public.creators;
CREATE TRIGGER on_creator_approval_change
  AFTER UPDATE ON public.creators
  FOR EACH ROW
  WHEN (OLD.approved IS DISTINCT FROM NEW.approved)
  EXECUTE FUNCTION public.handle_creator_approval();

-- Fix the referral credit system
CREATE OR REPLACE FUNCTION public.handle_referral_credit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referrer_id uuid;
BEGIN
  -- Only award credit on first successful booking (status = 'paid')
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Check if this client was referred by someone
    SELECT referred_by INTO referrer_id
    FROM public.users 
    WHERE id = NEW.client_id AND referred_by IS NOT NULL;
    
    -- Award $1 credit to the referrer if this is the client's first paid booking
    IF referrer_id IS NOT NULL THEN
      -- Check if this is the first paid booking for this client
      IF NOT EXISTS (
        SELECT 1 FROM public.bookings 
        WHERE client_id = NEW.client_id 
        AND status = 'paid' 
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

-- Create trigger for referral credits
DROP TRIGGER IF EXISTS on_booking_paid ON public.bookings;
CREATE TRIGGER on_booking_paid
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_referral_credit();

-- Update the existing creator rating function to use proper search path
CREATE OR REPLACE FUNCTION public.update_creator_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.creators 
  SET 
    rating = (
      SELECT COALESCE(AVG(r.rating), 0) 
      FROM public.reviews r 
      WHERE r.reviewee_id = NEW.reviewee_id
    ),
    review_count = (
      SELECT COUNT(*) 
      FROM public.reviews r 
      WHERE r.reviewee_id = NEW.reviewee_id
    ),
    updated_at = now()
  WHERE user_id = NEW.reviewee_id;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger for creator rating updates
DROP TRIGGER IF EXISTS on_review_created ON public.reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_creator_rating();

-- Fix the user creation function to use proper search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, handle, referral_code, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'handle', SPLIT_PART(NEW.email, '@', 1)),
    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),
    CASE 
      WHEN NEW.email = 'michaelweston1515@gmail.com' THEN 'admin'
      ELSE 'client'
    END
  );
  RETURN NEW;
END;
$$;
