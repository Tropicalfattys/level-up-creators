
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  dispute_id UUID REFERENCES public.disputes(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Function to create notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_booking_id UUID DEFAULT NULL,
  p_payment_id UUID DEFAULT NULL,
  p_dispute_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, booking_id, payment_id, dispute_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_booking_id, p_payment_id, p_dispute_id)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notification trigger function for bookings
CREATE OR REPLACE FUNCTION public.notify_booking_changes()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notification trigger function for disputes
CREATE OR REPLACE FUNCTION public.notify_dispute_changes()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers (AFTER existing triggers to avoid conflicts)
CREATE TRIGGER notify_booking_changes_trigger
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_booking_changes();

CREATE TRIGGER notify_dispute_changes_trigger
  AFTER INSERT OR UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.notify_dispute_changes();

-- Function to clean up old notifications (optional - for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications 
  WHERE created_at < NOW() - INTERVAL '30 days' AND read = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
