-- Fix data issues for referral system
-- 1. Correct TommyPatera39's referral credits from $2 to $1
UPDATE users 
SET referral_credits = 1.00, updated_at = now()
WHERE id = '1b937ba9-d92f-4b05-9a60-8278ab3cf85a';

-- 2. Fix TreyPoc's referral link to point to TommyPatera39
UPDATE users 
SET referred_by = '1b937ba9-d92f-4b05-9a60-8278ab3cf85a', updated_at = now()
WHERE id = 'dae28f61-48b2-42c5-9d64-c88e590df34d';

-- 3. Add RUdone's credit to tracking table to prevent future duplicates
INSERT INTO referral_credits_awarded (referrer_id, referred_user_id, booking_id, credit_amount)
VALUES (
  '1b937ba9-d92f-4b05-9a60-8278ab3cf85a', -- TommyPatera39
  'a88d2638-4277-4c6c-bf73-9f5ff0b62e0a', -- RUdone
  '9008e1ee-f8ab-49cd-8492-4376a74b4813', -- RUdone's accepted booking
  1.00
);