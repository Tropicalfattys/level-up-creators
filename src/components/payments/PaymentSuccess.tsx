
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, ExternalLink, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PaymentResult {
  transactionHash: string;
  chain: string;
  amount: number;
  currency: string;
  timestamp: string;
}

interface PaymentSuccessProps {
  paymentData: PaymentResult;
  serviceTitle: string;
  creatorHandle: string;
  onClose?: () => void;
}

export const PaymentSuccess = ({
  paymentData,
  serviceTitle,
  creatorHandle,
  onClose
}: PaymentSuccessProps) => {
  const getExplorerUrl = (chain: string, txHash: string) => {
    switch (chain.toLowerCase()) {
      case 'ethereum':
        return `https://etherscan.io/tx/${txHash}`;
      case 'base':
        return `https://basescan.org/tx/${txHash}`;
      case 'solana':
        return `https://explorer.solana.com/tx/${txHash}`;
      default:
        return '#';
    }
  };

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
      <CardContent className="space-y-6">
        {/* Transaction Details */}
        <div className="rounded-lg bg-green-50 p-4 space-y-3">
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
            <span className="font-medium">{paymentData.amount} {paymentData.currency}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Network:</span>
            <span className="font-medium capitalize">{paymentData.chain}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-muted-foreground">Transaction:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs">
                {paymentData.transactionHash.slice(0, 8)}...{paymentData.transactionHash.slice(-8)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => window.open(getExplorerUrl(paymentData.chain, paymentData.transactionHash), '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Escrow Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your funds are held in escrow until the service is completed. 
            You can track progress in your bookings dashboard.
          </AlertDescription>
        </Alert>

        {/* Next Steps */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            What happens next?
          </h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• The creator has been notified of your booking</li>
            <li>• You'll receive updates as work progresses</li>
            <li>• Review and approve delivery when completed</li>
            <li>• Funds are released automatically upon approval</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" asChild className="flex-1">
            <Link to="/dashboard">View Dashboard</Link>
          </Button>
          <Button asChild className="flex-1">
            <Link to="/dashboard">Track Progress</Link>
          </Button>
        </div>

        {onClose && (
          <Button variant="ghost" onClick={onClose} className="w-full">
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
