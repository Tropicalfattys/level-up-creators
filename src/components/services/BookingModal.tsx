
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, DollarSign, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { PaymentInstructions } from '@/components/payments/PaymentInstructions';
import { PAYMENT_METHODS } from '@/lib/contracts';

interface Service {
  id: string;
  title: string;
  description: string;
  price_usdc: number;
  delivery_days: number;
  category: string;
  payment_method: string;
  creator_id?: string; // Make this optional since it might come from creator structure
  creator?: {
    id: string;
    user_id: string;
    users: {
      handle: string;
      avatar_url?: string; // Make this optional to match ServiceDetailModal
    };
    rating: number;
    review_count?: number;
  };
}

interface Creator {
  id: string;
  user_id: string;
  users: {
    handle: string;
    avatar_url?: string; // Make this optional to match ServiceDetailModal
  };
}

interface BookingModalProps {
  service: Service;
  creator: Creator;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal = ({ service, creator, isOpen, onClose }: BookingModalProps) => {
  const [step, setStep] = useState<'review' | 'payment' | 'submitted'>('review');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createBooking = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Get the correct creator_id - prioritize service.creator_id, then nested creator structure, then fallback to creator prop
      const creatorId = service.creator_id || service.creator?.user_id || creator.user_id;
      
      if (!creatorId) {
        throw new Error('Creator ID not found');
      }
      
      console.log('Creating booking with data:', {
        client_id: user.id,
        creator_id: creatorId,
        service_id: service.id,
        usdc_amount: service.price_usdc,
        status: 'pending'
      });

      // Create booking with pending status
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          client_id: user.id,
          creator_id: creatorId,
          service_id: service.id,
          usdc_amount: service.price_usdc,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Booking creation error details:', error);
        throw error;
      }
      return booking;
    },
    onSuccess: (booking) => {
      console.log('Booking created successfully:', booking);
      setBookingId(booking.id);
      setStep('payment');
    },
    onError: (error: any) => {
      console.error('Booking creation error:', error);
      toast.error('Failed to create booking: ' + (error.message || 'Unknown error'));
    }
  });

  const handleProceedToPayment = () => {
    createBooking.mutate();
  };

  const handlePaymentSubmitted = (paymentId: string) => {
    setStep('submitted');
    queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['creator-bookings'] });
  };

  const handleClose = () => {
    setStep('review');
    setBookingId(null);
    onClose();
  };

  const paymentConfig = PAYMENT_METHODS[service.payment_method as keyof typeof PAYMENT_METHODS];

  if (step === 'submitted') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Submitted!</DialogTitle>
            <DialogDescription>
              Your payment has been submitted for verification
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Thank you!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We've received your payment submission. Our team will verify your transaction and confirm your booking within 24-48 hours.
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

  if (step === 'payment' && bookingId) {
    // Get the correct creator_id for payment instructions
    const creatorId = service.creator_id || service.creator?.user_id || creator.user_id;
    
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Follow the instructions below to complete your booking
            </DialogDescription>
          </DialogHeader>
          <PaymentInstructions
            paymentMethod={service.payment_method}
            amount={service.price_usdc}
            serviceId={service.id}
            creatorId={creatorId}
            bookingId={bookingId}
            paymentType="service_booking"
            onPaymentSubmitted={handlePaymentSubmitted}
            onCancel={handleClose}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Review step (default)
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Book Service</DialogTitle>
          <DialogDescription>
            Review the service details before proceeding with payment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Details */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={creator.users.avatar_url} alt={creator.users.handle} />
                    <AvatarFallback>
                      {creator.users.handle?.[0]?.toUpperCase() || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{service.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <User className="h-3 w-3" />
                      by {creator.users.handle}
                    </p>
                  </div>
                  <Badge variant="secondary">{service.category}</Badge>
                </div>

                <p className="text-sm text-muted-foreground">{service.description}</p>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-semibold">
                      <DollarSign className="h-4 w-4" />
                      {service.price_usdc}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {paymentConfig?.currency || 'USDC'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-semibold">
                      <Clock className="h-4 w-4" />
                      {service.delivery_days}
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
            <h4 className="font-medium text-blue-900 mb-2">Payment Process:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal ml-4">
              <li>You'll receive payment instructions for {paymentConfig?.displayName}</li>
              <li>Send the exact amount to the provided admin wallet address</li>
              <li>Submit your transaction hash for verification</li>
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
              disabled={createBooking.isPending}
              className="flex-1"
            >
              {createBooking.isPending ? 'Creating Booking...' : 'Proceed to Payment'}
            </Button>
          </div>

          {/* Terms Notice */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>By proceeding, you agree to our Terms of Service and Payment Policy.</p>
            <p>Payments are held in escrow until service delivery is complete.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
