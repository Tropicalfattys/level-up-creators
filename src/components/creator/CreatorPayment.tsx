
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Wallet, Shield } from 'lucide-react';
import { PaymentInstructions } from '@/components/payments/PaymentInstructions';
import { PlanDisplay } from '@/components/payments/PlanDisplay';
import { useDynamicCreatorTiers } from '@/hooks/usePricingTiers';
import { useAuth } from '@/hooks/useAuth';

interface CreatorPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentId: string) => void;
  tier: 'basic' | 'mid' | 'pro';
}

export const CreatorPayment = ({ isOpen, onClose, onPaymentSuccess, tier }: CreatorPaymentProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('ethereum_usdc');
  const [step, setStep] = useState<'select' | 'payment' | 'submitted'>('select');
  
  const { data: dynamicTiers, isLoading, error } = useDynamicCreatorTiers();
  const { user } = useAuth();
  
  // Use dynamic pricing
  const amount = dynamicTiers?.[tier]?.price || 0;
  const tierDisplayName = dynamicTiers?.[tier]?.displayName || tier;

  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method);
    setStep('payment');
  };

  const handlePaymentSubmitted = (paymentId: string) => {
    setStep('submitted');
    onPaymentSuccess(paymentId);
  };

  const handleClose = () => {
    setStep('select');
    setSelectedPaymentMethod('ethereum_usdc');
    onClose();
  };

  if (step === 'submitted') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Payment Submitted
            </DialogTitle>
            <DialogDescription>
              Your creator tier payment has been submitted for verification
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Thank you!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We've received your {tierDisplayName} payment submission. Our team will verify your transaction and activate your creator tier within 24-48 hours.
            </p>
            <p className="text-xs text-muted-foreground">
              You'll receive an email notification once your creator application is approved.
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
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Complete {tierDisplayName} Payment
            </DialogTitle>
            <DialogDescription>
              Follow the instructions below to complete your creator tier payment
            </DialogDescription>
          </DialogHeader>
          <PaymentInstructions
            paymentMethod={selectedPaymentMethod}
            amount={amount}
            creatorId={user?.id || ''}
            paymentType="creator_tier"
            onPaymentSubmitted={handlePaymentSubmitted}
            onCancel={handleClose}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading pricing information...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Error Loading Pricing</DialogTitle>
            <DialogDescription>
              Unable to load pricing information. Please try again later.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!dynamicTiers?.[tier]) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Plan Not Available</DialogTitle>
            <DialogDescription>
              The {tier} plan is not currently available. Please contact support.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // For basic tier or free tiers, skip payment
  if (amount === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {tierDisplayName}</DialogTitle>
            <DialogDescription>
              This plan is free! Click confirm to proceed with your creator application.
            </DialogDescription>
          </DialogHeader>
          <PlanDisplay tier={tier} amount={amount} />
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={() => handlePaymentSubmitted('free')} className="flex-1">
              Confirm Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Select payment method step
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Choose Payment Method
          </DialogTitle>
          <DialogDescription>
            Select your preferred network to pay {amount} USDC for the {tierDisplayName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          <PlanDisplay tier={tier} amount={amount} />

          <div className="space-y-4">
            <h4 className="font-medium">Select Payment Network</h4>
            <div className="grid gap-3">
              {[
                { 
                  key: 'ethereum_usdc', 
                  name: 'Ethereum', 
                  icon: '/lovable-uploads/4a83282f-962f-4d5b-90c8-644562013a0b.png', 
                  fees: 'High fees (~$15-50)' 
                },
                { 
                  key: 'solana_usdc', 
                  name: 'Solana', 
                  icon: '/lovable-uploads/84dadd9f-46f1-44eb-9c27-c17aa2835b0e.png', 
                  fees: 'Very low fees (~$0.01)' 
                },
                { 
                  key: 'bsc_usdc', 
                  name: 'BSC', 
                  icon: '/lovable-uploads/bb73044a-0c88-445e-95e7-e1dd2e6c25e9.png', 
                  fees: 'Low fees (~$0.50)' 
                },
                { 
                  key: 'sui_usdc', 
                  name: 'Sui', 
                  icon: '/lovable-uploads/21051bcc-4a6d-46d4-b718-0e86d7888b55.png', 
                  fees: 'Very low fees (~$0.01)' 
                },
                { 
                  key: 'cardano_usdm', 
                  name: 'Cardano', 
                  icon: '/lovable-uploads/02d69c40-f596-4546-afc2-47271da0fa43.png', 
                  fees: 'Low fees (~$0.30)' 
                }
              ].map((network) => (
                <Button
                  key={network.key}
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  onClick={() => handlePaymentMethodSelect(network.key)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <img 
                        src={network.icon} 
                        alt={`${network.name} logo`} 
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          console.error(`Failed to load ${network.name} logo:`, network.icon);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{network.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {network.fees}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
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
