
-- Create direct_messages table for user-to-user messaging
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL, 
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
CREATE POLICY "Users can view their direct messages" 
  ON public.direct_messages 
  FOR SELECT 
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can send direct messages
CREATE POLICY "Users can send direct messages" 
  ON public.direct_messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = from_user_id);

-- Add index for better performance
CREATE INDEX idx_direct_messages_users ON public.direct_messages(from_user_id, to_user_id);
CREATE INDEX idx_direct_messages_created_at ON public.direct_messages(created_at);
