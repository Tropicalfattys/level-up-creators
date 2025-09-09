-- Test the notification trigger by updating WILLWOO user's tier to pro
UPDATE creators 
SET tier = 'pro' 
WHERE user_id = '723ed174-2c4e-42b4-96dc-6b6d1dd8817f';