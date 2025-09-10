-- Phase 1: Enhance booking notifications to include admin notifications
-- Preserve all existing functionality while adding admin notifications

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
    END CASE;
  END IF;

  RETURN NEW;
END;
$function$;

-- Phase 2: Create new trigger for creator subscription notifications
CREATE OR REPLACE FUNCTION public.notify_admin_creator_applications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_handle text;
  admin_user_id uuid;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
  
  -- Get the user's handle for the notification
  SELECT handle INTO user_handle FROM users WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  
  -- Skip if no admin found
  IF admin_user_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- New creator application submitted
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_notification(
      admin_user_id,
      'admin_creator_application',
      'New Creator Application',
      format('New creator application submitted by %s for %s tier', 
        COALESCE(user_handle, 'Unknown User'), NEW.tier)
    );
  END IF;
  
  -- Creator tier upgrade (subscription)
  IF TG_OP = 'UPDATE' AND OLD.tier != NEW.tier THEN
    PERFORM public.create_notification(
      admin_user_id,
      'admin_creator_upgrade',
      'Creator Tier Upgrade',
      format('%s upgraded from %s to %s tier', 
        COALESCE(user_handle, 'Unknown User'), OLD.tier, NEW.tier)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Phase 3: Create trigger for pro creator verification links monitoring
CREATE OR REPLACE FUNCTION public.notify_admin_verification_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  admin_user_id uuid;
  is_pro_creator boolean := false;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
  
  -- Skip if no admin found
  IF admin_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if this user is a pro creator
  SELECT EXISTS(
    SELECT 1 FROM creators c 
    WHERE c.user_id = NEW.id 
    AND c.approved = true 
    AND c.tier = 'pro'
  ) INTO is_pro_creator;
  
  -- Only notify for pro creators when verification_links are updated
  IF TG_OP = 'UPDATE' 
     AND is_pro_creator 
     AND (OLD.verification_links IS DISTINCT FROM NEW.verification_links)
     AND NEW.verification_links IS NOT NULL 
     AND jsonb_array_length(NEW.verification_links) > 0 THEN
    
    PERFORM public.create_notification(
      admin_user_id,
      'admin_verification_links',
      'Pro Creator Verification Links Updated',
      format('Pro creator %s has updated their verification links for review', 
        COALESCE(NEW.handle, 'Unknown User'))
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Phase 4: Enhance dispute notifications to ensure admin gets notified
CREATE OR REPLACE FUNCTION public.notify_dispute_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  booking_record RECORD;
  admin_user_id uuid;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
  
  -- Get booking details for notifications
  SELECT client_id, creator_id INTO booking_record
  FROM public.bookings 
  WHERE id = COALESCE(NEW.booking_id, OLD.booking_id);

  -- New dispute created
  IF TG_OP = 'INSERT' THEN
    -- Existing notifications to other party (preserve)
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
    
    -- NEW: Admin notification for new dispute
    IF admin_user_id IS NOT NULL THEN
      PERFORM public.create_notification(
        admin_user_id,
        'admin_dispute_filed',
        'New Dispute Filed',
        format('A dispute has been filed by %s for booking', NEW.opened_by),
        NEW.booking_id,
        NULL,
        NEW.id
      );
    END IF;
  END IF;

  -- Dispute resolved (existing functionality preserved)
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'resolved' THEN
    -- Notify both parties (preserve existing)
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

-- Create triggers (safe to recreate)
DROP TRIGGER IF EXISTS trigger_notify_admin_creator_applications ON public.creators;
CREATE TRIGGER trigger_notify_admin_creator_applications
  AFTER INSERT OR UPDATE ON public.creators
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_creator_applications();

DROP TRIGGER IF EXISTS trigger_notify_admin_verification_updates ON public.users;
CREATE TRIGGER trigger_notify_admin_verification_updates
  AFTER UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_verification_updates();