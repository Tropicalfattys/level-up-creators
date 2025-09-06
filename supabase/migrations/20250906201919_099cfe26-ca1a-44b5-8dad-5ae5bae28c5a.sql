-- URGENT: Restore admin access and fix tier assignments
-- Fix the admin user's role and tier that were incorrectly changed

-- 1. Restore admin role for michaelweston1515@gmail.com
UPDATE public.users 
SET role = 'admin', updated_at = now()
WHERE email = 'michaelweston1515@gmail.com';

-- 2. Fix admin user's creator tier from 'pro' to 'mid' (they paid $29 = mid tier)
UPDATE public.creators 
SET tier = 'mid', updated_at = now()
WHERE user_id = (
    SELECT id FROM public.users 
    WHERE email = 'michaelweston1515@gmail.com'
) 
AND tier = 'pro';

-- 3. Add admin notes documenting these critical corrections
INSERT INTO public.admin_notes (user_id, admin_id, note)
VALUES (
    (SELECT id FROM public.users WHERE email = 'michaelweston1515@gmail.com'),
    (SELECT id FROM public.users WHERE email = 'michaelweston1515@gmail.com'),
    'CRITICAL FIX: Restored admin role and corrected creator tier from pro to mid. User paid $29 for mid tier but was incorrectly assigned pro tier and lost admin access due to role overwrite bug in AdminPayments.tsx'
);

-- 4. Also fix willwoo user tier from 'pro' to 'mid' if still incorrect
UPDATE public.creators 
SET tier = 'mid', updated_at = now()
WHERE user_id IN (
    SELECT id FROM public.users 
    WHERE handle = 'willwoo' OR email LIKE '%willwoo%'
) 
AND tier = 'pro';

-- Add admin note for willwoo fix
INSERT INTO public.admin_notes (user_id, admin_id, note)
SELECT 
    u.id,
    (SELECT id FROM public.users WHERE email = 'michaelweston1515@gmail.com'),
    'Corrected creator tier from pro to mid - user paid $29 for mid tier but was incorrectly assigned pro tier'
FROM public.users u
WHERE (u.handle = 'willwoo' OR u.email LIKE '%willwoo%')
AND EXISTS (SELECT 1 FROM public.creators c WHERE c.user_id = u.id);