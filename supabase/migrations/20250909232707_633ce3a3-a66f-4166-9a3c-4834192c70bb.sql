-- Drop and recreate functions to include avatar_url
-- This fixes the broken profile images and creator listings

DROP FUNCTION IF EXISTS public.get_public_profile(uuid);
DROP FUNCTION IF EXISTS public.get_public_profile_by_handle(text);  
DROP FUNCTION IF EXISTS public.get_public_creators(boolean);

CREATE OR REPLACE FUNCTION public.get_public_profile(user_id_param uuid)
 RETURNS TABLE(id uuid, handle text, verified boolean, bio text, created_at timestamp with time zone, avatar_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    u.id,
    u.handle,
    u.verified,
    u.bio,
    u.created_at,
    u.avatar_url
  FROM public.users u
  WHERE u.id = user_id_param 
    AND (u.banned = false OR u.banned IS NULL);
$function$;

CREATE OR REPLACE FUNCTION public.get_public_profile_by_handle(handle_param text)
 RETURNS TABLE(id uuid, handle text, verified boolean, bio text, created_at timestamp with time zone, avatar_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    u.id,
    u.handle,
    u.verified,
    u.bio,
    u.created_at,
    u.avatar_url
  FROM public.users u
  WHERE u.handle = handle_param 
    AND (u.banned = false OR u.banned IS NULL);
$function$;

CREATE OR REPLACE FUNCTION public.get_public_creators(approved_only boolean DEFAULT true)
 RETURNS TABLE(id uuid, user_id uuid, headline text, category text, tier text, rating numeric, review_count integer, created_at timestamp with time zone, handle text, verified boolean, bio text, avatar_url text)
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
    u.bio,
    u.avatar_url
  FROM public.creators c
  JOIN public.users u ON c.user_id = u.id
  WHERE (NOT approved_only OR c.approved = true)
    AND (u.banned = false OR u.banned IS NULL);
$function$;