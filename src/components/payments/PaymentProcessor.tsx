
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WalletConnect } from './WalletConnect';
import { PaymentSummary } from './PaymentSummary';
import { PaymentSecurityNotice } from './PaymentSecurityNotice';
import { PaymentSuccess } from './PaymentSuccess';
import { Shield } from 'lucide-react';

interface PaymentProcessorProps {
  serviceId: string;
  serviceTitle: string;
  amount: number;
  currency: 'USDC';
  creatorHandle: string;
  deliveryDays?: number;
  onPaymentSuccess: (transactionData: PaymentResult) => void;
  onCancel: () => void;
}

interface PaymentResult {
  transactionHash: string;
  chain: string;
  amount: number;
  currency: string;
  timestamp: string;
}

export const PaymentProcessor = ({
  serviceId,
  serviceTitle,
  amount,
  currency,
  creatorHandle,
  deliveryDays,
  onPaymentSuccess,
  onCancel
}: PaymentProcessorProps) => {
  const [step, setStep] = useState<'review' | 'payment' | 'processing' | 'success'>('review');
  const [paymentData, setPaymentData] = useState<PaymentResult | null>(null);

  const handlePaymentConfirm = () => {
    setStep('payment');
  };

  const handlePaymentSuccess = (txHash: string, chain: string) => {
    const result: PaymentResult = {
      transactionHash: txHash,
      chain,
      amount,
      currency,
      timestamp: new Date().toISOString()
    };
    
    setPaymentData(result);
    setStep('success');
    
    // Notify parent component
    setTimeout(() => {
      onPaymentSuccess(result);
    }, 2000);
  };

  const handleBackToReview = () => {
    setStep('review');
  };

  // Success step
  if (step === 'success' && paymentData) {
    return (
      <PaymentSuccess
        paymentData={paymentData}
        serviceTitle={serviceTitle}
        creatorHandle={creatorHandle}
      />
    );
  }

  // Payment step
  if (step === 'payment') {
    return (
      <div className="space-y-4">
        <PaymentSummary
          serviceTitle={serviceTitle}
          creatorHandle={creatorHandle}
          amount={amount}
          currency={currency}
          deliveryDays={deliveryDays}
        />

        <WalletConnect
          amount={amount}
          currency={currency}
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={handleBackToReview}
        />
      </div>
    );
  }

  // Review step (default)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Secure Payment
        </CardTitle>
        <CardDescription>
          Review your booking details before proceeding with payment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Details */}
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Service Details</h4>
            <PaymentSummary
              serviceTitle={serviceTitle}
              creatorHandle={creatorHandle}
              amount={amount}
              currency={currency}
              deliveryDays={deliveryDays}
              platformFee={0}
            />
          </div>

          {/* Security Information */}
          <PaymentSecurityNotice />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handlePaymentConfirm} className="flex-1">
            Proceed to Payment
          </Button>
        </div>

        {/* Terms Notice */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>By proceeding, you agree to our Terms of Service and Payment Policy.</p>
          <p>Payments are processed securely through blockchain technology.</p>
        </div>
      </CardContent>
    </Card>
  );
};
