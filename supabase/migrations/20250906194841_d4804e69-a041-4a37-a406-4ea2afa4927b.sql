-- Fix testbabyacct user tier from 'pro' to 'mid'
-- First, find the user ID for testbabyacct
-- Then update their creator tier to 'mid' since they paid $29 which corresponds to mid tier

UPDATE public.creators 
SET tier = 'mid', updated_at = now()
WHERE user_id IN (
    SELECT id FROM public.users 
    WHERE handle = 'testbabyacct' OR email LIKE '%testbabyacct%'
) 
AND tier = 'pro';

-- Add a comment to document this fix
INSERT INTO public.admin_notes (user_id, admin_id, note)
SELECT 
    u.id,
    (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1),
    'Corrected creator tier from pro to mid - user paid $29 for mid tier but was incorrectly assigned pro tier'
FROM public.users u
WHERE u.handle = 'testbabyacct' OR u.email LIKE '%testbabyacct%';