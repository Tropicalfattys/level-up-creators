
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { validateWalletAddress } from '@/lib/walletValidation';
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
  const [isConnecting, setIsConnecting] = useState(false);

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

    setIsConnecting(true);
    setSelectedChain(chainId);

    try {
      let walletAddress: string;

      if (chainId === 'solana') {
        if (!(window as any).solana?.isPhantom) {
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
        walletAddress = resp.publicKey.toString();
      } else {
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

        const accounts = await (window as any).ethereum.request({ 
          method: 'eth_requestAccounts' 
        });

        if (!accounts?.length) {
          throw new Error('No wallet accounts found');
        }

        walletAddress = accounts[0];

        // Handle Base network switching
        if (chainId === 'base') {
          try {
            await (window as any).ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x2105' }],
            });
          } catch (switchError: any) {
            if (switchError.code === 4902) {
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
      }

      // Validate wallet address
      const validation = validateWalletAddress(walletAddress, chainId);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid wallet address');
      }

      toast.success(`Connected: ${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}`);
      await processPayment(chainId, validation.address!);
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      
      if (error.code === 4001) {
        toast.error('Connection cancelled by user');
      } else if (error.code === -32002) {
        toast.error('Check wallet for pending connection request');
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
      const processingTime = Math.random() * 2000 + 2000;
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      const timestamp = Date.now().toString(16);
      const random = Math.random().toString(16).slice(2, 18);
      const mockTxHash = `0x${timestamp}${random}`.slice(0, 66);
      
      if (!/^0x[a-fA-F0-9]{64}$/.test(mockTxHash)) {
        throw new Error('Invalid transaction hash generated');
      }

      toast.success('Payment successful!', {
        description: `Transaction completed on ${chain}`,
      });

      onPaymentSuccess(mockTxHash, chain);
    } catch (error) {
      console.error('Payment error:', error);
      showErrorToast(error as Error);
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
            disabled={isConnecting || !securityWarningAccepted || isProcessing}
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
