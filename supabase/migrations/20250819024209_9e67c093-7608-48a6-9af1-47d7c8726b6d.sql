
-- Add missing columns and tables for core functionality

-- Add attachments storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', false);

-- Add deliverables storage bucket  
INSERT INTO storage.buckets (id, name, public)
VALUES ('deliverables', 'deliverables', false);

-- Add creator-intros storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('creator-intros', 'creator-intros', true);

-- Add missing columns to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deliverable_url TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS creator_amount NUMERIC(10,2);

-- Add missing columns to users table for referrals
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_credits NUMERIC(10,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id);

-- Add contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add audit_logs table for admin tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Storage policies for attachments bucket
CREATE POLICY "Users can upload attachments for their messages" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view attachments for their messages" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'attachments' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Storage policies for deliverables bucket
CREATE POLICY "Creators can upload deliverables" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'deliverables' AND
    EXISTS (
      SELECT 1 FROM bookings b 
      WHERE b.creator_id = auth.uid() 
      AND b.id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Booking parties can view deliverables" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'deliverables' AND (
      EXISTS (
        SELECT 1 FROM bookings b 
        WHERE b.id::text = (storage.foldername(name))[1]
        AND (b.client_id = auth.uid() OR b.creator_id = auth.uid())
      ) OR
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Storage policies for creator-intros bucket
CREATE POLICY "Creators can upload intro videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'creator-intros' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view intro videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'creator-intros');

-- RLS policies for new tables
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create contact messages" ON contact_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all contact messages" ON contact_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can create audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Function to handle referral credits
CREATE OR REPLACE FUNCTION handle_referral_credit()
RETURNS TRIGGER AS $$
DECLARE
  referrer_id uuid;
BEGIN
  -- Only award credit on first successful booking (status = 'paid')
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Check if this client was referred by someone
    SELECT referred_by INTO referrer_id
    FROM users 
    WHERE id = NEW.client_id AND referred_by IS NOT NULL;
    
    -- Award $1 credit to the referrer if this is the client's first paid booking
    IF referrer_id IS NOT NULL THEN
      -- Check if this is the first paid booking for this client
      IF NOT EXISTS (
        SELECT 1 FROM bookings 
        WHERE client_id = NEW.client_id 
        AND status = 'paid' 
        AND id != NEW.id
      ) THEN
        UPDATE users 
        SET referral_credits = referral_credits + 1, updated_at = now()
        WHERE id = referrer_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for referral credits
DROP TRIGGER IF EXISTS referral_credit_trigger ON bookings;
CREATE TRIGGER referral_credit_trigger
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION handle_referral_credit();

-- Function to update creator ratings when reviews are added
CREATE OR REPLACE FUNCTION update_creator_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE creators 
  SET 
    rating = (
      SELECT COALESCE(AVG(r.rating), 0) 
      FROM reviews r 
      WHERE r.reviewee_id = NEW.reviewee_id
    ),
    review_count = (
      SELECT COUNT(*) 
      FROM reviews r 
      WHERE r.reviewee_id = NEW.reviewee_id
    ),
    updated_at = now()
  WHERE user_id = NEW.reviewee_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for creator rating updates
DROP TRIGGER IF EXISTS update_creator_rating_trigger ON reviews;
CREATE TRIGGER update_creator_rating_trigger
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_creator_rating();
