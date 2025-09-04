-- Add availability fields to services table
ALTER TABLE public.services 
ADD COLUMN availability_type text DEFAULT 'everyone' NOT NULL,
ADD COLUMN target_username text;

-- Add check constraint to ensure availability_type has valid values
ALTER TABLE public.services 
ADD CONSTRAINT services_availability_type_check 
CHECK (availability_type IN ('everyone', 'select_user'));

-- Add comment for clarity
COMMENT ON COLUMN public.services.availability_type IS 'Determines who can see and book this service: everyone or select_user';
COMMENT ON COLUMN public.services.target_username IS 'Username of specific user who can book this service when availability_type is select_user';