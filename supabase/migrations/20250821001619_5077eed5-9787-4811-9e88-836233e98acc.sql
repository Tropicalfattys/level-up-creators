
-- Fix the database integrity issue: Update services to use correct creator_id
-- First, let's see what we're working with and fix the data

-- Update services table to use the correct creator_id from the creators table
-- The issue is that services.creator_id currently contains user_id instead of the actual creator.id
UPDATE services 
SET creator_id = (
  SELECT c.id 
  FROM creators c 
  WHERE c.user_id = services.creator_id
)
WHERE EXISTS (
  SELECT 1 
  FROM creators c 
  WHERE c.user_id = services.creator_id
);

-- Add a proper foreign key constraint to prevent future issues
ALTER TABLE services 
ADD CONSTRAINT fk_services_creator_id 
FOREIGN KEY (creator_id) REFERENCES creators(id);

-- Also ensure bookings reference the correct creator_id (user_id, not creator table id)
-- Bookings should reference users.id, not creators.id
-- Let's check if we need to fix bookings table as well
-- Update bookings to use user_id for creator_id field (this should be the user's ID, not the creator record ID)
UPDATE bookings 
SET creator_id = (
  SELECT c.user_id 
  FROM creators c 
  WHERE c.id = bookings.creator_id
)
WHERE EXISTS (
  SELECT 1 
  FROM creators c 
  WHERE c.id = bookings.creator_id
);
