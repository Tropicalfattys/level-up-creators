
-- Add RLS policy to allow admins to manage user roles
CREATE POLICY "Admins can manage users" 
ON public.users 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Add banned field for soft bans (optional but recommended)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS banned boolean DEFAULT false;

-- Update the existing RLS policy to exclude banned users from public view
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users 
FOR SELECT 
USING (banned = false OR banned IS NULL);
