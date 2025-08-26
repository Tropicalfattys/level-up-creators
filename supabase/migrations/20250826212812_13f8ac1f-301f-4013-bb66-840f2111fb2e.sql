
-- Fix the notifications table RLS policy to allow system-generated notifications
-- This will allow the booking update triggers to create notifications properly

-- Add INSERT policy for notifications table to allow system functions to create notifications
CREATE POLICY "System can create notifications" ON public.notifications
FOR INSERT 
WITH CHECK (true);

-- Also add a policy to allow admins to manage notifications
CREATE POLICY "Admins can manage notifications" ON public.notifications
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.id = auth.uid() AND users.role = 'admin'
));
