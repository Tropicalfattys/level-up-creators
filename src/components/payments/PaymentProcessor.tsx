
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WalletConnect } from './WalletConnect';
import { DollarSign, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentProcessorProps {
  serviceId: string;
  serviceTitle: string;
  amount: number;
  currency: 'USDC';
  creatorHandle: string;
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

  if (step === 'success' && paymentData) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-green-900">Payment Successful!</CardTitle>
          <CardDescription>
            Your payment has been processed and the service booking is confirmed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-green-50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service:</span>
              <span className="font-medium">{serviceTitle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Creator:</span>
              <span className="font-medium">@{creatorHandle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount Paid:</span>
              <span className="font-medium">{amount} {currency}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Network:</span>
              <span className="font-medium capitalize">{paymentData.chain}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transaction:</span>
              <span className="font-mono text-xs">
                {paymentData.transactionHash.slice(0, 8)}...{paymentData.transactionHash.slice(-8)}
              </span>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your funds are held in escrow until the service is completed. 
              You can track progress in your bookings dashboard.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (step === 'payment') {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service:</span>
                <span className="font-medium">{serviceTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creator:</span>
                <span className="font-medium">@{creatorHandle}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>{amount} {currency}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <WalletConnect
          amount={amount}
          currency={currency}
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={handleBackToReview}
        />
      </div>
    );
  }

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
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{serviceTitle}</p>
                  <p className="text-sm text-muted-foreground">by @{creatorHandle}</p>
                </div>
                <Badge variant="outline">Service</Badge>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Service Fee:</span>
                <span className="font-medium">{amount} {currency}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Platform Fee:</span>
                <span className="font-medium">0 {currency}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Amount:</span>
                <span>{amount} {currency}</span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Secure Escrow Payment:</strong> Your funds are held securely until the service is completed. 
              The creator will only receive payment after successful delivery and your approval.
            </AlertDescription>
          </Alert>

          {/* Payment Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
            <div className="p-3 border rounded-lg">
              <Shield className="h-5 w-5 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium">Secure Escrow</p>
              <p className="text-xs text-muted-foreground">Funds protected until completion</p>
            </div>
            <div className="p-3 border rounded-lg">
              <Clock className="h-5 w-5 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium">Fast Processing</p>
              <p className="text-xs text-muted-foreground">Instant blockchain confirmation</p>
            </div>
            <div className="p-3 border rounded-lg">
              <DollarSign className="h-5 w-5 mx-auto mb-2 text-purple-600" />
              <p className="text-sm font-medium">Low Fees</p>
              <p className="text-xs text-muted-foreground">Minimal network costs</p>
            </div>
          </div>
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
