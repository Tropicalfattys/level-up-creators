
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { processEthereumPayment, processSolanaPayment } from '@/lib/payments';
import { showErrorToast } from '@/lib/errorHandler';

interface WalletConnectProps {
  amount: number;
  currency: 'USDC';
  onPaymentSuccess: (txHash: string, chain: string) => void;
  onCancel: () => void;
}

export const WalletConnect = ({ amount, currency, onPaymentSuccess, onCancel }: WalletConnectProps) => {
  const [selectedChain, setSelectedChain] = useState<'ethereum' | 'base' | 'solana' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const chainOptions = [
    {
      id: 'ethereum' as const,
      name: 'Ethereum',
      wallet: 'MetaMask',
      icon: '🦊',
      fees: 'High fees (~$15-50)',
      color: 'bg-blue-500'
    },
    {
      id: 'base' as const,
      name: 'Base',
      wallet: 'MetaMask', 
      icon: '🔵',
      fees: 'Low fees (~$0.10-1)',
      color: 'bg-blue-600'
    },
    {
      id: 'solana' as const,
      name: 'Solana',
      wallet: 'Phantom',
      icon: '👻',
      fees: 'Very low fees (~$0.01)',
      color: 'bg-purple-600'
    }
  ];

  const handlePayment = async (chainId: 'ethereum' | 'base' | 'solana') => {
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
        description: `Transaction: ${result.txHash.slice(0, 10)}...`
      });
      
      onPaymentSuccess(result.txHash, result.chain);
    } catch (error: any) {
      console.error('Payment error:', error);
      showErrorToast(error);
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
              onClick={() => handlePayment(chain.id)}
              disabled={isProcessing}
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
