
-- Add missing updated_at column to creators table
ALTER TABLE public.creators 
ADD COLUMN updated_at timestamp with time zone DEFAULT now();

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_creators_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER update_creators_updated_at_trigger
  BEFORE UPDATE ON public.creators
  FOR EACH ROW
  EXECUTE FUNCTION update_creators_updated_at();
