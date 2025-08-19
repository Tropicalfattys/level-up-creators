
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, DollarSign, User, Shield } from 'lucide-react';
import { WalletConnect } from '@/components/payments/WalletConnect';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { getEscrowAddress, validateTransactionHash } from '@/lib/walletValidation';
import { toast } from 'sonner';

interface Service {
  id: string;
  title: string;
  description: string;
  price_usdc: number;
  delivery_days: number;
  creator_id: string;
}

interface Creator {
  id: string;
  user_id: string;
  users: {
    handle: string;
    avatar_url: string;
  };
}

interface BookingModalProps {
  service: Service;
  creator: Creator;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal = ({ service, creator, isOpen, onClose }: BookingModalProps) => {
  const [step, setStep] = useState<'review' | 'payment' | 'success'>('review');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Platform takes 15%, client pays full service amount
  const totalAmount = service.price_usdc;
  const platformFee = service.price_usdc * 0.15;
  const creatorAmount = service.price_usdc * 0.85;

  const createBooking = useMutation({
    mutationFn: async ({ txHash, chain }: { txHash: string; chain: string }) => {
      if (!user) throw new Error('User not authenticated');

      // Validate transaction hash before creating booking
      if (!validateTransactionHash(txHash, chain)) {
        throw new Error('Invalid transaction hash format');
      }

      const bookingData = {
        service_id: service.id,
        client_id: user.id,
        creator_id: service.creator_id,
        usdc_amount: totalAmount, // Full amount paid by client
        status: 'paid',
        chain,
        tx_hash: txHash,
        payment_address: getEscrowAddress(chain)
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setBookingId(data.id);
      setStep('success');
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      toast.success('Booking created successfully!');
    },
    onError: (error) => {
      console.error('Booking creation error:', error);
      toast.error('Failed to create booking. Please contact support.');
    }
  });

  const handlePaymentSuccess = (txHash: string, chain: string) => {
    createBooking.mutate({ txHash, chain });
  };

  const handleClose = () => {
    setStep('review');
    setBookingId(null);
    onClose();
  };

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>
              Please sign in to book this service
            </DialogDescription>
          </DialogHeader>
          <Button onClick={handleClose}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <ErrorBoundary>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {step === 'review' && 'Review Booking'}
              {step === 'payment' && 'Complete Payment'}
              {step === 'success' && 'Booking Confirmed!'}
            </DialogTitle>
            <DialogDescription>
              {step === 'review' && 'Review the details before booking'}
              {step === 'payment' && 'Choose your payment method'}
              {step === 'success' && 'Your booking has been created successfully'}
            </DialogDescription>
          </DialogHeader>

          {step === 'review' && (
            <div className="space-y-6">
              {/* Service Details */}
              <div>
                <h3 className="font-semibold mb-3">Service Details</h3>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">{service.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{service.delivery_days} days delivery</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>@{creator.users.handle}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-semibold">
                      <DollarSign className="h-4 w-4" />
                      {service.price_usdc} USDC
                    </div>
                  </div>
                </div>
              </div>

              {/* Escrow Information */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Secure Escrow Protection</h4>
                    <p className="text-sm text-muted-foreground">
                      Your payment is held securely until the creator delivers your service. 
                      You have 3 days to review and accept the delivery.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div>
                <h3 className="font-semibold mb-3">Pricing</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Service Price</span>
                    <span>{service.price_usdc.toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>Platform Fee (15%)</span>
                    <span>{platformFee.toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>Creator Receives</span>
                    <span>{creatorAmount.toFixed(2)} USDC</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>You Pay</span>
                    <span>{totalAmount.toFixed(2)} USDC</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => setStep('payment')} className="flex-1">
                  Continue to Payment
                </Button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <WalletConnect
              amount={totalAmount}
              currency="USDC"
              onPaymentSuccess={handlePaymentSuccess}
              onCancel={() => setStep('review')}
            />
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Booking Confirmed!</h3>
              <p className="text-muted-foreground mb-6">
                Your booking has been created and the creator has been notified. 
                You can track the progress in your dashboard.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
                <Button onClick={() => window.location.href = '/dashboard'}>
                  View Dashboard
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
};
