
-- Create enums for various status fields
CREATE TYPE public.user_role AS ENUM ('client', 'creator', 'admin');
CREATE TYPE public.creator_tier AS ENUM ('free', 'mid', 'pro');
CREATE TYPE public.chain_type AS ENUM ('evm', 'sol');
CREATE TYPE public.booking_status AS ENUM ('draft', 'paid', 'in_progress', 'delivered', 'accepted', 'disputed', 'refunded', 'released', 'canceled');
CREATE TYPE public.dispute_opener AS ENUM ('client', 'creator');
CREATE TYPE public.dispute_status AS ENUM ('open', 'resolved', 'refunded', 'released');

-- Update users table to use the enum
ALTER TABLE public.users ALTER COLUMN role TYPE public.user_role USING role::public.user_role;

-- Create creators table
CREATE TABLE public.creators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  headline TEXT,
  intro_video_url TEXT,
  tier public.creator_tier NOT NULL DEFAULT 'free',
  priority_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  payout_eth_address TEXT,
  payout_sol_address TEXT,
  tier_payment_tx_hash TEXT,
  tier_payment_status TEXT DEFAULT 'unpaid',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  chain public.chain_type NOT NULL DEFAULT 'evm',
  price_usdc NUMERIC(12,2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 7,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'draft',
  chain public.chain_type NOT NULL,
  usdc_amount NUMERIC(12,2) NOT NULL,
  platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  creator_payout NUMERIC(12,2) NOT NULL DEFAULT 0,
  tx_hash TEXT,
  payment_address TEXT,
  payout_tx_hash TEXT,
  deliverable_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  release_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create disputes table
CREATE TABLE public.disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  opened_by public.dispute_opener NOT NULL,
  reason TEXT NOT NULL,
  status public.dispute_status NOT NULL DEFAULT 'open',
  resolution_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.users(id)
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booking_id, reviewer_id)
);

-- Create messages table for chat functionality
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  from_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_notes table for internal notes
CREATE TABLE public.admin_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  note TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_logs table for tracking important actions
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contacts table for contact form submissions
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- open, resolved, spam
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.users(id)
);

-- Enable RLS on all tables
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creators table
CREATE POLICY "Public can view approved creators" ON public.creators FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view their own creator profile" ON public.creators FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own creator profile" ON public.creators FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own creator profile" ON public.creators FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all creators" ON public.creators FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for services table
CREATE POLICY "Public can view active services of approved creators" ON public.services FOR SELECT USING (
  active = true AND EXISTS (
    SELECT 1 FROM public.creators WHERE id = creator_id AND status = 'approved'
  )
);
CREATE POLICY "Creators can manage their own services" ON public.services FOR ALL USING (
  EXISTS (SELECT 1 FROM public.creators WHERE id = creator_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can view all services" ON public.services FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for bookings table
CREATE POLICY "Users can view their own bookings" ON public.bookings FOR SELECT USING (
  auth.uid() = client_id OR auth.uid() = creator_id
);
CREATE POLICY "Clients can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Creators can update their bookings" ON public.bookings FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Clients can update their bookings" ON public.bookings FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "Admins can view all bookings" ON public.bookings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for disputes table
CREATE POLICY "Users can view disputes for their bookings" ON public.disputes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id AND (client_id = auth.uid() OR creator_id = auth.uid())
  )
);
CREATE POLICY "Users can create disputes for their bookings" ON public.disputes FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id AND (client_id = auth.uid() OR creator_id = auth.uid())
  )
);
CREATE POLICY "Admins can manage all disputes" ON public.disputes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for reviews table
CREATE POLICY "Public can view all reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews for their completed bookings" ON public.reviews FOR INSERT WITH CHECK (
  auth.uid() = reviewer_id AND EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id AND (client_id = auth.uid() OR creator_id = auth.uid())
    AND status IN ('accepted', 'released')
  )
);
CREATE POLICY "Admins can manage all reviews" ON public.reviews FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for messages table
CREATE POLICY "Users can view messages for their bookings" ON public.messages FOR SELECT USING (
  auth.uid() = from_user_id OR auth.uid() = to_user_id OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Users can send messages for their bookings" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = from_user_id AND EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id AND (client_id = auth.uid() OR creator_id = auth.uid())
  )
);
CREATE POLICY "Admins can manage all messages" ON public.messages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for admin_notes table
CREATE POLICY "Admins can manage all admin notes" ON public.admin_notes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for audit_logs table
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for contacts table
CREATE POLICY "Admins can manage all contacts" ON public.contacts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Anyone can submit contact forms" ON public.contacts FOR INSERT WITH CHECK (true);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('creator-intros', 'creator-intros', true, 104857600, ARRAY['video/mp4', 'video/webm', 'video/quicktime']), -- 100MB limit for intro videos
  ('deliverables', 'deliverables', false, 524288000, ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'audio/wav']), -- 500MB limit for deliverables
  ('attachments', 'attachments', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']); -- 50MB limit for attachments

-- Storage RLS Policies
CREATE POLICY "Public can view creator intro videos" ON storage.objects FOR SELECT USING (bucket_id = 'creator-intros');

CREATE POLICY "Creators can upload intro videos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'creator-intros' AND 
  EXISTS (SELECT 1 FROM public.creators WHERE user_id = auth.uid())
);

CREATE POLICY "Creators can update their intro videos" ON storage.objects FOR UPDATE USING (
  bucket_id = 'creator-intros' AND 
  EXISTS (SELECT 1 FROM public.creators WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view deliverables for their bookings" ON storage.objects FOR SELECT USING (
  bucket_id = 'deliverables' AND (
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE (b.client_id = auth.uid() OR b.creator_id = auth.uid())
      AND storage.objects.name LIKE CONCAT(b.id::text, '/%')
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
);

CREATE POLICY "Creators can upload deliverables for their bookings" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'deliverables' AND
  EXISTS (
    SELECT 1 FROM public.bookings b 
    WHERE b.creator_id = auth.uid() 
    AND storage.objects.name LIKE CONCAT(b.id::text, '/%')
  )
);

CREATE POLICY "Users can view attachments for their messages" ON storage.objects FOR SELECT USING (
  bucket_id = 'attachments' AND (
    EXISTS (
      SELECT 1 FROM public.messages m 
      WHERE (m.from_user_id = auth.uid() OR m.to_user_id = auth.uid())
      AND storage.objects.name LIKE CONCAT('messages/', m.id::text, '/%')
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
);

CREATE POLICY "Users can upload message attachments" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'attachments' AND
  EXISTS (
    SELECT 1 FROM public.messages m 
    WHERE m.from_user_id = auth.uid()
    AND storage.objects.name LIKE CONCAT('messages/', m.id::text, '/%')
  )
);

-- Admins can manage all storage objects
CREATE POLICY "Admins can manage all storage objects" ON storage.objects FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Create indexes for better performance
CREATE INDEX idx_creators_user_id ON public.creators(user_id);
CREATE INDEX idx_creators_status ON public.creators(status);
CREATE INDEX idx_creators_tier ON public.creators(tier);
CREATE INDEX idx_services_creator_id ON public.services(creator_id);
CREATE INDEX idx_services_active ON public.services(active);
CREATE INDEX idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX idx_bookings_creator_id ON public.bookings(creator_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_messages_booking_id ON public.messages(booking_id);
CREATE INDEX idx_reviews_reviewee_id ON public.reviews(reviewee_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Function to automatically calculate platform fees and creator payouts
CREATE OR REPLACE FUNCTION calculate_booking_amounts()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate 15% platform fee and 85% creator payout
  NEW.platform_fee := ROUND(NEW.usdc_amount * 0.15, 2);
  NEW.creator_payout := NEW.usdc_amount - NEW.platform_fee;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate amounts on booking insert/update
CREATE TRIGGER trigger_calculate_booking_amounts
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_booking_amounts();

-- Function to automatically set release_at when booking is delivered
CREATE OR REPLACE FUNCTION set_release_timer()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    NEW.delivered_at := now();
    NEW.release_at := now() + INTERVAL '3 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic release timer
CREATE TRIGGER trigger_set_release_timer
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_release_timer();
