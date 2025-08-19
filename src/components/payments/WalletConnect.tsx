
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { validateWalletAddress, validateTransactionHash } from '@/lib/walletValidation';
import { showErrorToast } from '@/lib/errorHandler';

interface WalletConnectProps {
  amount: number;
  currency: 'USDC';
  onPaymentSuccess: (txHash: string, chain: string) => void;
  onCancel: () => void;
}

export const WalletConnect = ({ amount, currency, onPaymentSuccess, onCancel }: WalletConnectProps) => {
  const [selectedChain, setSelectedChain] = useState<'ethereum' | 'base' | 'solana' | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
      let walletAddress: string;

      if (chainId === 'solana') {
        if (!(window as any).solana?.isPhantom) {
          toast.error('Phantom wallet not found. Please install Phantom.');
          window.open('https://phantom.app/', '_blank');
          return;
        }

        const resp = await (window as any).solana.connect();
        walletAddress = resp.publicKey.toString();
      } else {
        if (!(window as any).ethereum) {
          toast.error('MetaMask not found. Please install MetaMask.');
          window.open('https://metamask.io/', '_blank');
          return;
        }

        const accounts = await (window as any).ethereum.request({ 
          method: 'eth_requestAccounts' 
        });

        if (!accounts?.length) {
          throw new Error('No wallet accounts found');
        }

        walletAddress = accounts[0];
      }

      // Validate wallet address using the new utility
      const validation = validateWalletAddress(walletAddress, chainId);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid wallet address');
      }

      toast.success(`Connected to wallet: ${walletAddress.slice(0, 8)}...`);
      await processPayment(chainId, validation.address!);
    } catch (error) {
      console.error('Wallet connection error:', error);
      showErrorToast(error as Error);
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
      
      // Validate the generated transaction hash
      if (!validateTransactionHash(mockTxHash, chain)) {
        throw new Error('Invalid transaction hash generated');
      }
      
      toast.success('Payment successful!');
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
      <Card>
        <CardHeader>
          <CardTitle>Processing Payment</CardTitle>
          <CardDescription>
            Please wait while we process your {amount} {currency} payment...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Do not close this window. Your payment is being processed.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Connect Wallet
        </CardTitle>
        <CardDescription>
          Choose your preferred wallet and network to pay {amount} {currency}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
                <Badge variant="secondary">{currency}</Badge>
              </div>
            </Button>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-medium">{amount} {currency}</span>
            </div>
            <div className="flex justify-between">
              <span>Destination:</span>
              <span className="font-mono text-xs">Platform Escrow</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
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
      </CardContent>
    </Card>
  );
};
