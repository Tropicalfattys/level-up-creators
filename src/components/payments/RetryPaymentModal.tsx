import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, DollarSign, User, AlertCircle } from 'lucide-react';
import { PaymentInstructions } from '@/components/payments/PaymentInstructions';
import { PAYMENT_METHODS } from '@/lib/contracts';

interface RetryPaymentModalProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
  onPaymentRetried: () => void;
}

export const RetryPaymentModal = ({ bookingId, isOpen, onClose, onPaymentRetried }: RetryPaymentModalProps) => {
  const [step, setStep] = useState<'review' | 'payment' | 'submitted'>('review');

  // Fetch booking details with service and creator info
  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking-retry', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services!inner (
            id,
            title,
            description,
            price_usdc,
            delivery_days,
            category,
            payment_method,
            creator_id
          )
        `)
        .eq('id', bookingId)
        .single();
      
      if (error) throw error;

      // Get creator info separately
      const { data: creatorData, error: creatorError } = await supabase
        .from('creators')
        .select(`
          id,
          user_id,
          users!inner (
            handle,
            avatar_url
          )
        `)
        .eq('user_id', data.services.creator_id)
        .single();

      if (creatorError) throw creatorError;

      return { ...data, creator: creatorData };
    },
    enabled: isOpen
  });

  const handleProceedToPayment = () => {
    setStep('payment');
  };

  const handlePaymentSubmitted = (paymentId: string) => {
    setStep('submitted');
    onPaymentRetried();
  };

  const handleClose = () => {
    setStep('review');
    onClose();
  };

  if (step === 'submitted') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Retry Submitted!</DialogTitle>
            <DialogDescription>
              Your new payment has been submitted for verification
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Payment Retry Successful!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We've received your new payment submission. Our team will verify your transaction and confirm your booking within 24-48 hours.
            </p>
            <p className="text-xs text-muted-foreground">
              You'll receive an email notification once your booking is confirmed.
            </p>
          </div>
          <Button onClick={handleClose} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  if (step === 'payment' && booking?.services) {
    const paymentConfig = PAYMENT_METHODS[booking.services.payment_method as keyof typeof PAYMENT_METHODS];
    
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Retry Payment</DialogTitle>
            <DialogDescription>
              Complete your payment for this booking
            </DialogDescription>
          </DialogHeader>
          <PaymentInstructions
            paymentMethod={booking.services.payment_method}
            amount={booking.services.price_usdc}
            serviceId={booking.services.id}
            creatorId={booking.services.creator_id}
            bookingId={booking.id}
            paymentType="service_booking"
            onPaymentSubmitted={handlePaymentSubmitted}
            onCancel={handleClose}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading booking details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!booking?.services || !booking?.creator) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>
              Unable to load booking details
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-6">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              There was an error loading the booking details. Please try again later.
            </p>
          </div>
          <Button onClick={handleClose} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  const paymentConfig = PAYMENT_METHODS[booking.services.payment_method as keyof typeof PAYMENT_METHODS];

  // Review step (default)
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Retry Payment</DialogTitle>
          <DialogDescription>
            Your previous payment was rejected. Review the details and try again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rejection Notice */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900 mb-1">Previous Payment Rejected</h4>
                <p className="text-sm text-red-800">
                  Your previous payment attempt was rejected. This could be due to insufficient funds, 
                  incorrect transaction details, or network issues. Please try again with the correct information.
                </p>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={booking.creator.users.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.creator.users.handle)}&background=3b82f6&color=ffffff&size=128`} 
                      alt={booking.creator.users.handle} 
                    />
                    <AvatarFallback>
                      {booking.creator.users.handle?.[0]?.toUpperCase() || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{booking.services.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <User className="h-3 w-3" />
                      by {booking.creator.users.handle}
                    </p>
                  </div>
                  <Badge variant="secondary">{booking.services.category}</Badge>
                </div>

                <p className="text-sm text-muted-foreground">{booking.services.description}</p>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-semibold">
                      <DollarSign className="h-4 w-4" />
                      {booking.services.price_usdc}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {paymentConfig?.currency || 'USDC'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-semibold">
                      <Clock className="h-4 w-4" />
                      {booking.services.delivery_days}
                    </div>
                    <p className="text-xs text-muted-foreground">Days</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-semibold">
                      <Calendar className="h-4 w-4" />
                      {paymentConfig?.displayName?.split(' ')[1] || 'Network'}
                    </div>
                    <p className="text-xs text-muted-foreground">Payment</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Retry Payment Process:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal ml-4">
              <li>You'll receive updated payment instructions for {paymentConfig?.displayName}</li>
              <li>Send the exact amount to the provided admin wallet address</li>
              <li>Submit your new transaction hash for verification</li>
              <li>Our team will verify and confirm your booking within 24-48 hours</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleProceedToPayment}
              className="flex-1"
            >
              Retry Payment Now
            </Button>
          </div>

          {/* Terms Notice */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>By proceeding, you agree to our Terms of Service and Payment Policy.</p>
            <p>This retry will use your existing booking - no new booking will be created.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};