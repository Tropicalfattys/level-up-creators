
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { PLATFORM_WALLETS, PAYMENT_METHODS, NETWORK_CONFIG } from '@/lib/contracts';

interface PaymentInstructionsProps {
  paymentMethod: string;
  amount: number;
  serviceId?: string;
  creatorId: string;
  bookingId?: string;
  paymentType: 'service_booking' | 'creator_tier';
  onPaymentSubmitted: (paymentId: string) => void;
  onCancel: () => void;
}

export const PaymentInstructions = ({
  paymentMethod,
  amount,
  serviceId,
  creatorId,
  bookingId,
  paymentType,
  onPaymentSubmitted,
  onCancel
}: PaymentInstructionsProps) => {
  const [txHash, setTxHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const paymentConfig = PAYMENT_METHODS[paymentMethod as keyof typeof PAYMENT_METHODS];
  const networkConfig = NETWORK_CONFIG[paymentConfig.network as keyof typeof NETWORK_CONFIG];
  const adminWallet = PLATFORM_WALLETS[paymentConfig.network as keyof typeof PLATFORM_WALLETS];

  const submitPayment = useMutation({
    mutationFn: async (transactionHash: string) => {
      if (!user) throw new Error('User not authenticated');

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
      return data;
    },
    onSuccess: (data) => {
      toast.success('Payment submitted successfully!', {
        description: 'Your payment is now pending admin verification.'
      });
      onPaymentSubmitted(data.id);
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
        <CardContent className="space-y-6">
          {/* Step 1: Payment Details */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Badge variant="outline">1</Badge>
              Send Payment
            </h4>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Network:</span>
                <Badge variant="secondary" className={networkConfig.color}>
                  {networkConfig.name}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Amount:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold">{amount} {paymentConfig.currency}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(amount.toString(), 'Amount')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <span className="text-sm font-medium">Send to Address:</span>
                <div className="flex items-center gap-2 p-2 bg-background rounded border">
                  <code className="flex-1 text-xs break-all">{adminWallet}</code>
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
            <h4 className="font-semibold flex items-center gap-2">
              <Badge variant="outline">2</Badge>
              Submit Transaction Hash
            </h4>
            
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

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !txHash.trim()} className="flex-1">
                  {isSubmitting ? 'Submitting...' : 'Submit Payment'}
                </Button>
              </div>
            </form>
          </div>

          {/* Explorer Link */}
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(networkConfig.explorerUrl, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View {networkConfig.name} Explorer
            </Button>
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
