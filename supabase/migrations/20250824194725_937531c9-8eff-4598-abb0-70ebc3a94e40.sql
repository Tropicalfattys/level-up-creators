
-- Add missing fields to bookings table for proof of completion
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS proof_link TEXT,
ADD COLUMN IF NOT EXISTS proof_file_url TEXT;

-- Add missing fields to reviews table if they don't exist
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id);

-- Create index on booking_id for reviews if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON public.reviews(booking_id);

-- Update the trigger function to properly update creator ratings
CREATE OR REPLACE FUNCTION public.update_creator_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update creator rating and review count
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
$function$;

-- Ensure the trigger exists for review updates
DROP TRIGGER IF EXISTS update_creator_rating_trigger ON public.reviews;
CREATE TRIGGER update_creator_rating_trigger
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_creator_rating();

-- Enable realtime for messages table if not already enabled
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.messages;

-- Enable realtime for bookings table if not already enabled  
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.bookings;
