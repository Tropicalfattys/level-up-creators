-- Create notification function for creator payouts
CREATE OR REPLACE FUNCTION public.notify_creator_payout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- When payout_tx_hash is added (payout completed)
  IF NEW.payout_tx_hash IS NOT NULL AND OLD.payout_tx_hash IS NULL THEN
    PERFORM public.create_notification(
      NEW.creator_id,
      'payout_completed',
      'Payment Complete!',
      'Your payment has been processed and sent to your wallet. Check your Creator Dashboard for transaction details.'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create notification function for new booking messages
CREATE OR REPLACE FUNCTION public.notify_new_booking_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Don't notify the sender of their own message
  IF NEW.from_user_id != NEW.to_user_id THEN
    PERFORM public.create_notification(
      NEW.to_user_id,
      'new_message',
      'New Message',
      'You have a new message in your booking chat.',
      NEW.booking_id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create notification function for new direct messages
CREATE OR REPLACE FUNCTION public.notify_new_direct_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Don't notify the sender of their own message
  IF NEW.from_user_id != NEW.to_user_id THEN
    PERFORM public.create_notification(
      NEW.to_user_id,
      'new_direct_message',
      'New Direct Message',
      'You have received a new direct message.'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update existing function to handle mid-tier creator approvals
CREATE OR REPLACE FUNCTION public.notify_pro_creator_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

3. Once your verification posts are live on your social media accounts, submit the links in your dashboard on the Settings page under the Social & Links tab, in the section titled Verify Social Media Accounts For Pro Creators. Start building trust and stand out with the verification badge today!'
    );
  END IF;
  
  -- Notify when creator is approved AND has plus tier (new approval)
  -- OR when an already-approved creator's tier changes to 'plus' (tier upgrade)
  IF (NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false) AND NEW.tier = 'plus')
     OR (NEW.approved = true AND OLD.approved = true AND OLD.tier != 'plus' AND NEW.tier = 'plus') THEN
    PERFORM public.create_notification(
      NEW.user_id,
      'creator_plus_approved',
      'Creator Plus Approved!',
      'Congratulations on becoming a Creator Plus! You now have access to additional features and can start offering your services to the community.'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create triggers for the new notification functions
CREATE TRIGGER notify_creator_payout_trigger
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_creator_payout();

CREATE TRIGGER notify_new_booking_message_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_booking_message();

CREATE TRIGGER notify_new_direct_message_trigger
  AFTER INSERT ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_direct_message();