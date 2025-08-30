
-- Add missing payout columns to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payout_tx_hash text,
ADD COLUMN IF NOT EXISTS payout_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS paid_out_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS paid_out_by uuid;

-- Add comments to document the new columns
COMMENT ON COLUMN public.payments.payout_tx_hash IS 'Transaction hash for when admin pays out to creator';
COMMENT ON COLUMN public.payments.payout_status IS 'Status of payout: pending, paid_out';
COMMENT ON COLUMN public.payments.paid_out_at IS 'Timestamp when payout was completed';
COMMENT ON COLUMN public.payments.paid_out_by IS 'Admin user ID who processed the payout';
