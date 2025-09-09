-- Clean up massive base64 avatar URLs that are causing performance issues
UPDATE public.users 
SET avatar_url = NULL 
WHERE avatar_url IS NOT NULL 
  AND LENGTH(avatar_url) > 1000; -- Remove extremely long base64 URLs

-- Update database functions to exclude avatar_url for performance

-- Update get_public_profile function to exclude avatar_url
CREATE OR REPLACE FUNCTION public.get_public_profile(user_id_param uuid)
 RETURNS TABLE(id uuid, handle text, verified boolean, bio text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    u.id,
    u.handle,
    u.verified,
    u.bio,
    u.created_at
  FROM public.users u
  WHERE u.id = user_id_param 
    AND (u.banned = false OR u.banned IS NULL);
$function$;

-- Update get_public_profile_by_handle function to exclude avatar_url
CREATE OR REPLACE FUNCTION public.get_public_profile_by_handle(handle_param text)
 RETURNS TABLE(id uuid, handle text, verified boolean, bio text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    u.id,
    u.handle,
    u.verified,
    u.bio,
    u.created_at
  FROM public.users u
  WHERE u.handle = handle_param 
    AND (u.banned = false OR u.banned IS NULL);
$function$;

-- Update get_public_creators function to exclude avatar_url
CREATE OR REPLACE FUNCTION public.get_public_creators(approved_only boolean DEFAULT true)
 RETURNS TABLE(id uuid, user_id uuid, headline text, category text, tier text, rating numeric, review_count integer, created_at timestamp with time zone, handle text, verified boolean, bio text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    c.id,
    c.user_id,
    c.headline,
    c.category,
    c.tier,
    c.rating,
    c.review_count,
    c.created_at,
    u.handle,
    u.verified,
    u.bio
  FROM public.creators c
  JOIN public.users u ON c.user_id = u.id
  WHERE (NOT approved_only OR c.approved = true)
    AND (u.banned = false OR u.banned IS NULL);
$function$;