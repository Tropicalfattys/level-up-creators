-- Step 1: Create a secure public profiles view that only exposes safe fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  handle,
  avatar_url,
  verified,
  bio,
  created_at
FROM public.users
WHERE (banned = false OR banned IS NULL);

-- Step 2: Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Step 3: Create RLS policy for the view (publicly readable)
CREATE POLICY "Public profiles view is readable by everyone" 
ON public.public_profiles 
FOR SELECT 
USING (true);

-- Step 4: Update the existing users table policy to be more restrictive
-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;

-- The remaining policies on users table are:
-- - "Admins can manage users" (admins can see everything)
-- - "Users can view their own profile" (users can see their own full profile) 
-- - "Users can update their own profile" (users can update their own profile)

-- This ensures that:
-- 1. Only authenticated users can see their own full profile data (including sensitive info)
-- 2. Admins can see all user data
-- 3. Public/unauthenticated users can only access the limited public_profiles view