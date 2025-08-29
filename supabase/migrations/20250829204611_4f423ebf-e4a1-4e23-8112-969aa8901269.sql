
-- Add payout tracking fields to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payout_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS paid_out_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS paid_out_by UUID;

-- Add index for efficient payout queries
CREATE INDEX IF NOT EXISTS idx_payments_payout_status ON public.payments(payout_status, status, payment_type);

-- Add check constraint for payout_status
ALTER TABLE public.payments 
ADD CONSTRAINT check_payout_status 
CHECK (payout_status IN ('pending', 'completed', 'cancelled'));
