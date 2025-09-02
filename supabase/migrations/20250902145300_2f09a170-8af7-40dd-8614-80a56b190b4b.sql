-- Make the icons bucket public so images can be loaded without signed URLs
UPDATE storage.buckets 
SET public = true 
WHERE id = 'icons';