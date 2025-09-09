-- Add verification_links column to users table for Pro Creator social verification
ALTER TABLE public.users ADD COLUMN verification_links JSONB DEFAULT '[]'::jsonb;