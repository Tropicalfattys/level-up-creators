
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Clock, DollarSign, CheckCircle } from 'lucide-react';

export const PaymentSecurityNotice = () => {
  return (
    <div className="space-y-4">
      {/* Main Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Secure Escrow Payment:</strong> Your funds are held securely until the service is completed. 
          The creator will only receive payment after successful delivery and your approval.
        </AlertDescription>
      </Alert>

      {/* Payment Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
        <div className="p-3 border rounded-lg bg-muted/20">
          <Shield className="h-5 w-5 mx-auto mb-2 text-green-600" />
          <p className="text-sm font-medium">Secure Escrow</p>
          <p className="text-xs text-muted-foreground">Funds protected until completion</p>
        </div>
        <div className="p-3 border rounded-lg bg-muted/20">
          <Clock className="h-5 w-5 mx-auto mb-2 text-blue-600" />
          <p className="text-sm font-medium">Fast Processing</p>
          <p className="text-xs text-muted-foreground">Instant blockchain confirmation</p>
        </div>
        <div className="p-3 border rounded-lg bg-muted/20">
          <DollarSign className="h-5 w-5 mx-auto mb-2 text-purple-600" />
          <p className="text-sm font-medium">Low Fees</p>
          <p className="text-xs text-muted-foreground">Minimal network costs</p>
        </div>
      </div>

      {/* Payment Process Steps */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-primary" />
          How Escrow Works
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">1</div>
            <div>
              <p className="font-medium">Payment Secured</p>
              <p className="text-muted-foreground">Your payment is held in blockchain escrow</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">2</div>
            <div>
              <p className="font-medium">Service Delivered</p>
              <p className="text-muted-foreground">Creator completes and delivers your service</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">3</div>
            <div>
              <p className="font-medium">Review & Release</p>
              <p className="text-muted-foreground">You approve delivery and funds are released</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
