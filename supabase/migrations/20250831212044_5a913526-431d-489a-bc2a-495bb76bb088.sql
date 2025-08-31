
-- Add refund_tx_hash column to disputes table to track refund transactions
ALTER TABLE public.disputes 
ADD COLUMN refund_tx_hash text,
ADD COLUMN refunded_at timestamp with time zone;

-- Add comment for clarity
COMMENT ON COLUMN public.disputes.refund_tx_hash IS 'Transaction hash for refund payment when dispute is resolved in favor of client';
COMMENT ON COLUMN public.disputes.refunded_at IS 'Timestamp when refund was processed';
