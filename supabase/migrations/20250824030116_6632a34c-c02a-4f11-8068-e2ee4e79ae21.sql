
-- First, let's see what the current check constraint allows
-- Then update it to include 'pending' as a valid status

-- Drop the existing constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add the updated constraint with all valid booking statuses
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'paid', 'in_progress', 'delivered', 'accepted', 'disputed', 'refunded', 'released', 'canceled'));
