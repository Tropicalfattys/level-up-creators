
-- Drop the existing check constraint if it exists
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS check_payout_status;

-- Add a new check constraint that allows both 'pending' and 'paid_out' values
ALTER TABLE public.payments ADD CONSTRAINT check_payout_status 
CHECK (payout_status IN ('pending', 'paid_out'));
