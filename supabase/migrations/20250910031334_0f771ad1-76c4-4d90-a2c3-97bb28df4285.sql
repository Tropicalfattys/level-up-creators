-- Phase 1: Recreate the referral credit trigger with enhanced logging and error handling
DROP TRIGGER IF EXISTS trigger_handle_referral_credit ON public.bookings;

CREATE OR REPLACE FUNCTION public.handle_referral_credit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_referrer_id uuid;
  credit_already_awarded boolean;
  v_debug_info text;
BEGIN
  -- Add comprehensive logging for debugging
  v_debug_info := format('Booking ID: %s, Status change: %s -> %s, Client: %s', 
    NEW.id, COALESCE(OLD.status, 'NULL'), NEW.status, NEW.client_id);
  
  -- Only award credit on first successful booking (status = 'accepted')
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
    -- Check if this client was referred by someone
    SELECT referred_by INTO v_referrer_id
    FROM public.users 
    WHERE id = NEW.client_id AND referred_by IS NOT NULL;
    
    v_debug_info := v_debug_info || format(', Referrer: %s', COALESCE(v_referrer_id::text, 'NONE'));
    
    -- Award $1 credit to the referrer if this is the client's first accepted booking
    IF v_referrer_id IS NOT NULL THEN
      -- Check if credit has already been awarded for this referral pair
      SELECT EXISTS(
        SELECT 1 FROM public.referral_credits_awarded 
        WHERE referrer_id = v_referrer_id AND referred_user_id = NEW.client_id
      ) INTO credit_already_awarded;
      
      v_debug_info := v_debug_info || format(', Credit already awarded: %s', credit_already_awarded);
      
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
        
        v_debug_info := v_debug_info || ', CREDIT AWARDED';
        
        -- Create notification for referrer
        PERFORM public.create_notification(
          v_referrer_id,
          'referral_credit_earned',
          'Referral Credit Earned!',
          'You earned $1 credit for a successful referral! Your referred user has completed their first booking.',
          NEW.id
        );
        
      ELSE
        v_debug_info := v_debug_info || ', CREDIT SKIPPED (already awarded or not first booking)';
      END IF;
    END IF;
    
    -- Log the trigger execution (for debugging purposes)
    INSERT INTO public.admin_notes (user_id, admin_id, note)
    VALUES (NEW.client_id, NULL, 'REFERRAL_TRIGGER: ' || v_debug_info);
    
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't let trigger errors break booking updates, but log them
    INSERT INTO public.admin_notes (user_id, admin_id, note)
    VALUES (NEW.client_id, NULL, 'REFERRAL_TRIGGER_ERROR: ' || SQLERRM || ' | ' || v_debug_info);
    RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER trigger_handle_referral_credit
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_referral_credit();

-- Phase 2: Sync missing historical referral credit records
-- First, let's identify and fix the missing records for users who have credits but no tracking records

DO $$
DECLARE
  missing_record RECORD;
  earliest_accepted_booking_id uuid;
BEGIN
  -- For each user who has referral_credits but missing referral_credits_awarded records
  FOR missing_record IN 
    SELECT 
      u.id as referrer_id,
      u.referral_credits,
      ru.id as referred_user_id,
      ru.handle as referred_handle
    FROM users u
    INNER JOIN users ru ON ru.referred_by = u.id
    WHERE u.referral_credits > 0
    AND NOT EXISTS (
      SELECT 1 FROM referral_credits_awarded rca 
      WHERE rca.referrer_id = u.id AND rca.referred_user_id = ru.id
    )
  LOOP
    -- Find the earliest accepted booking for this referred user
    SELECT b.id INTO earliest_accepted_booking_id
    FROM bookings b
    WHERE b.client_id = missing_record.referred_user_id 
    AND b.status = 'accepted'
    ORDER BY b.accepted_at ASC, b.created_at ASC
    LIMIT 1;
    
    -- Create the missing referral credit record if there's an accepted booking
    IF earliest_accepted_booking_id IS NOT NULL THEN
      INSERT INTO public.referral_credits_awarded (
        referrer_id, 
        referred_user_id, 
        booking_id, 
        credit_amount,
        awarded_at
      )
      VALUES (
        missing_record.referrer_id,
        missing_record.referred_user_id,
        earliest_accepted_booking_id,
        1.00,
        (SELECT COALESCE(accepted_at, updated_at) FROM bookings WHERE id = earliest_accepted_booking_id)
      );
      
      -- Log this historical sync
      INSERT INTO public.admin_notes (user_id, admin_id, note)
      VALUES (
        missing_record.referrer_id, 
        NULL, 
        format('HISTORICAL_REFERRAL_SYNC: Added missing referral credit record for user %s (booking %s)', 
          missing_record.referred_handle, earliest_accepted_booking_id)
      );
    END IF;
  END LOOP;
END $$;

-- Phase 3: Create admin function to check referral system health
CREATE OR REPLACE FUNCTION public.check_referral_system_health()
RETURNS TABLE(
  check_name text,
  status text,
  details text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check 1: Users with credits but no tracking records
  RETURN QUERY
  SELECT 
    'Missing Tracking Records'::text,
    CASE WHEN COUNT(*) = 0 THEN 'HEALTHY' ELSE 'ISSUE' END::text,
    format('%s users have credits but missing tracking records', COUNT(*))::text
  FROM users u
  WHERE u.referral_credits > 0
  AND NOT EXISTS (
    SELECT 1 FROM referral_credits_awarded rca WHERE rca.referrer_id = u.id
  );
  
  -- Check 2: Trigger exists and is enabled
  RETURN QUERY
  SELECT 
    'Referral Trigger Status'::text,
    CASE WHEN COUNT(*) > 0 THEN 'HEALTHY' ELSE 'MISSING' END::text,
    CASE WHEN COUNT(*) > 0 THEN 'Trigger is active' ELSE 'Trigger is missing!' END::text
  FROM information_schema.triggers 
  WHERE trigger_name = 'trigger_handle_referral_credit' 
  AND event_object_table = 'bookings';
  
  -- Check 3: Credit amounts match
  RETURN QUERY
  SELECT 
    'Credit Amount Consistency'::text,
    CASE WHEN COUNT(*) = 0 THEN 'HEALTHY' ELSE 'ISSUE' END::text,
    format('%s users have mismatched credit amounts', COUNT(*))::text
  FROM (
    SELECT u.id, u.referral_credits, COALESCE(SUM(rca.credit_amount), 0) as tracked_credits
    FROM users u
    LEFT JOIN referral_credits_awarded rca ON rca.referrer_id = u.id
    WHERE u.referral_credits > 0
    GROUP BY u.id, u.referral_credits
    HAVING u.referral_credits != COALESCE(SUM(rca.credit_amount), 0)
  ) mismatched;
  
  RETURN;
END;
$function$;