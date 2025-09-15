
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getPlatformWallet, getSubscriptionWallet, PAYMENT_METHODS, NETWORK_CONFIG } from '@/lib/contracts';

interface PaymentInstructionsProps {
  paymentMethod: string;
  amount: number;
  serviceId?: string;
  creatorId: string;
  bookingId?: string;
  paymentType: 'service_booking' | 'creator_tier';
  isMobile?: boolean;
  onPaymentSubmitted: (paymentId: string, bookingId?: string) => void;
  onCancel: () => void;
}

export const PaymentInstructions = ({
  paymentMethod,
  amount,
  serviceId,
  creatorId,
  bookingId,
  paymentType,
  isMobile = false,
  onPaymentSubmitted,
  onCancel
}: PaymentInstructionsProps) => {
  const [txHash, setTxHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const paymentConfig = PAYMENT_METHODS[paymentMethod as keyof typeof PAYMENT_METHODS];
  const networkConfig = NETWORK_CONFIG[paymentConfig.network as keyof typeof NETWORK_CONFIG];
  
  // Fetch dynamic wallet address (subscription or platform based on payment type)
  const { data: adminWallet, isLoading: walletLoading, error: walletError } = useQuery({
    queryKey: [paymentType === 'creator_tier' ? 'subscription-wallet' : 'platform-wallet', paymentConfig.network],
    queryFn: () => paymentType === 'creator_tier' 
      ? getSubscriptionWallet(paymentConfig.network)
      : getPlatformWallet(paymentConfig.network),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1
  });

  const submitPayment = useMutation({
    mutationFn: async (transactionHash: string) => {
      if (!user) throw new Error('User not authenticated');

      // If this is a service booking and no bookingId exists, create both booking and payment atomically
      if (paymentType === 'service_booking' && !bookingId && serviceId) {
        // Create booking first
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .insert({
            client_id: user.id,
            creator_id: creatorId,
            service_id: serviceId,
            usdc_amount: amount,
            status: 'pending',
            tx_hash: transactionHash,
            chain: paymentConfig.network,
            payment_address: adminWallet
          })
          .select()
          .single();

        if (bookingError) {
          console.error('Booking creation error:', bookingError);
          throw bookingError;
        }

        // Then create payment record with the booking ID
        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .insert({
            user_id: user.id,
            creator_id: creatorId,
            service_id: serviceId,
            booking_id: booking.id,
            payment_type: paymentType,
            network: paymentConfig.network,
            amount: amount,
            currency: paymentConfig.currency,
            tx_hash: transactionHash,
            admin_wallet_address: adminWallet,
            status: 'pending'
          })
          .select()
          .single();

        if (paymentError) {
          console.error('Payment creation error:', paymentError);
          throw paymentError;
        }

        return { payment, booking };
      } else {
        // For creator tier payments or existing bookings, just create payment
        const { data, error } = await supabase
          .from('payments')
          .insert({
            user_id: user.id,
            creator_id: creatorId,
            service_id: serviceId || null,
            booking_id: bookingId || null,
            payment_type: paymentType,
            network: paymentConfig.network,
            amount: amount,
            currency: paymentConfig.currency,
            tx_hash: transactionHash,
            admin_wallet_address: adminWallet,
            status: 'pending'
          })
          .select()
          .single();

        if (error) throw error;

        // If this is a payment retry for existing booking, update booking status and notify client
        if (bookingId && paymentType === 'service_booking') {
          console.log('Processing payment retry for booking:', bookingId);
          
          // Update booking status back to pending for retry
          const { error: bookingUpdateError } = await supabase
            .from('bookings')
            .update({ status: 'pending' })
            .eq('id', bookingId);

          if (bookingUpdateError) {
            console.error('Failed to update booking status:', bookingUpdateError);
            throw new Error('Failed to update booking status: ' + bookingUpdateError.message);
          }

          console.log('Successfully updated booking status to pending for retry');

          // Create notification for client
          const { error: notificationError } = await supabase
            .rpc('create_notification', {
              p_user_id: user.id,
              p_type: 'payment_resubmitted',
              p_title: 'Payment Re-submitted',
              p_message: 'Your payment has been re-submitted successfully! Please wait for admin verification to ensure your payment is processed.',
              p_booking_id: bookingId
            });

          if (notificationError) {
            console.error('Failed to create notification:', notificationError);
            // Don't throw here - notification failure shouldn't break the payment flow
          }
        }

        return { payment: data, booking: null };
      }
    },
    onSuccess: (data) => {
      toast.success('Payment submitted successfully!', {
        description: 'Your payment is now pending admin verification.'
      });
      
      // Pass both payment ID and booking ID (if created) back to parent
      if (data.booking) {
        onPaymentSubmitted(data.payment.id, data.booking.id);
      } else {
        onPaymentSubmitted(data.payment.id);
      }
    },
    onError: (error: any) => {
      console.error('Payment submission error:', error);
      toast.error('Failed to submit payment: ' + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txHash.trim()) {
      toast.error('Please enter a transaction hash');
      return;
    }

    if (!validateTxHash(txHash, paymentConfig.network)) {
      toast.error('Invalid transaction hash format for ' + networkConfig.name);
      return;
    }

    setIsSubmitting(true);
    submitPayment.mutate(txHash.trim());
  };

  const validateTxHash = (hash: string, network: string): boolean => {
    switch (network) {
      case 'ethereum':
      case 'bsc':
        return /^0x[a-fA-F0-9]{64}$/.test(hash);
      case 'solana':
        return /^[1-9A-HJ-NP-Za-km-z]{88}$/.test(hash);
      case 'sui':
        return /^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(hash);
      case 'cardano':
        return /^[a-fA-F0-9]{64}$/.test(hash);
      default:
        return false;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Show loading state while fetching wallet address
  if (walletLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading payment details...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error if wallet address fetch failed
  if (walletError || !adminWallet) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Unable to load payment address. Please try again.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img src={networkConfig.icon} alt={networkConfig.name} className="h-6 w-6" />
            Payment Instructions
          </CardTitle>
          <CardDescription>
            Follow these steps to complete your payment manually
          </CardDescription>
        </CardHeader>
        <CardContent className={`space-y-${isMobile ? '3' : '6'}`}>
          {/* Step 1: Payment Details */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Badge variant="outline">1</Badge>
              Send Payment
            </h4>
            
            <div className={`bg-muted/50 rounded-lg ${isMobile ? 'p-2 space-y-2' : 'p-4 space-y-3'}`}>
              <div className={`flex items-center ${isMobile ? 'flex-col gap-1' : 'justify-between'}`}>
                <span className="text-sm font-medium">Network:</span>
                <Badge variant="secondary" className={networkConfig.color}>
                  {networkConfig.name}
                </Badge>
              </div>
              
              <div className={`flex items-center ${isMobile ? 'flex-col gap-1' : 'justify-between'}`}>
                <span className="text-sm font-medium">Amount:</span>
                <div className="flex items-center gap-2">
                  <span className={`font-mono ${isMobile ? 'text-base' : 'text-lg'} font-bold`}>{amount} {paymentConfig.currency}</span>
                  <Button
                    size={isMobile ? "sm" : "sm"}
                    variant="ghost"
                    onClick={() => copyToClipboard(amount.toString(), 'Amount')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <span className="text-sm font-medium">Send to Address:</span>
                <div className={`flex items-center gap-2 ${isMobile ? 'p-2' : 'p-2'} bg-background rounded border`}>
                  <code className={`flex-1 ${isMobile ? 'text-[10px]' : 'text-xs'} break-all`}>{adminWallet}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(adminWallet, 'Wallet address')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Important:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Send exactly {amount} {paymentConfig.currency} to the address above</li>
                  <li>• Double-check the address before sending</li>
                  <li>• Include sufficient gas/transaction fees</li>
                  <li>• Do not send any other tokens to this address</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 2: Submit Transaction Hash */}
          <div className="space-y-4">
            <h4 className={`font-semibold flex items-center ${isMobile ? 'flex-wrap' : ''} gap-2`}>
              <Badge variant="outline">2</Badge>
              Submit Transaction Hash
              <Dialog>
                <DialogTrigger asChild>
                  <span className="text-orange-500 hover:underline cursor-help text-sm font-normal">
                    Find your TX hash
                  </span>
                </DialogTrigger>
                <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[90vh]' : 'max-w-2xl max-h-[80vh]'} overflow-hidden`}>
                  <DialogHeader>
                    <DialogTitle className="text-lg">💡 How to Find Your Transaction Hash (Tx Hash)</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        After sending your payment, you'll need to give us the transaction hash so we can verify it.
                      </p>
                      
                      <div className="space-y-3">
                        <p className="font-medium text-sm">Here's how to find it in any wallet:</p>
                        <ol className="text-sm space-y-2 list-decimal ml-4">
                          <li>Open your wallet app (the one you used to send payment).</li>
                          <li>Go to your activity/history tab – this shows your recent transactions.</li>
                          <li>Tap or click the payment you just made.</li>
                          <li>Look for a long string of numbers and letters called "Transaction Hash," "TxID," or "Signature."</li>
                        </ol>
                        
                        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                          <p className="text-sm font-medium">Wallet-specific names:</p>
                          <ul className="text-sm space-y-1 ml-4">
                            <li>• In MetaMask → it appears as "Transaction Hash".</li>
                            <li>• In Phantom (Solana) → it shows as "Signature."</li>
                            <li>• On other wallets it may be called "TxID" or "Hash."</li>
                          </ul>
                        </div>
                        
                        <ol className="text-sm space-y-2 list-decimal ml-4" start={5}>
                          <li>Copy the transaction hash (use the copy button if available).</li>
                          <li>Paste it into the box on our payment screen to complete verification.</li>
                        </ol>
                      </div>
                      
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-sm text-amber-800 font-medium">
                          ⚠️ Do not send a screenshot. We must have the actual transaction hash to confirm your payment.
                        </p>
                      </div>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </h4>
            
            {isMobile && (
              <div className="text-xs text-muted-foreground">
                After sending payment, copy the transaction hash from your wallet's transaction history and paste it below.
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="tx-hash">Transaction Hash *</Label>
                <Input
                  id="tx-hash"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder={`Enter ${networkConfig.name} transaction hash...`}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Copy the transaction hash from your wallet after sending the payment
                </p>
              </div>

              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !txHash.trim()} className="flex-1">
                  {isSubmitting ? 'Submitting...' : 'Submit Payment'}
                </Button>
              </div>
            </form>
          </div>

        </CardContent>
      </Card>

      {/* Status Information */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">What happens next?</p>
              <ol className="text-xs text-muted-foreground space-y-1 ml-4 list-decimal">
                <li>Your payment submission will be reviewed by our admin team</li>
                <li>We'll verify the transaction on the blockchain</li>
                <li>Once verified, your {paymentType === 'service_booking' ? 'booking will be confirmed' : 'creator tier will be activated'}</li>
                <li>You'll receive a confirmation notification</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2">
                Verification typically takes 24-48 hours during business days.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
