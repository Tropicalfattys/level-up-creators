
-- Fix the RLS policy for reviews to include 'refunded' status
-- This allows users to leave reviews after disputed bookings are resolved
DROP POLICY IF EXISTS "Users can create reviews for their bookings" ON public.reviews;

CREATE POLICY "Users can create reviews for their bookings" ON public.reviews
FOR INSERT 
WITH CHECK (
  (auth.uid() = reviewer_id) AND 
  (EXISTS ( 
    SELECT 1
    FROM bookings b
    WHERE (
      (b.id = reviews.booking_id) AND 
      ((b.client_id = auth.uid()) OR (b.creator_id = auth.uid())) AND 
      (b.status = ANY (ARRAY['accepted'::text, 'released'::text, 'refunded'::text]))
    )
  ))
);
