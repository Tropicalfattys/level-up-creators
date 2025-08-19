
-- Add referral system fields to users table
ALTER TABLE public.users ADD COLUMN referral_code TEXT UNIQUE;
ALTER TABLE public.users ADD COLUMN referral_credits NUMERIC(10,2) DEFAULT 0;

-- Generate referral codes for existing users (8 character random string)
UPDATE public.users 
SET referral_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Update the handle_new_user function to generate referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, handle, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'handle', SPLIT_PART(NEW.email, '@', 1)),
    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make michaelweston1515@gmail.com an admin
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'michaelweston1515@gmail.com';

-- If the user doesn't exist yet, we'll handle it in the trigger when they sign up
-- Let's also update the trigger to handle admin assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, handle, referral_code, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'handle', SPLIT_PART(NEW.email, '@', 1)),
    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),
    CASE 
      WHEN NEW.email = 'michaelweston1515@gmail.com' THEN 'admin'
      ELSE 'client'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
