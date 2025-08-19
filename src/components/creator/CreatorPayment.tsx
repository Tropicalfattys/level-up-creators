
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, ExternalLink, DollarSign, AlertTriangle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { validateInput, sanitizeString, createRateLimiter } from '@/lib/validation';
import { showErrorToast, RateLimitError } from '@/lib/errorHandler';
import { z } from 'zod';

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

// Validation schema for wallet addresses
const walletAddressSchema = z.object({
  ethereum: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  solana: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid Solana address')
});

// Rate limiter for payment attempts
const paymentLimiter = createRateLimiter(3, 60 * 1000); // 3 attempts per minute

export const CreatorPayment = ({ isOpen, onClose, onPaymentSuccess, tier }: CreatorPaymentProps) => {
  const [selectedChain, setSelectedChain] = useState<'ethereum' | 'base' | 'solana' | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [securityWarningAccepted, setSecurityWarningAccepted] = useState(false);

  const amount = tierPrices[tier];

  const chainOptions = [
    {
      id: 'ethereum' as const,
      name: 'Ethereum',
      wallet: 'MetaMask',
      icon: '🦊',
      fees: 'High fees (~$15-50)',
      color: 'bg-blue-500',
      security: 'Most secure'
    },
    {
      id: 'base' as const,
      name: 'Base',
      wallet: 'MetaMask',
      icon: '🔵',
      fees: 'Low fees (~$0.10-1)',
      color: 'bg-blue-600',
      security: 'Secure L2'
    },
    {
      id: 'solana' as const,
      name: 'Solana',
      wallet: 'Phantom',
      icon: '👻',
      fees: 'Very low fees (~$0.01)',
      color: 'bg-purple-600',
      security: 'Fast & secure'
    }
  ];

  const validateWalletConnection = async (chainId: 'ethereum' | 'base' | 'solana', walletAddress: string) => {
    const sanitizedAddress = sanitizeString(walletAddress);
    
    try {
      if (chainId === 'solana') {
        const validation = validateInput(walletAddressSchema.shape.solana, sanitizedAddress);
        if (validation.success === false) {
          throw new Error('Invalid Solana wallet address format');
        }
      } else {
        const validation = validateInput(walletAddressSchema.shape.ethereum, sanitizedAddress);
        if (validation.success === false) {
          throw new Error('Invalid Ethereum wallet address format');
        }
      }
      return true;
    } catch (error) {
      showErrorToast(error as Error);
      return false;
    }
  };

  const handleConnect = async (chainId: 'ethereum' | 'base' | 'solana') => {
    // Rate limiting check
    if (!paymentLimiter('user')) {
      showErrorToast(new RateLimitError('Too many payment attempts. Please wait before trying again.'));
      return;
    }

    if (!securityWarningAccepted) {
      toast.error('Security Notice', {
        description: 'Please acknowledge the security warning before proceeding.'
      });
      return;
    }

    setIsConnecting(true);
    setSelectedChain(chainId);

    try {
      if (chainId === 'solana') {
        // Phantom wallet connection
        if (!(window as any).solana || !(window as any).solana.isPhantom) {
          toast.error('Phantom wallet not detected', {
            description: 'Please install Phantom wallet to continue.',
            action: {
              label: 'Install Phantom',
              onClick: () => window.open('https://phantom.app/', '_blank')
            }
          });
          return;
        }

        const resp = await (window as any).solana.connect({ onlyIfTrusted: false });
        const walletAddress = resp.publicKey.toString();
        
        const isValid = await validateWalletConnection(chainId, walletAddress);
        if (!isValid) return;

        toast.success(`Connected to Phantom: ${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}`);
        await processPayment(chainId, walletAddress);
      } else {
        // MetaMask connection
        if (!(window as any).ethereum) {
          toast.error('MetaMask not detected', {
            description: 'Please install MetaMask to continue.',
            action: {
              label: 'Install MetaMask',
              onClick: () => window.open('https://metamask.io/', '_blank')
            }
          });
          return;
        }

        // Request account access
        const accounts = await (window as any).ethereum.request({ 
          method: 'eth_requestAccounts' 
        });

        if (!accounts || accounts.length === 0) {
          throw new Error('No wallet accounts found');
        }

        const walletAddress = accounts[0];
        const isValid = await validateWalletConnection(chainId, walletAddress);
        if (!isValid) return;

        // Verify network for Base
        if (chainId === 'base') {
          try {
            await (window as any).ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x2105' }], // Base mainnet
            });
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              // Network not added, add it
              await (window as any).ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x2105',
                  chainName: 'Base',
                  rpcUrls: ['https://mainnet.base.org'],
                  blockExplorerUrls: ['https://basescan.org']
                }]
              });
            } else {
              throw switchError;
            }
          }
        }

        toast.success(`Connected to MetaMask: ${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}`);
        await processPayment(chainId, walletAddress);
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      
      if (error.code === 4001) {
        toast.error('Connection cancelled', {
          description: 'Wallet connection was cancelled by user.'
        });
      } else if (error.code === -32002) {
        toast.error('Connection pending', {
          description: 'Please check your wallet for a pending connection request.'
        });
      } else {
        showErrorToast(error);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const processPayment = async (chain: string, walletAddress: string) => {
    setIsProcessing(true);
    
    try {
      // Enhanced security validation
      if (!walletAddress || walletAddress.length < 26) {
        throw new Error('Invalid wallet address detected');
      }

      // Simulate payment processing with more realistic delay
      const processingTime = Math.random() * 2000 + 2000; // 2-4 seconds
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      // Generate more realistic mock transaction hash
      const timestamp = Date.now().toString(16);
      const random = Math.random().toString(16).slice(2, 18);
      const mockTxHash = `0x${timestamp}${random}`.slice(0, 66);
      
      // Validate transaction hash format
      if (!/^0x[a-fA-F0-9]{64}$/.test(mockTxHash)) {
        throw new Error('Invalid transaction hash generated');
      }

      toast.success('Payment successful!', {
        description: `Transaction completed on ${chain}`,
        action: {
          label: 'View Transaction',
          onClick: () => {
            const explorerUrl = chain === 'solana' 
              ? `https://explorer.solana.com/tx/${mockTxHash}`
              : `https://etherscan.io/tx/${mockTxHash}`;
            window.open(explorerUrl, '_blank');
          }
        }
      });

      onPaymentSuccess(mockTxHash, chain);
    } catch (error) {
      console.error('Payment error:', error);
      showErrorToast(error as Error);
    } finally {
      setIsProcessing(false);
    }
  };

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
            Secure Crypto Payment
          </DialogTitle>
          <DialogDescription>
            Choose your preferred wallet and network to pay {amount} USDC for the {tier} plan
          </DialogDescription>
        </DialogHeader>

        {/* Security Warning */}
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Important Security Notice:</p>
              <ul className="text-sm space-y-1 ml-4 list-disc">
                <li>This is a simulated payment system for demonstration purposes</li>
                <li>No real cryptocurrency will be transferred</li>
                <li>Always verify payment details in production environments</li>
                <li>Never share your private keys or seed phrases</li>
              </ul>
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={securityWarningAccepted}
                  onChange={(e) => setSecurityWarningAccepted(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">I understand and acknowledge this security notice</span>
              </label>
            </div>
          </AlertDescription>
        </Alert>
        
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
                  disabled={isConnecting || !securityWarningAccepted}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="text-2xl">{chain.icon}</div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{chain.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {chain.wallet} • {chain.fees}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {chain.security}
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
                <div className="flex justify-between">
                  <span>Network fee:</span>
                  <span className="text-xs">Varies by network</span>
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
