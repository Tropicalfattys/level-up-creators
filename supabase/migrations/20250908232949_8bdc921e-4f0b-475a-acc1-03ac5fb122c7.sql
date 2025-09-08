-- Create a function to validate username restrictions
CREATE OR REPLACE FUNCTION public.validate_username_restrictions(username_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Update the handle_new_user function to include username validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  referrer_user_id uuid;
  referral_code_input text;
  user_handle text;
BEGIN
  -- Extract referral code from user metadata
  referral_code_input := NEW.raw_user_meta_data->>'referral_code';
  
  -- Look up the referrer by referral code if provided
  IF referral_code_input IS NOT NULL AND referral_code_input != '' THEN
    SELECT id INTO referrer_user_id 
    FROM public.users 
    WHERE referral_code = UPPER(TRIM(referral_code_input))
    LIMIT 1;
  END IF;

  -- Get the handle, defaulting to email prefix if not provided
  user_handle := COALESCE(NEW.raw_user_meta_data->>'handle', SPLIT_PART(NEW.email, '@', 1));
  
  -- Validate the username against restrictions
  IF NOT public.validate_username_restrictions(user_handle) THEN
    RAISE EXCEPTION 'Username contains forbidden words or is not allowed. Please choose a different username.';
  END IF;

  -- Insert new user record
  INSERT INTO public.users (id, email, handle, referral_code, role, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    user_handle,
    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),
    CASE 
      WHEN NEW.email = 'michaelweston1515@gmail.com' THEN 'admin'
      ELSE 'client'
    END,
    referrer_user_id  -- This will be NULL if no valid referral code was provided
  );
  
  RETURN NEW;
END;
$$;

-- Create a trigger function for username updates
CREATE OR REPLACE FUNCTION public.validate_username_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger for username updates
DROP TRIGGER IF EXISTS validate_username_update_trigger ON public.users;
CREATE TRIGGER validate_username_update_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_username_update();