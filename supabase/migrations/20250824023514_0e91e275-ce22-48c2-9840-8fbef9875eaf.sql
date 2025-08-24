
-- Add additional payout address fields to creators table
ALTER TABLE public.creators 
ADD COLUMN IF NOT EXISTS payout_address_bsc text,
ADD COLUMN IF NOT EXISTS payout_address_sui text,
ADD COLUMN IF NOT EXISTS payout_address_cardano text;

-- Update the users table to include these fields as well (for user profile settings)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS payout_address_bsc text,
ADD COLUMN IF NOT EXISTS payout_address_sui text,
ADD COLUMN IF NOT EXISTS payout_address_cardano text;

-- Add payment_method field to services table if it doesn't exist
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'ethereum_usdc';
