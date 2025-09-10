-- Create a function to get service titles for reviews with elevated permissions
CREATE OR REPLACE FUNCTION public.get_service_titles_for_reviews(review_ids uuid[])
RETURNS TABLE(review_id uuid, service_title text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.id as review_id,
    COALESCE(s.title, 'Service') as service_title
  FROM reviews r
  LEFT JOIN bookings b ON r.booking_id = b.id
  LEFT JOIN services s ON b.service_id = s.id
  WHERE r.id = ANY(review_ids);
$$;