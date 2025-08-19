
-- Create enums first
CREATE TYPE public.user_role AS ENUM ('client', 'creator', 'admin');
CREATE TYPE public.creator_tier AS ENUM ('free', 'mid', 'pro');
CREATE TYPE public.chain_type AS ENUM ('evm', 'solana');
CREATE TYPE public.booking_status AS ENUM ('draft', 'paid', 'in_progress', 'delivered', 'accepted', 'disputed', 'refunded', 'released', 'canceled');
CREATE TYPE public.dispute_status AS ENUM ('open', 'resolved', 'refunded', 'released');
CREATE TYPE public.dispute_opener AS ENUM ('client', 'creator');

-- Update users table to use enum and add missing fields
ALTER TABLE public.users 
  ALTER COLUMN role TYPE public.user_role USING role::public.user_role,
  ADD COLUMN IF NOT EXISTS socials JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS payout_addresses JSONB DEFAULT '{}';

-- Create creators table
CREATE TABLE public.creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  headline TEXT,
  intro_video_url TEXT,
  tier public.creator_tier NOT NULL DEFAULT 'free',
  priority_score INTEGER DEFAULT 0,
  approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMP WITH TIME ZONE,
  tier_payment_tx_hash TEXT,
  tier_payment_amount DECIMAL(12,2),
  tier_payment_chain public.chain_type,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  chain public.chain_type NOT NULL,
  price_usdc DECIMAL(12,2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 3,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status public.booking_status DEFAULT 'draft',
  chain public.chain_type,
  usdc_amount DECIMAL(12,2),
  platform_fee DECIMAL(12,2),
  creator_amount DECIMAL(12,2),
  tx_hash TEXT,
  payment_address TEXT,
  deliverable_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  release_at TIMESTAMP WITH TIME ZONE,
  payout_tx_hash TEXT,
  payout_at TIMESTAMP WITH TIME ZONE
);

-- Create disputes table
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  opened_by public.dispute_opener NOT NULL,
  reason TEXT NOT NULL,
  status public.dispute_status DEFAULT 'open',
  resolution_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.users(id)
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(booking_id, reviewer_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_notes table
CREATE TABLE public.admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  responded_by UUID REFERENCES public.users(id),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- RLS Policies for creators
CREATE POLICY "Public can view approved creators" ON public.creators
  FOR SELECT USING (approved = true);

CREATE POLICY "Users can view their own creator profile" ON public.creators
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all creators" ON public.creators
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for services
CREATE POLICY "Public can view active services" ON public.services
  FOR SELECT USING (active = true AND EXISTS (
    SELECT 1 FROM public.creators 
    WHERE id = creator_id AND approved = true
  ));

CREATE POLICY "Creators can manage their own services" ON public.services
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.creators 
    WHERE id = creator_id AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all services" ON public.services
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (client_id = auth.uid() OR creator_id = auth.uid());

CREATE POLICY "Users can create bookings as client" ON public.bookings
  FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Creators can update their bookings" ON public.bookings
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Clients can update their bookings" ON public.bookings
  FOR UPDATE USING (client_id = auth.uid());

CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for disputes
CREATE POLICY "Parties can view their disputes" ON public.disputes
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id 
    AND (client_id = auth.uid() OR creator_id = auth.uid())
  ));

CREATE POLICY "Parties can create disputes" ON public.disputes
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id 
    AND (client_id = auth.uid() OR creator_id = auth.uid())
  ));

CREATE POLICY "Admins can manage all disputes" ON public.disputes
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for reviews
CREATE POLICY "Public can view reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their bookings" ON public.reviews
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id 
    AND (client_id = auth.uid() OR creator_id = auth.uid())
    AND reviewer_id = auth.uid()
  ));

-- RLS Policies for messages
CREATE POLICY "Parties can view their messages" ON public.messages
  FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Admins can view all messages" ON public.messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for admin_notes
CREATE POLICY "Admins can manage admin notes" ON public.admin_notes
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for contacts
CREATE POLICY "Admins can manage contacts" ON public.contacts
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('creator-intros', 'creator-intros', true),
  ('deliverables', 'deliverables', false),
  ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for creator-intros (public read)
CREATE POLICY "Public can view intro videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'creator-intros');

CREATE POLICY "Creators can upload intro videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'creator-intros' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Creators can update their intro videos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'creator-intros' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Creators can delete their intro videos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'creator-intros' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for deliverables (private)
CREATE POLICY "Parties can access deliverables" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'deliverables' 
    AND EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id::text = (storage.foldername(name))[1]
      AND (client_id = auth.uid() OR creator_id = auth.uid())
    )
  );

CREATE POLICY "Creators can upload deliverables" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'deliverables' 
    AND EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id::text = (storage.foldername(name))[1]
      AND creator_id = auth.uid()
    )
  );

-- Storage policies for attachments (private)
CREATE POLICY "Message parties can access attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'attachments' 
    AND EXISTS (
      SELECT 1 FROM public.messages 
      WHERE id::text = (storage.foldername(name))[1]
      AND (from_user_id = auth.uid() OR to_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can upload message attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'attachments' 
    AND EXISTS (
      SELECT 1 FROM public.messages 
      WHERE id::text = (storage.foldername(name))[1]
      AND from_user_id = auth.uid()
    )
  );

-- Admins can access all storage
CREATE POLICY "Admins can access all deliverables" ON storage.objects
  FOR ALL USING (
    bucket_id = 'deliverables' 
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can access all attachments" ON storage.objects
  FOR ALL USING (
    bucket_id = 'attachments' 
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_creators_user_id ON public.creators(user_id);
CREATE INDEX idx_creators_approved ON public.creators(approved) WHERE approved = true;
CREATE INDEX idx_creators_tier ON public.creators(tier);
CREATE INDEX idx_services_creator_id ON public.services(creator_id);
CREATE INDEX idx_services_active ON public.services(active) WHERE active = true;
CREATE INDEX idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX idx_bookings_creator_id ON public.bookings(creator_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_messages_booking_id ON public.messages(booking_id);
CREATE INDEX idx_reviews_reviewee_id ON public.reviews(reviewee_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Update the handle_new_user function to use the enum
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.users (id, email, handle, referral_code, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'handle', SPLIT_PART(NEW.email, '@', 1)),
    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),
    CASE 
      WHEN NEW.email = 'michaelweston1515@gmail.com' THEN 'admin'::public.user_role
      ELSE 'client'::public.user_role
    END
  );
  RETURN NEW;
END;
$function$;

-- Create trigger for audit logging
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.audit_logs (actor_user_id, action, target_table, target_id, metadata)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      ELSE to_jsonb(NEW)
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create audit triggers for important tables
CREATE TRIGGER audit_creators AFTER INSERT OR UPDATE OR DELETE ON public.creators
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_bookings AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_disputes AFTER INSERT OR UPDATE OR DELETE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
