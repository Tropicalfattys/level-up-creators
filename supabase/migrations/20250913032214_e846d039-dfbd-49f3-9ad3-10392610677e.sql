-- Update the notify_booking_changes function to handle refund processing notifications
CREATE OR REPLACE FUNCTION public.notify_booking_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- New booking created (notify creator AND admin) 
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    -- Existing creator notification (preserve)
    PERFORM public.create_notification(
      NEW.creator_id,
      'booking_received',
      'New Booking Received',
      'You have received a new booking request.',
      NEW.id
    );
    
    -- NEW: Admin notification for new booking
    PERFORM public.create_notification(
      (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
      'admin_new_booking',
      'New Service Booking',
      format('A new service has been booked by %s', 
        (SELECT handle FROM users WHERE id = NEW.client_id)),
      NEW.id
    );
  END IF;

  -- Booking status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    CASE NEW.status
      WHEN 'paid' THEN
        -- Existing notification (preserve)
        PERFORM public.create_notification(
          NEW.creator_id,
          'payment_verified',
          'Payment Received',
          'Payment has been verified for your booking.',
          NEW.id
        );
      WHEN 'payment_rejected' THEN
        -- Existing notifications (preserve)
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
        -- Existing client notification (preserve)
        PERFORM public.create_notification(
          NEW.client_id,
          'booking_delivered',
          'Work Delivered',
          'Your creator has delivered the work.',
          NEW.id
        );
        
        -- NEW: Admin notification for delivery
        PERFORM public.create_notification(
          (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
          'admin_booking_delivered',
          'Service Delivered',
          format('Service has been delivered by %s', 
            (SELECT handle FROM users WHERE id = NEW.creator_id)),
          NEW.id
        );
      WHEN 'accepted' THEN
        -- Existing notification (preserve)
        PERFORM public.create_notification(
          NEW.creator_id,
          'booking_accepted',
          'Work Accepted',
          'Your client has accepted the delivered work.',
          NEW.id
        );
      WHEN 'disputed' THEN
        -- Handle disputed status (preserve existing minimal implementation)
        NULL;
      WHEN 'released' THEN
        -- Existing notification (preserve)
        PERFORM public.create_notification(
          NEW.creator_id,
          'payment_released',
          'Payment Released',
          'Your payment has been released.',
          NEW.id
        );
      WHEN 'refunded' THEN
        -- Existing notification (preserve)
        PERFORM public.create_notification(
          NEW.client_id,
          'booking_refunded',
          'Booking Refunded',
          'Your booking has been refunded.',
          NEW.id
        );
      WHEN 'rejected_by_creator' THEN
        -- NEW: Handle creator rejection
        PERFORM public.create_notification(
          NEW.client_id,
          'booking_rejected',
          'Creator Rejected Work',
          'The creator has rejected your booking. You will receive a refund with a 5% platform fee.',
          NEW.id
        );
        
        -- Notify admin about rejection
        PERFORM public.create_notification(
          (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
          'admin_booking_rejected',
          'Creator Rejected Booking',
          format('Creator %s has rejected a booking. This requires a refund with 5%% platform fee.', 
            (SELECT handle FROM users WHERE id = NEW.creator_id)),
          NEW.id
        );
    END CASE;
  END IF;

  -- NEW: Detect when refund_tx_hash is added to rejected bookings
  IF TG_OP = 'UPDATE' 
     AND NEW.status = 'rejected_by_creator' 
     AND NEW.refund_tx_hash IS NOT NULL 
     AND OLD.refund_tx_hash IS NULL THEN
    -- Notify client that refund has been processed
    PERFORM public.create_notification(
      NEW.client_id,
      'refund_processed',
      'Refund Processed',
      format('Your refund has been processed! Transaction Hash: %s - You can view this transaction on the blockchain explorer.', NEW.refund_tx_hash),
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$function$;