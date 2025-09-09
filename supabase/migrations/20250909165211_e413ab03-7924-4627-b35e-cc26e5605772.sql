-- Fix the notify_pro_creator_approval function to handle tier upgrades
CREATE OR REPLACE FUNCTION public.notify_pro_creator_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify when creator is approved AND has pro tier (new approval)
  -- OR when an already-approved creator's tier changes to 'pro' (tier upgrade)
  IF (NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false) AND NEW.tier = 'pro')
     OR (NEW.approved = true AND OLD.approved = true AND OLD.tier != 'pro' AND NEW.tier = 'pro') THEN
    PERFORM public.create_notification(
      NEW.user_id,
      'pro_creator_approved',
      'Get Verified on LeveledUp',
      'Congratulations on becoming a Pro Creator! You''re now eligible for the verification badge that appears next to your username across the platform.

To get verified, simply:
1. Post your unique LeveledUp referral link on at least one major social platform (Twitter, Facebook, Instagram, or LinkedIn).
2. Post the same referral link on a second platform — this can be your Discord server, YouTube channel, or another major platform you didn''t use in Step 1.

Once both posts are live, submit the links in your Creator Dashboard. Our team will review and confirm your verification.

Start building trust and stand out with the verification badge today!'
    );
  END IF;
  
  RETURN NEW;
END;
$$;