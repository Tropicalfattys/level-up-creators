import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Clock, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';

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

interface RefundRecord {
  id: string;
  booking_id: string;
  amount: number;
  network: string;
  created_at: string;
  refund_tx_hash: string | null;
  refunded_at: string | null;
  client_user: {
    handle: string | null;
    email: string | null;
  } | null;
  bookings: {
    services: {
      title: string;
    } | null;
  } | null;
}

export const AdminPayouts = () => {
  const [txHashes, setTxHashes] = useState<Record<string, string>>({});
  const [refundTxHashes, setRefundTxHashes] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { data: payouts, isLoading } = useQuery({
    queryKey: ['admin-payouts'],
    queryFn: async () => {
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
      
      return data as PayoutRecord[];
    }
  });

  const { data: refunds, isLoading: refundsLoading } = useQuery({
    queryKey: ['admin-refunds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disputes')
        .select(`
          id,
          booking_id,
          created_at,
          refund_tx_hash,
          refunded_at,
          bookings!inner (
            id,
            usdc_amount,
            chain,
            status,
            client_id,
            services (
              title
            ),
            client_user:users!bookings_client_id_fkey (
              handle,
              email
            )
          )
        `)
        .eq('status', 'resolved')
        .eq('bookings.status', 'refunded')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching refunds:', error);
        throw error;
      }
      
      // Transform the data to match our RefundRecord interface
      const transformedData = data.map(item => ({
        id: item.id,
        booking_id: item.booking_id,
        amount: item.bookings.usdc_amount,
        network: item.bookings.chain,
        created_at: item.created_at,
        refund_tx_hash: item.refund_tx_hash,
        refunded_at: item.refunded_at,
        client_user: item.bookings.client_user,
        bookings: {
          services: item.bookings.services
        }
      }));
      
      return transformedData as RefundRecord[];
    }
  });

  const payoutMutation = useMutation({
    mutationFn: async ({ paymentId, txHash }: { paymentId: string; txHash: string }) => {
      const { data, error } = await supabase
        .from('payments')
        .update({
          payout_tx_hash: txHash,
          paid_out_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select();

      if (error) {
        console.error('Payout update error:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      toast.success('Payout recorded successfully');
      setTxHashes({});
    },
    onError: (error) => {
      console.error('Payout error:', error);
      toast.error(`Failed to record payout: ${error.message}`);
    }
  });

  const refundMutation = useMutation({
    mutationFn: async ({ disputeId, txHash }: { disputeId: string; txHash: string }) => {
      const { data, error } = await supabase
        .from('disputes')
        .update({
          refund_tx_hash: txHash,
          refunded_at: new Date().toISOString()
        })
        .eq('id', disputeId)
        .select();

      if (error) {
        console.error('Refund update error:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      toast.success('Refund recorded successfully');
      setRefundTxHashes({});
    },
    onError: (error) => {
      console.error('Refund error:', error);
      toast.error(`Failed to record refund: ${error.message}`);
    }
  });

  const handlePayout = (paymentId: string) => {
    const txHash = txHashes[paymentId]?.trim();
    if (!txHash) {
      toast.error('Please enter a transaction hash');
      return;
    }
    payoutMutation.mutate({ paymentId, txHash });
  };

  const handleRefund = (disputeId: string) => {
    const txHash = refundTxHashes[disputeId]?.trim();
    if (!txHash) {
      toast.error('Please enter a transaction hash');
      return;
    }
    refundMutation.mutate({ disputeId, txHash });
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

  const formatRefundAmount = (amount: number) => {
    // For refunds, we refund 85% (client loses the 15% platform fee)
    const refundAmount = amount * 0.85;
    return refundAmount.toFixed(2);
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

  // Filter based on whether payout_tx_hash exists instead of payout_status
  const pendingPayouts = payouts?.filter(p => !p.payout_tx_hash) || [];
  const completedPayouts = payouts?.filter(p => p.payout_tx_hash) || [];
  const pendingRefunds = refunds?.filter(r => !r.refund_tx_hash) || [];
  const completedRefunds = refunds?.filter(r => r.refund_tx_hash) || [];

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

  const RefundCard = ({ refund, isPending }: { refund: RefundRecord; isPending: boolean }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPending ? (
                <RefreshCw className="h-4 w-4 text-orange-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <span className="font-semibold">
                {refund.client_user?.handle || refund.client_user?.email || 'Unknown Client'}
              </span>
            </div>
            <Badge variant={isPending ? "secondary" : "default"}>
              {isPending ? 'Refund Pending' : 'Refund Processed'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Service:</span>
              <div className="font-medium">{refund.bookings?.services?.title || 'Unknown Service'}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Original Amount:</span>
              <div className="font-medium">${refund.amount} USDC</div>
            </div>
            <div>
              <span className="text-muted-foreground">Network:</span>
              <div className="capitalize">{refund.network}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Refund Amount:</span>
              <div className="font-semibold text-red-600">${formatRefundAmount(refund.amount)} USDC</div>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Dispute Date:</span>
              <div>{new Date(refund.created_at).toLocaleDateString()}</div>
            </div>
          </div>

          {isPending ? (
            <div className="flex gap-2">
              <Input
                placeholder="Refund transaction hash"
                value={refundTxHashes[refund.id] || ''}
                onChange={(e) => setRefundTxHashes(prev => ({ ...prev, [refund.id]: e.target.value }))}
                className="flex-1"
              />
              <Button 
                onClick={() => handleRefund(refund.id)}
                disabled={refundMutation.isPending || !refundTxHashes[refund.id]?.trim()}
              >
                {refundMutation.isPending ? 'Recording...' : 'Record Refund'}
              </Button>
            </div>
          ) : (
            refund.refund_tx_hash && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Refund Transaction Hash:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getExplorerUrl(refund.refund_tx_hash!, refund.network), '_blank')}
                  className="flex items-center gap-1"
                >
                  <span className="font-mono text-xs">
                    {refund.refund_tx_hash.slice(0, 10)}...{refund.refund_tx_hash.slice(-8)}
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
            Manage creator payouts and client refunds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending ({pendingPayouts.length})
              </TabsTrigger>
              <TabsTrigger value="refunds" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Refunds ({pendingRefunds.length})
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

            <TabsContent value="refunds">
              {refundsLoading ? (
                <div className="text-center py-8">Loading refunds...</div>
              ) : pendingRefunds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No refunds to process</p>
                  <p className="text-sm">Refund requests will appear here when disputes are resolved in favor of clients.</p>
                </div>
              ) : (
                <div>
                  {pendingRefunds.map((refund) => (
                    <RefundCard key={refund.id} refund={refund} isPending={true} />
                  ))}
                  {completedRefunds.length > 0 && (
                    <>
                      <div className="text-sm font-medium text-muted-foreground mt-6 mb-4">Completed Refunds</div>
                      {completedRefunds.map((refund) => (
                        <RefundCard key={refund.id} refund={refund} isPending={false} />
                      ))}
                    </>
                  )}
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
