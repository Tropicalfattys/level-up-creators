-- Fix bookings status check constraint to include rejected_by_creator
-- Drop the existing constraint
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Recreate the constraint with the new status included
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'paid', 'payment_rejected', 'in_progress', 'delivered', 'accepted', 'disputed', 'refunded', 'released', 'canceled', 'rejected_by_creator'));