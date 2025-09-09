-- Add verified column to users table
ALTER TABLE public.users ADD COLUMN verified boolean DEFAULT false NOT NULL;

-- Update RLS policies to allow reading verified status
-- The existing policies already cover this, but let's ensure verified field is accessible
COMMENT ON COLUMN public.users.verified IS 'Indicates if the user has been verified by an admin';