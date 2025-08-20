
-- Phase 1: Fix Database Data Integrity
-- First, let's check and fix the creator_id values in services table
-- Update services to use the correct creator_id from creators table instead of user_id

UPDATE public.services 
SET creator_id = c.id 
FROM public.creators c 
WHERE services.creator_id = c.user_id;

-- Add a foreign key constraint to prevent future issues
ALTER TABLE public.services 
ADD CONSTRAINT fk_services_creator_id 
FOREIGN KEY (creator_id) REFERENCES public.creators(id) ON DELETE CASCADE;

-- Ensure we have proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_creator_id ON public.services(creator_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_creator_id ON public.bookings(creator_id);
CREATE INDEX IF NOT EXISTS idx_messages_booking_id ON public.messages(booking_id);

-- Add missing deliverable_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='deliverable_url') THEN
        ALTER TABLE public.bookings ADD COLUMN deliverable_url TEXT;
    END IF;
END $$;
