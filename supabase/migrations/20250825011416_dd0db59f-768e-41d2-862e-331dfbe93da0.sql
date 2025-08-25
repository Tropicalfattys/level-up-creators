
-- Ensure the proof_links column exists on the bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS proof_links JSONB DEFAULT '[]'::jsonb;

-- Update existing proof_link data to new format if needed and proof_links is empty
UPDATE bookings 
SET proof_links = CASE 
  WHEN proof_link IS NOT NULL AND proof_link != '' AND (proof_links IS NULL OR proof_links = '[]'::jsonb)
  THEN jsonb_build_array(jsonb_build_object('url', proof_link, 'label', 'Social Proof'))
  WHEN proof_links IS NULL
  THEN '[]'::jsonb
  ELSE proof_links
END;

-- Make sure the deliverables bucket exists with correct settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deliverables', 
  'deliverables', 
  false, 
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/zip', 'application/x-zip-compressed', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/zip', 'application/x-zip-compressed', 'video/mp4', 'video/quicktime', 'video/webm'];

-- Recreate storage policies to make sure they work correctly
DROP POLICY IF EXISTS "Users can upload deliverables for their bookings" ON storage.objects;
DROP POLICY IF EXISTS "Users can view deliverables for their bookings" ON storage.objects;

CREATE POLICY "Users can upload deliverables for their bookings" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'deliverables' AND 
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.creator_id = auth.uid() 
    AND (storage.foldername(name))[1] = b.id::text
  )
);

CREATE POLICY "Users can view deliverables for their bookings" ON storage.objects
FOR SELECT USING (
  bucket_id = 'deliverables' AND 
  auth.uid() IS NOT NULL AND
  (
    EXISTS (
      SELECT 1 FROM bookings b 
      WHERE (b.creator_id = auth.uid() OR b.client_id = auth.uid())
      AND (storage.foldername(name))[1] = b.id::text
    ) OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  )
);
