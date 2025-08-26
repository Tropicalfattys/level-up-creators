
-- Fix storage policies to allow anonymous resume uploads for careers page
-- This is safe and won't break any existing functionality

-- Allow anonymous users to upload resumes to the attachments bucket
INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command)
VALUES (
  'allow_anonymous_resume_upload',
  'attachments',
  'Allow anonymous resume uploads',
  'bucket_id = ''attachments'' AND (storage.foldername(name))[1] = ''resumes''',
  'bucket_id = ''attachments'' AND (storage.foldername(name))[1] = ''resumes''',
  'INSERT'
);

-- Allow public access to resume files (for admin review)
INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command)
VALUES (
  'allow_resume_public_access',
  'attachments',
  'Allow public access to resumes',
  'bucket_id = ''attachments'' AND (storage.foldername(name))[1] = ''resumes''',
  'bucket_id = ''attachments'' AND (storage.foldername(name))[1] = ''resumes''',
  'SELECT'
);
