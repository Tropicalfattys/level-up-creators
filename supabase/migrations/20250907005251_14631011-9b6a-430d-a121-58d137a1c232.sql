-- Update all existing bookings linked to rejected payments to 'payment_rejected' status
-- This fixes the historical data gap where bookings were created before our sync function

UPDATE public.bookings 
SET 
  status = 'payment_rejected',
  updated_at = now()
WHERE id IN (
  SELECT DISTINCT b.id 
  FROM public.bookings b
  INNER JOIN public.payments p ON b.id = p.booking_id
  WHERE p.status = 'rejected' 
  AND b.status != 'payment_rejected'
);

-- Create notifications for these updated bookings
-- Notify both client and creator about the payment rejection
INSERT INTO public.notifications (user_id, type, title, message, booking_id)
SELECT 
  b.client_id,
  'payment_rejected',
  'Payment Rejected',
  'Your payment has been rejected. Please try again or contact support.',
  b.id
FROM public.bookings b
INNER JOIN public.payments p ON b.id = p.booking_id
WHERE p.status = 'rejected' 
AND b.status = 'payment_rejected'
AND NOT EXISTS (
  SELECT 1 FROM public.notifications n 
  WHERE n.booking_id = b.id 
  AND n.type = 'payment_rejected' 
  AND n.user_id = b.client_id
);

INSERT INTO public.notifications (user_id, type, title, message, booking_id)
SELECT 
  b.creator_id,
  'payment_rejected',
  'Payment Rejected',
  'A payment for your booking has been rejected.',
  b.id
FROM public.bookings b
INNER JOIN public.payments p ON b.id = p.booking_id
WHERE p.status = 'rejected' 
AND b.status = 'payment_rejected'
AND NOT EXISTS (
  SELECT 1 FROM public.notifications n 
  WHERE n.booking_id = b.id 
  AND n.type = 'payment_rejected' 
  AND n.user_id = b.creator_id
);