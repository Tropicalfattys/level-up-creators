-- Add public SELECT policy for user profiles
CREATE POLICY "Public user profiles are viewable by everyone" 
ON public.users 
FOR SELECT 
USING (true);