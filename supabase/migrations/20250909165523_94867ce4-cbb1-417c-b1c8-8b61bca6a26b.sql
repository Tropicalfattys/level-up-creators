-- Test the notification trigger properly by changing tier from mid to pro
UPDATE creators 
SET tier = 'mid' 
WHERE user_id = '723ed174-2c4e-42b4-96dc-6b6d1dd8817f';

-- Now update to pro to trigger the notification
UPDATE creators 
SET tier = 'pro' 
WHERE user_id = '723ed174-2c4e-42b4-96dc-6b6d1dd8817f';