-- Drop the overly permissive public policy that exposes all user data
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;

-- Create a security definer function to get safe public profile data
CREATE OR REPLACE FUNCTION public.get_public_profile(user_id_param uuid)
RETURNS TABLE (
  id uuid,
  handle text,
  avatar_url text,
  verified boolean,
  bio text,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    u.id,
    u.handle,
    u.avatar_url,
    u.verified,
    u.bio,
    u.created_at
  FROM public.users u
  WHERE u.id = user_id_param 
    AND (u.banned = false OR u.banned IS NULL);
$$;

-- Create a function to get public profiles by handle
CREATE OR REPLACE FUNCTION public.get_public_profile_by_handle(handle_param text)
RETURNS TABLE (
  id uuid,
  handle text,
  avatar_url text,
  verified boolean,
  bio text,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    u.id,
    u.handle,
    u.avatar_url,
    u.verified,
    u.bio,
    u.created_at
  FROM public.users u
  WHERE u.handle = handle_param 
    AND (u.banned = false OR u.banned IS NULL);
$$;

-- The remaining policies on users table ensure security:
-- 1. "Admins can manage users" - admins can see everything
-- 2. "Users can view their own profile" - users can see their own full profile
-- 3. "Users can update their own profile" - users can update their own profile

-- Now external/public access must use the security definer functions above
-- which only expose safe fields (no email, crypto addresses, etc.)