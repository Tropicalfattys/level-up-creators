-- Fix ProtonHomie's data: they have a verified Creator Plus payment so should have creator access
UPDATE users 
SET role = 'creator', updated_at = now()
WHERE handle = 'ProtonHomie';

UPDATE creators 
SET approved = true, updated_at = now()
WHERE user_id = (SELECT id FROM users WHERE handle = 'ProtonHomie');