
-- Update the handle_new_user function to properly process referral codes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  referrer_user_id uuid;
  referral_code_input text;
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

  -- Insert new user record
  INSERT INTO public.users (id, email, handle, referral_code, role, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'handle', SPLIT_PART(NEW.email, '@', 1)),
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
