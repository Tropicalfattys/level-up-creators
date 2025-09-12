
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
import { useIsMobile } from '@/hooks/use-mobile';
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
  availability_type?: string;
  target_username?: string;
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
  onBookingComplete?: () => void;
}

export const BookingModal = ({ service, creator, isOpen, onClose, onBookingComplete }: BookingModalProps) => {
  const [step, setStep] = useState<'review' | 'payment' | 'submitted'>('review');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // CRITICAL: Add availability validation to BookingModal
  if (service.availability_type === 'select_user' && service.target_username !== userProfile?.handle) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={isMobile ? "max-w-[95vw] max-h-[90vh] overflow-y-auto" : "max-w-2xl"}>
          <DialogHeader>
            <DialogTitle>Service Not Available</DialogTitle>
            <DialogDescription>
              This service is only available to a specific user and you don't have access to it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  // Check if user is banned - prevent booking
  if (userProfile?.banned) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={isMobile ? "max-w-[95vw] max-h-[90vh] overflow-y-auto" : "max-w-2xl"}>
          <DialogHeader>
            <DialogTitle>Access Restricted</DialogTitle>
            <DialogDescription>
              Your account access has been restricted. You cannot book services at this time. 
              Please contact support if you believe this is an error.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleProceedToPayment = () => {
    // Go directly to payment step without creating booking yet
    setStep('payment');
  };

  const handlePaymentSubmitted = (paymentId: string, bookingId: string) => {
    setBookingId(bookingId);
    setStep('submitted');
    queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['creator-bookings'] });
    // Notify parent that booking is complete
    onBookingComplete?.();
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

  if (step === 'payment') {
    // Get the correct creator_id for payment instructions
    const creatorId = service.creator_id || service.creator?.user_id || creator.user_id;
    
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className={isMobile ? "max-w-[95vw] max-h-[90vh] overflow-y-auto" : "max-w-2xl"}>
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
            bookingId={undefined} // Don't pass bookingId - it will be created during payment submission
            paymentType="service_booking"
            isMobile={isMobile}
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
      <DialogContent className={isMobile ? "max-w-[95vw] max-h-[90vh] overflow-y-auto" : "max-w-2xl"}>
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
                <div className={isMobile ? "flex flex-col items-center gap-3 text-center" : "flex items-start gap-4"}>
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={creator.users.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.users.handle)}&background=3b82f6&color=ffffff&size=128`} 
                      alt={creator.users.handle} 
                    />
                    <AvatarFallback>
                      {creator.users.handle?.[0]?.toUpperCase() || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={isMobile ? "space-y-2" : "flex-1"}>
                    <h3 className="font-semibold text-lg">{service.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 justify-center">
                      <User className="h-3 w-3" />
                      by {creator.users.handle}
                    </p>
                    {isMobile && <Badge variant="secondary">{service.category}</Badge>}
                  </div>
                  {!isMobile && <Badge variant="secondary">{service.category}</Badge>}
                </div>

                <p className="text-sm text-muted-foreground">{service.description}</p>

                <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-3 gap-4'} pt-4 border-t`}>
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
          <div className={`bg-blue-50 border border-blue-200 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
            <h4 className={`font-medium text-blue-900 mb-2 ${isMobile ? 'text-sm' : ''}`}>Payment Process:</h4>
            <ol className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-800 space-y-1 list-decimal ml-4`}>
              <li>You'll receive payment instructions for {paymentConfig?.displayName}</li>
              <li>Send the exact amount to the provided admin wallet address</li>
              <li>Submit your transaction hash for verification</li>
              <li>Our team will verify and confirm your booking within 24-48 hours</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className={isMobile ? "flex flex-col gap-3" : "flex gap-3"}>
            <Button 
              onClick={handleProceedToPayment}
              className="flex-1"
            >
              Proceed to Payment
            </Button>
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
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
