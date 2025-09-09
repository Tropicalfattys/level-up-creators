-- Reset tier to mid and then update to pro to test notification trigger
UPDATE creators 
SET tier = 'mid', updated_at = now() 
WHERE user_id = '723ed174-2c4e-42b4-96dc-6b6d1dd8817f';

-- Now upgrade to pro to trigger notification  
UPDATE creators 
SET tier = 'pro', updated_at = now() 
WHERE user_id = '723ed174-2c4e-42b4-96dc-6b6d1dd8817f';