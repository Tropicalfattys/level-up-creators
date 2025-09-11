-- Fix justaguy420's incorrectly auto-approved Pro Creator status
-- Revert them back to their last verified tier (mid/Creator Plus)
UPDATE creators 
SET 
  tier = 'mid',
  approved = true,  -- They should keep their verified Creator Plus access
  updated_at = now()
WHERE user_id = (
  SELECT id FROM users WHERE handle = 'Justaguy420'
) AND tier = 'pro' AND approved = true;