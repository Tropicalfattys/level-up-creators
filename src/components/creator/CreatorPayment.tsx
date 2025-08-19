
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Wallet, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { WalletConnectionManager } from '@/components/payments/WalletConnectionManager';
import { SecurityWarning } from '@/components/payments/SecurityWarning';
import { PlanDisplay } from '@/components/payments/PlanDisplay';
import { useDynamicCreatorTiers } from '@/hooks/usePricingTiers';
import { STATIC_CREATOR_TIERS } from '@/lib/contracts';

interface CreatorPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (txHash: string, chain: string) => void;
  tier: 'basic' | 'premium' | 'enterprise';
}

export const CreatorPayment = ({ isOpen, onClose, onPaymentSuccess, tier }: CreatorPaymentProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [securityWarningAccepted, setSecurityWarningAccepted] = useState(false);
  
  const { data: dynamicTiers, isLoading } = useDynamicCreatorTiers();
  
  // Use dynamic pricing if available, fallback to static pricing
  const tiers = dynamicTiers || STATIC_CREATOR_TIERS;
  const amount = tiers[tier]?.price || 0;

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

  // For basic tier or free tiers, skip payment
  if (amount === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {tiers[tier]?.displayName || 'Basic'} Plan</DialogTitle>
            <DialogDescription>
              This plan is free! Click confirm to proceed with your creator application.
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

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading pricing information...</p>
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
