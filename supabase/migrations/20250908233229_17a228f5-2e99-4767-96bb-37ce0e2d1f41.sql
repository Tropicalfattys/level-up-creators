-- Fix search path security warnings for the new functions
CREATE OR REPLACE FUNCTION public.validate_username_restrictions(username_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  cleaned_username text;
  forbidden_usernames text[] := ARRAY[
    'admin', 'support', 'levelup', 'leveledup', 'ruleveledup', 'staff', 'team', 
    'techsupport', 'tech-support', 'leveledupteam', 'leveledupsupport', 'escrow', 
    'payment', 'verified', 'verify', 'ruleveledupverified', 'ruleveledupstaff', 
    'ruleveledupadmin', 'ruleveledupteam', 'teamruleveledup', 'leveledupstaff', 
    'leveledupverify', 'leveledupadmin', 'ruleveledupverify', 'ruleveledupverification', 
    'ruleveledupverficationteam', 'ruleveledupescrow', 'ruleveleduppayment', 
    'ruleveledupsupport', 'levelupstaff', 'levelupsupport', 'levelupverify', 
    'leveledup-techsupport', 'ruleveledup-techsupport'
  ];
  forbidden_keywords text[] := ARRAY[
    'admin', 'official', 'support', 'leveledup', 'ruleveledup', 'verify', 
    'escow', 'techsupport', 'tech-support'
  ];
  keyword text;
BEGIN
  -- Return false if username is null or empty
  IF username_input IS NULL OR TRIM(username_input) = '' THEN
    RETURN false;
  END IF;
  
  -- Clean and normalize the username (lowercase, trim)
  cleaned_username := LOWER(TRIM(username_input));
  
  -- Check if username is in the forbidden list (exact match)
  IF cleaned_username = ANY(forbidden_usernames) THEN
    RETURN false;
  END IF;
  
  -- Check if username contains any forbidden keywords
  FOREACH keyword IN ARRAY forbidden_keywords
  LOOP
    IF cleaned_username LIKE '%' || keyword || '%' THEN
      RETURN false;
    END IF;
  END LOOP;
  
  -- If all checks pass, username is valid
  RETURN true;
END;
$$;

-- Fix search path for username update validation function
CREATE OR REPLACE FUNCTION public.validate_username_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only validate if handle is being changed
  IF OLD.handle IS DISTINCT FROM NEW.handle THEN
    -- Validate the new username
    IF NOT public.validate_username_restrictions(NEW.handle) THEN
      RAISE EXCEPTION 'Username contains forbidden words or is not allowed. Please choose a different username.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;