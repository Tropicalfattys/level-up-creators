
-- Add RLS policies for video intro management in the deliverables bucket
CREATE POLICY "Pro creators can upload intro videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'deliverables' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = 'intro-videos' AND
  (storage.foldername(name))[2] = auth.uid()::text AND
  EXISTS (
    SELECT 1 FROM creators c 
    WHERE c.user_id = auth.uid() AND c.tier = 'pro' AND c.approved = true
  )
);

CREATE POLICY "Creators can manage their intro videos" ON storage.objects
FOR ALL USING (
  bucket_id = 'deliverables' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = 'intro-videos' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Public can view intro videos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'deliverables' AND 
  (storage.foldername(name))[1] = 'intro-videos'
);
