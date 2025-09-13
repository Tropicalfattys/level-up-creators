-- Update get_public_profile function to include role
CREATE OR REPLACE FUNCTION public.get_public_profile(user_id_param uuid)
 RETURNS TABLE(id uuid, handle text, verified boolean, bio text, created_at timestamp with time zone, avatar_url text, role text)
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
    u.avatar_url,
    u.role
  FROM public.users u
  WHERE u.id = user_id_param 
    AND (u.banned = false OR u.banned IS NULL);
$function$;

-- Update get_public_profile_by_handle function to include role
CREATE OR REPLACE FUNCTION public.get_public_profile_by_handle(handle_param text)
 RETURNS TABLE(id uuid, handle text, verified boolean, bio text, created_at timestamp with time zone, avatar_url text, role text)
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
    u.avatar_url,
    u.role
  FROM public.users u
  WHERE u.handle = handle_param 
    AND (u.banned = false OR u.banned IS NULL);
$function$;