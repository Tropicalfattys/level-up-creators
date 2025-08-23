
-- Add foreign key constraints to direct_messages table to establish proper relationships with users
ALTER TABLE public.direct_messages
ADD CONSTRAINT direct_messages_from_user_id_fkey 
FOREIGN KEY (from_user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.direct_messages
ADD CONSTRAINT direct_messages_to_user_id_fkey 
FOREIGN KEY (to_user_id) REFERENCES public.users(id) ON DELETE CASCADE;
