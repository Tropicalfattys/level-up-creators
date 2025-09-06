-- Fix willwoo user tier from 'pro' to 'mid' 
-- User paid $29 which corresponds to mid tier based on current pricing

UPDATE public.creators 
SET tier = 'mid', updated_at = now()
WHERE user_id IN (
    SELECT id FROM public.users 
    WHERE handle = 'willwoo' OR email LIKE '%willwoo%'
) 
AND tier = 'pro';

-- Add admin note documenting this correction
INSERT INTO public.admin_notes (user_id, admin_id, note)
SELECT 
    u.id,
    (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1),
    'Corrected creator tier from pro to mid - user paid $29 for mid tier but was incorrectly assigned pro tier due to hardcoded fallback logic'
FROM public.users u
WHERE u.handle = 'willwoo' OR u.email LIKE '%willwoo%';