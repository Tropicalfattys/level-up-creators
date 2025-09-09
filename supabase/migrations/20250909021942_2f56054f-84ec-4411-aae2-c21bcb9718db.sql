-- Create security definer function to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Drop existing policy that causes circular reference
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;

-- Create new policy using the security definer function
CREATE POLICY "Admins can manage users" ON public.users
FOR ALL USING (public.get_current_user_role() = 'admin');