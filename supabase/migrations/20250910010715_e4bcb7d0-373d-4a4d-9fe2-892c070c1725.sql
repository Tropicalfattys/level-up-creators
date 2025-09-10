-- Emergency RLS Policy Fixes for Search Functionality
-- These changes restore public access to essential data while maintaining security

-- 1. Ensure services are truly publicly visible for active services
DROP POLICY IF EXISTS "Services are viewable by everyone" ON public.services;
CREATE POLICY "Active services are publicly viewable"
ON public.services
FOR SELECT
USING (active = true);

-- 2. Ensure users table allows public profile access (handle, avatar, verified status)
DROP POLICY IF EXISTS "Public user profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public profiles viewable by everyone"
ON public.users
FOR SELECT
USING (true);

-- 3. Ensure categories remain publicly accessible
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Active categories are publicly viewable"
ON public.categories
FOR SELECT
USING (active = true);

-- 4. Create a simplified function to get services with creator info for better performance
CREATE OR REPLACE FUNCTION public.get_services_with_creators(
  category_filter text DEFAULT NULL,
  search_query text DEFAULT NULL,
  min_price numeric DEFAULT 0,
  max_price numeric DEFAULT 999999,
  sort_option text DEFAULT 'newest'
)
RETURNS TABLE(
  service_id uuid,
  title text,
  description text,
  price_usdc numeric,
  delivery_days integer,
  category text,
  payment_method text,
  created_at timestamp with time zone,
  creator_id uuid,
  creator_handle text,
  creator_avatar_url text,
  creator_verified boolean,
  creator_rating numeric,
  creator_review_count integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT
    s.id as service_id,
    s.title,
    s.description,
    s.price_usdc,
    s.delivery_days,
    s.category,
    s.payment_method,
    s.created_at,
    s.creator_id,
    u.handle as creator_handle,
    u.avatar_url as creator_avatar_url,
    u.verified as creator_verified,
    COALESCE(c.rating, 0) as creator_rating,
    COALESCE(c.review_count, 0) as creator_review_count
  FROM services s
  LEFT JOIN users u ON s.creator_id = u.id
  LEFT JOIN creators c ON s.creator_id = c.user_id
  WHERE s.active = true
    AND (category_filter IS NULL OR category_filter = 'all' OR s.category = category_filter)
    AND (search_query IS NULL OR 
         s.title ILIKE '%' || search_query || '%' OR 
         s.description ILIKE '%' || search_query || '%' OR
         s.category ILIKE '%' || search_query || '%' OR
         u.handle ILIKE '%' || search_query || '%')
    AND s.price_usdc >= min_price
    AND s.price_usdc <= max_price
  ORDER BY 
    CASE 
      WHEN sort_option = 'price_low' THEN s.price_usdc
      WHEN sort_option = 'delivery_fast' THEN s.delivery_days
      ELSE NULL
    END ASC,
    CASE 
      WHEN sort_option = 'price_high' THEN s.price_usdc
      WHEN sort_option = 'rating' THEN COALESCE(c.rating, 0)
      ELSE NULL
    END DESC,
    CASE
      WHEN sort_option = 'newest' OR sort_option IS NULL THEN s.created_at
      ELSE NULL
    END DESC;
$$;