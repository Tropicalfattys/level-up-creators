
-- Create a trigger function to sync payment verification with booking status
CREATE OR REPLACE FUNCTION public.sync_payment_to_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When payment status changes to 'verified' and there's an associated booking
  IF NEW.status = 'verified' AND OLD.status != 'verified' AND NEW.booking_id IS NOT NULL THEN
    -- Update the booking status to 'paid'
    UPDATE public.bookings 
    SET status = 'paid', updated_at = now()
    WHERE id = NEW.booking_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on payments table
DROP TRIGGER IF EXISTS sync_payment_to_booking_trigger ON public.payments;
CREATE TRIGGER sync_payment_to_booking_trigger
  AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.sync_payment_to_booking();
