-- Add role field to get_services_with_creators function
CREATE OR REPLACE FUNCTION public.get_services_with_creators(category_filter text DEFAULT NULL::text, search_query text DEFAULT NULL::text, min_price numeric DEFAULT 0, max_price numeric DEFAULT 999999, sort_option text DEFAULT 'newest'::text)
 RETURNS TABLE(service_id uuid, title text, description text, price_usdc numeric, delivery_days integer, category text, payment_method text, created_at timestamp with time zone, creator_id uuid, creator_handle text, creator_avatar_url text, creator_verified boolean, creator_rating numeric, creator_review_count integer, creator_tier text, creator_role text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
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
    COALESCE(c.review_count, 0) as creator_review_count,
    COALESCE(c.tier, 'basic') as creator_tier,
    u.role as creator_role
  FROM services s
  LEFT JOIN users u ON s.creator_id = u.id
  LEFT JOIN creators c ON s.creator_id = c.user_id
  WHERE s.active = true
    AND (category_filter IS NULL OR category_filter = '' OR category_filter = 'all' OR s.category = category_filter)
    AND (search_query IS NULL OR search_query = '' OR
         s.title ILIKE '%' || search_query || '%' OR 
         s.description ILIKE '%' || search_query || '%' OR
         s.category ILIKE '%' || search_query || '%' OR
         u.handle ILIKE '%' || search_query || '%')
    AND s.price_usdc >= min_price
    AND s.price_usdc <= max_price
    -- CRITICAL FIX: Add availability filtering
    AND (
      s.availability_type = 'everyone' 
      OR (
        s.availability_type = 'select_user' 
        AND s.target_username = (
          SELECT handle FROM users WHERE id = auth.uid()
        )
      )
    )
  ORDER BY 
    CASE WHEN sort_option = 'newest' THEN s.created_at END DESC,
    CASE WHEN sort_option = 'price_low' THEN s.price_usdc END ASC,
    CASE WHEN sort_option = 'price_high' THEN s.price_usdc END DESC,
    CASE WHEN sort_option = 'delivery_fast' THEN s.delivery_days END ASC,
    CASE WHEN sort_option = 'rating' THEN COALESCE(c.rating, 0) END DESC,
    s.created_at DESC;
$function$