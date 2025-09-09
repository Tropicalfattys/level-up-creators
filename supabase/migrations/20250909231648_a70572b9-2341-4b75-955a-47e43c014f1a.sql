-- Fix remaining security warnings by setting proper search_path for remaining functions

-- Fix create_notification function
CREATE OR REPLACE FUNCTION public.create_notification(p_user_id uuid, p_type text, p_title text, p_message text, p_booking_id uuid DEFAULT NULL::uuid, p_payment_id uuid DEFAULT NULL::uuid, p_dispute_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, booking_id, payment_id, dispute_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_booking_id, p_payment_id, p_dispute_id)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$function$;

-- Fix notify_dispute_changes function
CREATE OR REPLACE FUNCTION public.notify_dispute_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  booking_record RECORD;
BEGIN
  -- Get booking details for notifications
  SELECT client_id, creator_id INTO booking_record
  FROM public.bookings 
  WHERE id = COALESCE(NEW.booking_id, OLD.booking_id);

  -- New dispute created
  IF TG_OP = 'INSERT' THEN
    -- Notify the other party about the dispute
    IF NEW.opened_by = 'client' THEN
      PERFORM public.create_notification(
        booking_record.creator_id,
        'dispute_created',
        'Dispute Opened',
        'A dispute has been opened for one of your bookings.',
        NEW.booking_id,
        NULL,
        NEW.id
      );
    ELSE
      PERFORM public.create_notification(
        booking_record.client_id,
        'dispute_created',
        'Dispute Opened',
        'A dispute has been opened for one of your bookings.',
        NEW.booking_id,
        NULL,
        NEW.id
      );
    END IF;
  END IF;

  -- Dispute resolved
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'resolved' THEN
    -- Notify both parties
    PERFORM public.create_notification(
      booking_record.client_id,
      'dispute_resolved',
      'Dispute Resolved',
      'A dispute for your booking has been resolved.',
      NEW.booking_id,
      NULL,
      NEW.id
    );
    
    PERFORM public.create_notification(
      booking_record.creator_id,
      'dispute_resolved',
      'Dispute Resolved',
      'A dispute for your booking has been resolved.',
      NEW.booking_id,
      NULL,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Fix cleanup_old_notifications function
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.notifications 
  WHERE created_at < NOW() - INTERVAL '30 days' AND read = true;
END;
$function$;

-- Fix notify_booking_changes function
CREATE OR REPLACE FUNCTION public.notify_booking_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- New booking created (notify creator) 
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    PERFORM public.create_notification(
      NEW.creator_id,
      'booking_received',
      'New Booking Received',
      'You have received a new booking request.',
      NEW.id
    );
  END IF;

  -- Booking status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    CASE NEW.status
      WHEN 'paid' THEN
        -- Notify creator when payment is made
        PERFORM public.create_notification(
          NEW.creator_id,
          'payment_verified',
          'Payment Received',
          'Payment has been verified for your booking.',
          NEW.id
        );
      WHEN 'payment_rejected' THEN
        -- Notify both client and creator when payment is rejected
        PERFORM public.create_notification(
          NEW.client_id,
          'payment_rejected',
          'Payment Rejected',
          'Your payment has been rejected. Please try again or contact support.',
          NEW.id
        );
        PERFORM public.create_notification(
          NEW.creator_id,
          'payment_rejected',
          'Payment Rejected',
          'A payment for your booking has been rejected.',
          NEW.id
        );
      WHEN 'delivered' THEN
        -- Notify client when work is delivered
        PERFORM public.create_notification(
          NEW.client_id,
          'booking_delivered',
          'Work Delivered',
          'Your creator has delivered the work.',
          NEW.id
        );
      WHEN 'accepted' THEN
        -- Notify creator when client accepts work
        PERFORM public.create_notification(
          NEW.creator_id,
          'booking_accepted',
          'Work Accepted',
          'Your client has accepted the delivered work.',
          NEW.id
        );
      WHEN 'disputed' THEN
        -- Handle disputed status (minimal fix to prevent "case not found" error)
        NULL;
      WHEN 'released' THEN
        -- Notify creator when payment is released
        PERFORM public.create_notification(
          NEW.creator_id,
          'payment_released',
          'Payment Released',
          'Your payment has been released.',
          NEW.id
        );
      WHEN 'refunded' THEN
        -- Notify client when booking is refunded
        PERFORM public.create_notification(
          NEW.client_id,
          'booking_refunded',
          'Booking Refunded',
          'Your booking has been refunded.',
          NEW.id
        );
    END CASE;
  END IF;

  RETURN NEW;
END;
$function$;

-- Fix sync_payment_to_booking function
CREATE OR REPLACE FUNCTION public.sync_payment_to_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- When payment status changes to 'verified' and there's an associated booking
  IF NEW.status = 'verified' AND OLD.status != 'verified' AND NEW.booking_id IS NOT NULL THEN
    -- Update the booking status to 'paid'
    UPDATE public.bookings 
    SET status = 'paid', updated_at = now()
    WHERE id = NEW.booking_id;
  END IF;
  
  -- When payment status changes to 'rejected' and there's an associated booking
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' AND NEW.booking_id IS NOT NULL THEN
    -- Update the booking status to 'payment_rejected'
    UPDATE public.bookings 
    SET status = 'payment_rejected', updated_at = now()
    WHERE id = NEW.booking_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix handle_referral_credit function
CREATE OR REPLACE FUNCTION public.handle_referral_credit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
$function$;