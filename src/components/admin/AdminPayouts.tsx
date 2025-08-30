
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Clock, CheckCircle, ExternalLink } from 'lucide-react';

interface PayoutRecord {
  id: string;
  amount: number;
  creator_id: string;
  network: string;
  created_at: string;
  payout_tx_hash: string | null;
  payout_status: string;
  paid_out_at: string | null;
  service_id: string;
  creator_user: {
    handle: string | null;
    email: string | null;
    payout_address_eth: string | null;
    payout_address_sol: string | null;
    payout_address_bsc: string | null;
    payout_address_cardano: string | null;
    payout_address_sui: string | null;
  } | null;
  services: {
    title: string;
  } | null;
}

export const AdminPayouts = () => {
  const [txHashes, setTxHashes] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { data: payouts, isLoading } = useQuery({
    queryKey: ['admin-payouts'],
    queryFn: async () => {
      console.log('Fetching payments for payouts...');
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          creator_id,
          network,
          created_at,
          payout_tx_hash,
          payout_status,
          paid_out_at,
          service_id,
          creator_user:users!payments_creator_id_fkey (
            handle,
            email,
            payout_address_eth,
            payout_address_sol,
            payout_address_bsc,
            payout_address_cardano,
            payout_address_sui
          ),
          services:services!payments_service_id_fkey (
            title
          )
        `)
        .eq('payment_type', 'service_booking')
        .eq('status', 'verified')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payouts:', error);
        throw error;
      }
      
      console.log('Fetched payouts data:', data);
      return data as PayoutRecord[];
    }
  });

  const payoutMutation = useMutation({
    mutationFn: async ({ paymentId, txHash }: { paymentId: string; txHash: string }) => {
      console.log('Attempting to record payout:', { paymentId, txHash });
      
      // First, let's check the current row to see what values it has
      const { data: currentRow, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();
        
      if (fetchError) {
        console.error('Error fetching current payment row:', fetchError);
        throw fetchError;
      }
      
      console.log('Current payment row before update:', currentRow);
      
      const { data, error } = await supabase
        .from('payments')
        .update({
          payout_tx_hash: txHash,
          payout_status: 'paid_out',
          paid_out_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select();

      if (error) {
        console.error('Payout update error:', error);
        throw error;
      }
      
      console.log('Payout update successful:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Payout mutation successful:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      toast.success('Payout recorded successfully');
      setTxHashes({});
    },
    onError: (error) => {
      console.error('Payout error:', error);
      toast.error(`Failed to record payout: ${error.message}`);
    }
  });

  const handlePayout = (paymentId: string) => {
    const txHash = txHashes[paymentId]?.trim();
    if (!txHash) {
      toast.error('Please enter a transaction hash');
      return;
    }
    console.log('Handling payout for payment:', paymentId, 'with tx hash:', txHash);
    payoutMutation.mutate({ paymentId, txHash });
  };

  const getPayoutAddress = (creator: PayoutRecord['creator_user'], network: string) => {
    if (!creator) return 'No address';
    
    switch (network.toLowerCase()) {
      case 'ethereum':
        return creator.payout_address_eth || 'No ETH address';
      case 'base':
        return creator.payout_address_eth || 'No ETH address';
      case 'solana':
        return creator.payout_address_sol || 'No SOL address';
      case 'bsc':
        return creator.payout_address_bsc || 'No BSC address';
      case 'cardano':
        return creator.payout_address_cardano || 'No ADA address';
      case 'sui':
        return creator.payout_address_sui || 'No SUI address';
      default:
        return 'Unknown network';
    }
  };

  const formatAmount = (amount: number) => {
    // Calculate 85% of the original amount (platform takes 15%)
    const payoutAmount = amount * 0.85;
    return payoutAmount.toFixed(2);
  };

  const getExplorerUrl = (txHash: string, network: string) => {
    switch (network.toLowerCase()) {
      case 'ethereum':
        return `https://etherscan.io/tx/${txHash}`;
      case 'base':
        return `https://basescan.org/tx/${txHash}`;
      case 'solana':
        return `https://explorer.solana.com/tx/${txHash}`;
      default:
        return `https://etherscan.io/tx/${txHash}`;
    }
  };

  const pendingPayouts = payouts?.filter(p => p.payout_status === 'pending') || [];
  const completedPayouts = payouts?.filter(p => p.payout_status === 'paid_out') || [];

  console.log('Pending payouts:', pendingPayouts.length);
  console.log('Completed payouts:', completedPayouts.length);

  const PayoutCard = ({ payout, isPending }: { payout: PayoutRecord; isPending: boolean }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPending ? (
                <Clock className="h-4 w-4 text-orange-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <span className="font-semibold">
                {payout.creator_user?.handle || payout.creator_user?.email || 'Unknown Creator'}
              </span>
            </div>
            <Badge variant={isPending ? "secondary" : "default"}>
              {isPending ? 'Pending' : 'Paid Out'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Service:</span>
              <div className="font-medium">{payout.services?.title || 'Unknown Service'}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Payout Amount:</span>
              <div className="font-semibold text-green-600">${formatAmount(payout.amount)} USDC</div>
            </div>
            <div>
              <span className="text-muted-foreground">Network:</span>
              <div className="capitalize">{payout.network}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Payment Date:</span>
              <div>{new Date(payout.created_at).toLocaleDateString()}</div>
            </div>
          </div>

          <div>
            <span className="text-muted-foreground text-sm">Payout Address:</span>
            <div className="font-mono text-sm bg-muted p-2 rounded break-all">
              {getPayoutAddress(payout.creator_user, payout.network)}
            </div>
          </div>

          {isPending ? (
            <div className="flex gap-2">
              <Input
                placeholder="Transaction hash"
                value={txHashes[payout.id] || ''}
                onChange={(e) => setTxHashes(prev => ({ ...prev, [payout.id]: e.target.value }))}
                className="flex-1"
              />
              <Button 
                onClick={() => handlePayout(payout.id)}
                disabled={payoutMutation.isPending || !txHashes[payout.id]?.trim()}
              >
                {payoutMutation.isPending ? 'Recording...' : 'Record Payout'}
              </Button>
            </div>
          ) : (
            payout.payout_tx_hash && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Transaction Hash:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getExplorerUrl(payout.payout_tx_hash!, payout.network), '_blank')}
                  className="flex items-center gap-1"
                >
                  <span className="font-mono text-xs">
                    {payout.payout_tx_hash.slice(0, 10)}...{payout.payout_tx_hash.slice(-8)}
                  </span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payout Management</CardTitle>
          <CardDescription>
            Manage creator payouts and earnings distribution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending ({pendingPayouts.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Completed ({completedPayouts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {isLoading ? (
                <div className="text-center py-8">Loading pending payouts...</div>
              ) : pendingPayouts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending payouts</p>
                  <p className="text-sm">Payouts will appear here when services are completed and verified.</p>
                </div>
              ) : (
                <div>
                  {pendingPayouts.map((payout) => (
                    <PayoutCard key={payout.id} payout={payout} isPending={true} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {isLoading ? (
                <div className="text-center py-8">Loading completed payouts...</div>
              ) : completedPayouts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No completed payouts yet</p>
                  <p className="text-sm">Completed payouts will appear here with transaction details.</p>
                </div>
              ) : (
                <div>
                  {completedPayouts.map((payout) => (
                    <PayoutCard key={payout.id} payout={payout} isPending={false} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
