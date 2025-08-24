
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CreatorPaymentProps {
  tier: string;
  onPaymentSubmitted: (paymentId: string) => void;
  creatorId: string;
}

const TIER_PRICES = {
  basic: 0,
  pro: 25,
  elite: 50
};

const ADMIN_WALLETS = {
  ethereum: '0x4DEe7D9fa0E3e232AF7EfDF809E1fA5AdF4af61B',
  solana: 'FeByoSMhWJpo4f6M333RvHAe7ssvDGkioGVJTNyN3ihg',
  bsc: '0x4DEe7D9fa0E3e232AF7EfDF809E1fA5AdF4af61B',
  sui: '0x4DEe7D9fa0E3e232AF7EfDF809E1fA5AdF4af61B',
  cardano: 'addr1v8x2y3z4a5b6c7d8e9f0g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0'
};

export const CreatorPayment = ({ tier, onPaymentSubmitted, creatorId }: CreatorPaymentProps) => {
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [txHash, setTxHash] = useState('');
  const { user } = useAuth();
  
  const price = TIER_PRICES[tier as keyof typeof TIER_PRICES] || 0;

  const submitPayment = useMutation({
    mutationFn: async () => {
      if (!user || !selectedNetwork || !txHash) {
        throw new Error('Missing required fields');
      }

      const { data, error } = await supabase
        .from('payments')
        .insert([{
          user_id: user.id,
          creator_id: creatorId,
          payment_type: 'creator_tier',
          network: selectedNetwork,
          amount: price,
          currency: selectedNetwork === 'cardano' ? 'USDM' : 'USDC',
          tx_hash: txHash,
          admin_wallet_address: ADMIN_WALLETS[selectedNetwork as keyof typeof ADMIN_WALLETS],
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Payment submitted successfully! It will be reviewed by our team.');
      onPaymentSubmitted(data.id);
    },
    onError: (error: any) => {
      toast.error('Failed to submit payment: ' + error.message);
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getExplorerUrl = (network: string, hash: string) => {
    const explorers = {
      ethereum: `https://etherscan.io/tx/${hash}`,
      solana: `https://solscan.io/tx/${hash}`,
      bsc: `https://bscscan.com/tx/${hash}`,
      sui: `https://suiexplorer.com/txblock/${hash}`,
      cardano: `https://cardanoscan.io/transaction/${hash}`
    };
    return explorers[network as keyof typeof explorers];
  };

  if (price === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Basic tier is free! No payment required.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Instructions</CardTitle>
          <CardDescription>
            Send {price} {selectedNetwork === 'cardano' ? 'USDM' : 'USDC'} to complete your {tier} tier subscription
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Select Payment Network</Label>
            <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose network..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ethereum">Ethereum (USDC)</SelectItem>
                <SelectItem value="solana">Solana (USDC)</SelectItem>
                <SelectItem value="bsc">BSC (USDC)</SelectItem>
                <SelectItem value="sui">Sui (USDC)</SelectItem>
                <SelectItem value="cardano">Cardano (USDM)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedNetwork && (
            <>
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Send Amount</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-background px-3 py-2 rounded border flex-1">
                      {price} {selectedNetwork === 'cardano' ? 'USDM' : 'USDC'}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(price.toString())}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Send To Address</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-background px-3 py-2 rounded border flex-1 text-xs break-all">
                      {ADMIN_WALLETS[selectedNetwork as keyof typeof ADMIN_WALLETS]}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(ADMIN_WALLETS[selectedNetwork as keyof typeof ADMIN_WALLETS])}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>⚠️ Important:</p>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    <li>Send exactly {price} {selectedNetwork === 'cardano' ? 'USDM' : 'USDC'}</li>
                    <li>Use the exact address above</li>
                    <li>Wait for transaction confirmation</li>
                    <li>Copy the transaction hash below</li>
                  </ul>
                </div>
              </div>

              <div>
                <Label htmlFor="txHash">Transaction Hash</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="txHash"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="Paste your transaction hash here..."
                    className="flex-1"
                  />
                  {txHash && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(getExplorerUrl(selectedNetwork, txHash), '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <Button
                onClick={() => submitPayment.mutate()}
                disabled={!txHash || submitPayment.isPending}
                className="w-full"
              >
                {submitPayment.isPending ? 'Submitting...' : 'Submit Payment'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
