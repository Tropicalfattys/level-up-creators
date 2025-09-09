-- Fix the search_path security warnings for the new functions
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
SET search_path = public
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

-- Fix the search_path security warning for the second function
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
SET search_path = public
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