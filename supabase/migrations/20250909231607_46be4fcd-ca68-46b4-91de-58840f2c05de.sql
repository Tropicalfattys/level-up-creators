-- Fix security warnings by setting proper search_path for functions that don't have it
-- Update existing functions that are missing search_path

-- Fix update_pricing_tier_updated_at function
CREATE OR REPLACE FUNCTION public.update_pricing_tier_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix update_payments_updated_at function
CREATE OR REPLACE FUNCTION public.update_payments_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix update_creators_updated_at function
CREATE OR REPLACE FUNCTION public.update_creators_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix update_job_postings_updated_at function
CREATE OR REPLACE FUNCTION public.update_job_postings_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix update_platform_wallets_updated_at function
CREATE OR REPLACE FUNCTION public.update_platform_wallets_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix update_creator_rating function
CREATE OR REPLACE FUNCTION public.update_creator_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update creator rating and review count
  UPDATE public.creators 
  SET 
    rating = (
      SELECT COALESCE(AVG(r.rating), 0) 
      FROM public.reviews r 
      WHERE r.reviewee_id = NEW.reviewee_id
    ),
    review_count = (
      SELECT COUNT(*) 
      FROM public.reviews r 
      WHERE r.reviewee_id = NEW.reviewee_id
    ),
    updated_at = now()
  WHERE user_id = NEW.reviewee_id;
  
  RETURN NEW;
END;
$function$;

-- Fix update_user_role_on_creator_approval function
CREATE OR REPLACE FUNCTION public.update_user_role_on_creator_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If creator is being approved (approved changes from false/null to true)
  IF NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false) THEN
    -- Update the user's role to 'creator'
    UPDATE users 
    SET role = 'creator', updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix handle_creator_approval function
CREATE OR REPLACE FUNCTION public.handle_creator_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- When a creator is approved, update their user role to 'creator'
  IF NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false) THEN
    UPDATE public.users 
    SET role = 'creator', updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  
  -- If approval is revoked, set role back to 'client'
  IF NEW.approved = false AND OLD.approved = true THEN
    UPDATE public.users 
    SET role = 'client', updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$function$;