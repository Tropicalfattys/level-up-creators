
-- Create the missing trigger to call handle_referral_credit function when bookings are updated
CREATE TRIGGER referral_credit_trigger
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_referral_credit();
