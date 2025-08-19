
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Wallet, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { WalletConnectionManager } from '@/components/payments/WalletConnectionManager';
import { SecurityWarning } from '@/components/payments/SecurityWarning';
import { PlanDisplay } from '@/components/payments/PlanDisplay';

interface CreatorPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (txHash: string, chain: string) => void;
  tier: 'basic' | 'premium' | 'enterprise';
}

const tierPrices = {
  basic: 0,
  premium: 25,
  enterprise: 100
};

export const CreatorPayment = ({ isOpen, onClose, onPaymentSuccess, tier }: CreatorPaymentProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [securityWarningAccepted, setSecurityWarningAccepted] = useState(false);

  const amount = tierPrices[tier];

  if (isProcessing) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Processing Secure Payment
            </DialogTitle>
            <DialogDescription>
              Please wait while we securely process your {amount} USDC payment...
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground mb-2">
              Processing payment securely...
            </p>
            <p className="text-sm text-muted-foreground">
              Do not close this window or refresh the page.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // For basic tier (free), skip payment
  if (tier === 'basic') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Basic Plan</DialogTitle>
            <DialogDescription>
              The basic plan is free! Click confirm to proceed with your creator application.
            </DialogDescription>
          </DialogHeader>
          <PlanDisplay tier={tier} amount={amount} />
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={() => onPaymentSuccess('free', 'none')} className="flex-1">
              Confirm Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Secure Crypto Payment
          </DialogTitle>
          <DialogDescription>
            Choose your preferred wallet and network to pay {amount} USDC for the {tier} plan
          </DialogDescription>
        </DialogHeader>

        <SecurityWarning
          accepted={securityWarningAccepted}
          onAcceptChange={setSecurityWarningAccepted}
        />
        
        <div className="grid md:grid-cols-2 gap-6">
          <PlanDisplay tier={tier} amount={amount} />

          <div className="space-y-4">
            <WalletConnectionManager
              onPaymentSuccess={onPaymentSuccess}
              amount={amount}
              securityWarningAccepted={securityWarningAccepted}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://www.circle.com/usdc', '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
