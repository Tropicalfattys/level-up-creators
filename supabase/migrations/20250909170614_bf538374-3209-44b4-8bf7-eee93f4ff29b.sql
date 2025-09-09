-- Fix creator tier upgrade 403 error by allowing users to view their own creator records
-- Update the SELECT policy on creators table to allow users to see their own records even when unapproved

DROP POLICY IF EXISTS "Approved creators basic info viewable by everyone" ON public.creators;

CREATE POLICY "Approved creators basic info viewable by everyone" 
ON public.creators 
FOR SELECT 
USING (approved = true OR auth.uid() = user_id);