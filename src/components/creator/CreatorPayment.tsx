
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, ExternalLink, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

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

const tierFeatures = {
  basic: ['Basic profile listing', 'Up to 5 services', 'Standard support'],
  premium: ['Priority listing', 'Unlimited services', 'Advanced analytics', 'Priority support'],
  enterprise: ['Featured placement', 'Custom branding', 'Dedicated account manager', 'Advanced integrations']
};

export const CreatorPayment = ({ isOpen, onClose, onPaymentSuccess, tier }: CreatorPaymentProps) => {
  const [selectedChain, setSelectedChain] = useState<'ethereum' | 'base' | 'solana' | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const amount = tierPrices[tier];

  const chainOptions = [
    {
      id: 'ethereum' as const,
      name: 'Ethereum',
      wallet: 'MetaMask',
      icon: '🦊',
      fees: 'High fees',
      color: 'bg-blue-500'
    },
    {
      id: 'base' as const,
      name: 'Base',
      wallet: 'MetaMask',
      icon: '🔵',
      fees: 'Low fees',
      color: 'bg-blue-600'
    },
    {
      id: 'solana' as const,
      name: 'Solana',
      wallet: 'Phantom',
      icon: '👻',
      fees: 'Very low fees',
      color: 'bg-purple-600'
    }
  ];

  const handleConnect = async (chainId: 'ethereum' | 'base' | 'solana') => {
    setIsConnecting(true);
    setSelectedChain(chainId);

    try {
      if (chainId === 'solana') {
        // Phantom wallet connection
        if (!(window as any).solana) {
          toast.error('Phantom wallet not found. Please install Phantom.');
          window.open('https://phantom.app/', '_blank');
          return;
        }

        const resp = await (window as any).solana.connect();
        toast.success(`Connected to Phantom: ${resp.publicKey.toString().slice(0, 8)}...`);
        
        // Simulate payment processing
        await processPayment(chainId, resp.publicKey.toString());
      } else {
        // MetaMask connection
        if (!(window as any).ethereum) {
          toast.error('MetaMask not found. Please install MetaMask.');
          window.open('https://metamask.io/', '_blank');
          return;
        }

        const accounts = await (window as any).ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        toast.success(`Connected to MetaMask: ${accounts[0].slice(0, 8)}...`);
        
        // Simulate payment processing
        await processPayment(chainId, accounts[0]);
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast.error('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const processPayment = async (chain: string, walletAddress: string) => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate mock transaction hash
      const mockTxHash = '0x' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
      
      toast.success('Payment successful!');
      onPaymentSuccess(mockTxHash, chain);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Processing Payment</DialogTitle>
            <DialogDescription>
              Please wait while we process your {amount} USDC payment...
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Do not close this window. Your payment is being processed.
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Basic Plan
                <Badge variant="secondary">FREE</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4">
                {tierFeatures.basic.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => onPaymentSuccess('free', 'none')} className="flex-1">
                  Confirm Application
                </Button>
              </div>
            </CardContent>
          </Card>
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
            Connect Wallet to Pay
          </DialogTitle>
          <DialogDescription>
            Choose your preferred wallet and network to pay {amount} USDC for the {tier} plan
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="capitalize">{tier} Plan</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {amount} USDC
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {tierFeatures[tier].map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h4 className="font-medium">Select Payment Method</h4>
            <div className="grid gap-3">
              {chainOptions.map((chain) => (
                <Button
                  key={chain.id}
                  variant={selectedChain === chain.id ? "default" : "outline"}
                  className="h-auto p-4 justify-start"
                  onClick={() => handleConnect(chain.id)}
                  disabled={isConnecting}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="text-2xl">{chain.icon}</div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{chain.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Use {chain.wallet} • {chain.fees}
                      </div>
                    </div>
                    <Badge variant="secondary">USDC</Badge>
                  </div>
                </Button>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">{amount} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span>Destination:</span>
                  <span className="font-mono text-xs">Platform Escrow</span>
                </div>
              </div>
            </div>

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
