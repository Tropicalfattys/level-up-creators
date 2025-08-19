
-- Update users table to include referral system
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_credits numeric DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.users(id);

-- Update creators table with more fields
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 0;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS payout_address_eth text;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS payout_address_sol text;

-- Update services table with more fields
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS delivery_days integer DEFAULT 3;

-- Update bookings table with payment fields
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS chain text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS tx_hash text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_address text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS accepted_at timestamp with time zone;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS release_at timestamp with time zone;

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  reviewee_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create messages table for chat
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  from_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  attachments jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create contact messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'open',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for reviews
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their bookings" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = booking_id 
      AND (b.client_id = auth.uid() OR b.creator_id = auth.uid())
      AND b.status IN ('accepted', 'released')
    )
  );

-- RLS policies for messages
CREATE POLICY "Users can view messages for their bookings" ON public.messages
  FOR SELECT USING (
    auth.uid() = from_user_id OR 
    auth.uid() = to_user_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can send messages for their bookings" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = from_user_id AND
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = booking_id 
      AND (b.client_id = auth.uid() OR b.creator_id = auth.uid())
    )
  );

-- RLS policies for contact messages
CREATE POLICY "Admins can view all contact messages" ON public.contact_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Anyone can create contact messages" ON public.contact_messages
  FOR INSERT WITH CHECK (true);

-- Update booking statuses to match the spec
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('draft', 'paid', 'in_progress', 'delivered', 'accepted', 'disputed', 'refunded', 'released', 'canceled'));

-- Update dispute statuses
ALTER TABLE public.disputes DROP CONSTRAINT IF EXISTS disputes_status_check;
ALTER TABLE public.disputes ADD CONSTRAINT disputes_status_check 
  CHECK (status IN ('open', 'resolved', 'refunded', 'released'));

-- Create function to update creator ratings
CREATE OR REPLACE FUNCTION update_creator_rating()
RETURNS TRIGGER AS $$
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
    )
  WHERE user_id = NEW.reviewee_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update creator ratings
CREATE TRIGGER update_creator_rating_trigger
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_creator_rating();
