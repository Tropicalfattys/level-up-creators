
-- Create the missing storage buckets that are needed for file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('attachments', 'attachments', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/zip', 'application/x-zip-compressed']),
  ('deliverables', 'deliverables', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/zip', 'application/x-zip-compressed'])
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for attachments bucket
CREATE POLICY "Users can upload message attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'attachments' AND 
    auth.uid()::text = (storage.foldername(name))[1] OR
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view message attachments for their bookings" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'attachments' AND (
      auth.uid() IS NOT NULL
    )
  );

CREATE POLICY "Users can delete their message attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'attachments' AND 
    auth.uid() IS NOT NULL
  );

-- Create RLS policies for deliverables bucket
CREATE POLICY "Creators can upload deliverables" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'deliverables' AND 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view deliverables for their bookings" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'deliverables' AND 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Creators can delete their deliverables" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'deliverables' AND 
    auth.uid() IS NOT NULL
  );
