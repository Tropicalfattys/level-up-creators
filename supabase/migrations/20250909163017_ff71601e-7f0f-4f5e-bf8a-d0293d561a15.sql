-- Create function to notify when pro creators get approved
CREATE OR REPLACE FUNCTION public.notify_pro_creator_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only notify when creator is approved AND has pro tier
  IF NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false) AND NEW.tier = 'pro' THEN
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

-- Create function to notify when users are restricted/unrestricted
CREATE OR REPLACE FUNCTION public.notify_user_restriction_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- User gets restricted (banned = true)
  IF NEW.banned = true AND (OLD.banned IS NULL OR OLD.banned = false) THEN
    PERFORM public.create_notification(
      NEW.id,
      'account_restricted',
      'Your Account Access is Temporarily Restricted',
      'Your LeveledUp account has been temporarily restricted. During this period, you will not be able to access the platform.

This action was taken as part of our review and investigation process. Once the review is complete, we will notify you of the outcome.

We appreciate your patience and cooperation while we complete this process.'
    );
  END IF;
  
  -- User gets unrestricted (banned = false)
  IF NEW.banned = false AND OLD.banned = true THEN
    PERFORM public.create_notification(
      NEW.id,
      'account_restored',
      'Your Account Access Has Been Restored!',
      'Good news! Your LeveledUp account access has been restored. Our investigation is complete, and you may now log back in and continue using the platform.

Thank you for your patience during this process, and welcome back to the community!'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for pro creator approval notifications
CREATE TRIGGER notify_pro_creator_approval_trigger
  AFTER UPDATE ON public.creators
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_pro_creator_approval();

-- Create trigger for user restriction/unrestriction notifications  
CREATE TRIGGER notify_user_restriction_changes_trigger
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_restriction_changes();