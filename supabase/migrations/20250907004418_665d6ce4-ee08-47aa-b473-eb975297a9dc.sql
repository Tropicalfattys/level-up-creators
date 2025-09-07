-- Update sync_payment_to_booking function to handle rejected payments
CREATE OR REPLACE FUNCTION public.sync_payment_to_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
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

-- Update notify_booking_changes function to handle payment_rejected status
CREATE OR REPLACE FUNCTION public.notify_booking_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
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