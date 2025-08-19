
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { processEthereumPayment, processSolanaPayment } from '@/lib/payments';
import { showErrorToast, RateLimitError } from '@/lib/errorHandler';
import { createRateLimiter } from '@/lib/validation';
import { detectMetaMask, detectPhantom } from '@/lib/walletDetection';

interface ChainOption {
  id: 'ethereum' | 'base' | 'solana';
  name: string;
  wallet: string;
  icon: string;
  fees: string;
  color: string;
  security: string;
  available: boolean;
}

interface WalletConnectionManagerProps {
  onPaymentSuccess: (txHash: string, chain: string) => void;
  amount: number;
  securityWarningAccepted: boolean;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

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

  // Detect available wallets
  const metaMask = detectMetaMask();
  const phantom = detectPhantom();

  const chainOptions: ChainOption[] = [
    {
      id: 'ethereum',
      name: 'Ethereum',
      wallet: 'MetaMask',
      icon: '🦊',
      fees: 'High fees (~$15-50)',
      color: 'bg-blue-500',
      security: 'Most secure',
      available: metaMask.isInstalled
    },
    {
      id: 'base',
      name: 'Base',
      wallet: 'MetaMask',
      icon: '🔵',
      fees: 'Low fees (~$0.10-1)',
      color: 'bg-blue-600',
      security: 'Secure L2',
      available: metaMask.isInstalled
    },
    {
      id: 'solana',
      name: 'Solana',
      wallet: 'Phantom',
      icon: '👻',
      fees: 'Very low fees (~$0.01)',
      color: 'bg-purple-600',
      security: 'Fast & secure',
      available: phantom.isInstalled
    }
  ];

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

    const option = chainOptions.find(opt => opt.id === chainId);
    if (!option?.available) {
      toast.error('Wallet Not Available', {
        description: `Please install ${option?.wallet} to use ${option?.name}`
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
      setSelectedChain(null);
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
            className={`h-auto p-4 justify-start ${!chain.available ? 'opacity-50' : ''}`}
            onClick={() => handleConnect(chain.id)}
            disabled={isProcessing || !securityWarningAccepted || !chain.available}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="text-2xl">{chain.icon}</div>
              <div className="flex-1 text-left">
                <div className="font-medium">{chain.name}</div>
                <div className="text-sm text-muted-foreground">
                  {chain.wallet} • {chain.fees}
                </div>
                <div className="text-xs text-muted-foreground">
                  {chain.available ? chain.security : `Install ${chain.wallet}`}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="secondary">USDC</Badge>
                {!chain.available && (
                  <Badge variant="destructive" className="text-xs">Not Available</Badge>
                )}
              </div>
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

      {!metaMask.isInstalled && !phantom.isInstalled && (
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            No crypto wallets detected. Install a wallet to continue:
          </p>
          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('https://metamask.io/download/', '_blank')}
            >
              Install MetaMask
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('https://phantom.app/', '_blank')}
            >
              Install Phantom
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
