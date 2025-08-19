
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { processEthereumPayment, processSolanaPayment } from '@/lib/payments';
import { showErrorToast, RateLimitError } from '@/lib/errorHandler';
import { createRateLimiter } from '@/lib/validation';

interface ChainOption {
  id: 'ethereum' | 'base' | 'solana';
  name: string;
  wallet: string;
  icon: string;
  fees: string;
  color: string;
  security: string;
}

interface WalletConnectionManagerProps {
  onPaymentSuccess: (txHash: string, chain: string) => void;
  amount: number;
  securityWarningAccepted: boolean;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

const chainOptions: ChainOption[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    wallet: 'MetaMask',
    icon: '🦊',
    fees: 'High fees (~$15-50)',
    color: 'bg-blue-500',
    security: 'Most secure'
  },
  {
    id: 'base',
    name: 'Base',
    wallet: 'MetaMask',
    icon: '🔵',
    fees: 'Low fees (~$0.10-1)',
    color: 'bg-blue-600',
    security: 'Secure L2'
  },
  {
    id: 'solana',
    name: 'Solana',
    wallet: 'Phantom',
    icon: '👻',
    fees: 'Very low fees (~$0.01)',
    color: 'bg-purple-600',
    security: 'Fast & secure'
  }
];

// Rate limiter for payment attempts
const paymentLimiter = createRateLimiter(3, 60 * 1000);

export const WalletConnectionManager = ({
  onPaymentSuccess,
  amount,
  securityWarningAccepted,
  isProcessing,
  setIsProcessing
}: WalletConnectionManagerProps) => {
  const [selectedChain, setSelectedChain] = useState<'ethereum' | 'base' | 'solana' | null>(null);

  const handleConnect = async (chainId: 'ethereum' | 'base' | 'solana') => {
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

    setIsProcessing(true);
    setSelectedChain(chainId);

    try {
      let result;
      
      if (chainId === 'solana') {
        result = await processSolanaPayment(amount);
      } else {
        result = await processEthereumPayment(amount, chainId);
      }

      toast.success('Payment successful!', {
        description: `Transaction completed on ${result.chain}`,
      });

      onPaymentSuccess(result.txHash, result.chain);
    } catch (error: any) {
      console.error('Payment error:', error);
      showErrorToast(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Select Payment Method</h4>
      <div className="grid gap-3">
        {chainOptions.map((chain) => (
          <Button
            key={chain.id}
            variant={selectedChain === chain.id ? "default" : "outline"}
            className="h-auto p-4 justify-start"
            onClick={() => handleConnect(chain.id)}
            disabled={isProcessing || !securityWarningAccepted}
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
    </div>
  );
};
