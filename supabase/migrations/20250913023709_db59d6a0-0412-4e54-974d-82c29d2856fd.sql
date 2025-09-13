-- Add refund tracking fields to bookings table for rejected bookings
ALTER TABLE public.bookings 
ADD COLUMN refund_tx_hash text,
ADD COLUMN refunded_at timestamp with time zone;