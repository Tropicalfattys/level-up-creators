
-- Add missing wallet address columns to users table
ALTER TABLE public.users 
ADD COLUMN payout_address_eth TEXT,
ADD COLUMN payout_address_sol TEXT;

-- If there's any existing wallet data in creators table, migrate it to users table
UPDATE public.users 
SET 
  payout_address_eth = creators.payout_address_eth,
  payout_address_sol = creators.payout_address_sol
FROM public.creators 
WHERE users.id = creators.user_id 
AND (creators.payout_address_eth IS NOT NULL OR creators.payout_address_sol IS NOT NULL);
