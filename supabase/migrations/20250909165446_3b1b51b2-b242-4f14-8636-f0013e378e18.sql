-- Test the tier upgrade notification for WILLWOO user
UPDATE creators 
SET tier = 'pro', updated_at = now() 
WHERE user_id = '723ed174-2c4e-42b4-96dc-6b6d1dd8817f' 
AND approved = true;