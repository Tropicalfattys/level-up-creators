import { useState } from 'react';
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Clock, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { getExplorerUrl } from "@/lib/utils";

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
  booking_id: string | null;
  booking_status: string | null;
  has_open_dispute: boolean;
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
  refund_type?: 'dispute' | 'rejection';
  client_user: {
    handle: string | null;
    email: string | null;
    payout_address_eth: string | null;
    payout_address_sol: string | null;
    payout_address_bsc: string | null;
    payout_address_cardano: string | null;
    payout_address_sui: string | null;
  } | null;
  bookings: {
    services: {
      title: string;
    } | null;
  } | null;
}

export const AdminPayouts = () => {
  const [selectedTab, setSelectedTab] = useState("pending");
  const [txHashes, setTxHashes] = useState<Record<string, string>>({});
  const [refundTxHashes, setRefundTxHashes] = useState<Record<string, string>>({});
  const isMobile = useIsMobile();
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
          booking_id,
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
          ),
          bookings:bookings!payments_booking_id_fkey (
            status
          )
        `)
        .eq('payment_type', 'service_booking')
        .eq('status', 'verified')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payouts:', error);
        throw error;
      }

      // Transform data to include work status
      const transformedData = await Promise.all(data.map(async (payout: any) => {
        let hasOpenDispute = false;
        
        // Check for open disputes if there's a booking_id
        if (payout.booking_id) {
          const { data: disputes } = await supabase
            .from('disputes')
            .select('id')
            .eq('booking_id', payout.booking_id)
            .eq('status', 'open')
            .limit(1);
          
          hasOpenDispute = disputes && disputes.length > 0;
        }

        return {
          ...payout,
          booking_status: payout.bookings?.status || null,
          has_open_dispute: hasOpenDispute
        };
      }));
      
      return transformedData as PayoutRecord[];
    }
  });

  const { data: refunds, isLoading: refundsLoading } = useQuery({
    queryKey: ['admin-refunds'],
    queryFn: async () => {
      // Get both disputed refunds and rejected bookings
      const [disputeRefunds, rejectedBookings] = await Promise.all([
        // Existing dispute refunds
        supabase
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
                email,
                payout_address_eth,
                payout_address_sol,
                payout_address_bsc,
                payout_address_cardano,
                payout_address_sui
              )
            )
          `)
          .eq('status', 'resolved')
          .eq('bookings.status', 'refunded')
          .order('created_at', { ascending: false }),
        
        // Rejected bookings - simplified query to avoid PostgREST foreign key issues
        supabase
          .from('bookings')
          .select(`
            id,
            usdc_amount,
            chain,
            status,
            client_id,
            created_at,
            updated_at,
            refund_tx_hash,
            refunded_at,
            services (
              title
            )
          `)
          .eq('status', 'rejected_by_creator')
          .order('created_at', { ascending: false })
      ]);

      if (disputeRefunds.error) {
        console.error('Error fetching dispute refunds:', disputeRefunds.error);
        throw disputeRefunds.error;
      }

      if (rejectedBookings.error) {
        console.error('Error fetching rejected bookings:', rejectedBookings.error);
        throw rejectedBookings.error;
      }

      
      // Transform dispute refunds
      const transformedDisputeRefunds = disputeRefunds.data.map(item => ({
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
        },
        refund_type: 'dispute' as const
      }));

      // Get client user data separately for rejected bookings
      const clientIds = rejectedBookings.data.map(booking => booking.client_id);
      const { data: clientUsers } = await supabase
        .from('users')
        .select(`
          id,
          handle,
          email,
          payout_address_eth,
          payout_address_sol,
          payout_address_bsc,
          payout_address_cardano,
          payout_address_sui
        `)
        .in('id', clientIds);

      console.log('Rejected bookings found:', rejectedBookings.data.length);
      console.log('Client users found:', clientUsers?.length || 0);

      // Transform rejected bookings with proper client user data
      const transformedRejectedBookings = rejectedBookings.data.map(item => {
        const clientUser = clientUsers?.find(user => user.id === item.client_id);
        return {
          id: `rejected_${item.id}`, // Unique ID for rejected bookings
          booking_id: item.id,
          amount: item.usdc_amount,
          network: item.chain,
          created_at: item.updated_at || item.created_at, // Use updated_at for rejection time
          refund_tx_hash: item.refund_tx_hash,
          refunded_at: item.refunded_at,
          client_user: clientUser,
          bookings: {
            services: item.services
          },
          refund_type: 'rejection' as const
        };
      });
      
      // Combine and sort by creation date
      const allRefunds = [...transformedDisputeRefunds, ...transformedRejectedBookings]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      return allRefunds as RefundRecord[];
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
    mutationFn: async ({ refundId, txHash, refundType }: { refundId: string; txHash: string; refundType: 'dispute' | 'rejection' }) => {
      if (refundType === 'dispute') {
        // Handle dispute refunds
        const { data, error } = await supabase
          .from('disputes')
          .update({
            refund_tx_hash: txHash,
            refunded_at: new Date().toISOString()
          })
          .eq('id', refundId)
          .select();
        
        if (error) {
          console.error('Dispute refund update error:', error);
          throw error;
        }
        return data;
      } else {
        // Handle rejection refunds - update the booking directly
        const bookingId = refundId.replace('rejected_', ''); // Extract booking ID
        const { data, error } = await supabase
          .from('bookings')
          .update({
            refund_tx_hash: txHash,
            refunded_at: new Date().toISOString()
          })
          .eq('id', bookingId)
          .select();
        
        if (error) {
          console.error('Booking refund update error:', error);
          throw error;
        }
        return data;
      }
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

  const handleRefund = (refundId: string, refundType: 'dispute' | 'rejection' = 'dispute') => {
    const txHash = refundTxHashes[refundId]?.trim();
    if (!txHash) {
      toast.error('Please enter a transaction hash');
      return;
    }
    refundMutation.mutate({ refundId, txHash, refundType });
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

  const getRefundAddress = (client: RefundRecord['client_user'], network: string | null) => {
    if (!client) return 'No address';
    if (!network) return client.payout_address_eth || client.payout_address_sol || 'No address available';
    
    switch (network.toLowerCase()) {
      case 'ethereum':
        return client.payout_address_eth || 'No ETH address';
      case 'base':
        return client.payout_address_eth || 'No ETH address';
      case 'solana':
        return client.payout_address_sol || 'No SOL address';
      case 'bsc':
        return client.payout_address_bsc || 'No BSC address';
      case 'cardano':
        return client.payout_address_cardano || 'No ADA address';
      case 'sui':
        return client.payout_address_sui || 'No SUI address';
      default:
        return 'Unknown network';
    }
  };

  const formatAmount = (amount: number) => {
    // Calculate 85% of the original amount (platform takes 15%)
    const payoutAmount = amount * 0.85;
    return payoutAmount.toFixed(2);
  };

  const formatRefundAmount = (amount: number, refundType?: 'dispute' | 'rejection') => {
    // For creator rejections, only 5% platform fee (95% refund)
    // For disputes, normal 15% platform fee (85% refund)
    const refundAmount = refundType === 'rejection' ? amount * 0.95 : amount * 0.85;
    return refundAmount.toFixed(2);
  };

  // Using centralized explorer URL utility

  const getWorkStatus = (payout: PayoutRecord) => {
    // Check if the booking is refunded
    if (payout.booking_status === 'refunded') {
      return { status: 'refunded', label: 'Refunded', variant: 'destructive' as const };
    }
    
    if (payout.has_open_dispute) {
      return { status: 'disputed', label: 'Disputed', variant: 'destructive' as const };
    }
    
    if (payout.booking_status === 'accepted' || payout.booking_status === 'released') {
      return { status: 'accepted', label: 'Work Accepted', variant: 'default' as const };
    }
    
    if (payout.booking_status === 'delivered') {
      return { status: 'delivered', label: 'Work Delivered', variant: 'secondary' as const };
    }
    
    return { status: 'in_progress', label: 'Work In Progress', variant: 'secondary' as const };
  };

  // Filter based on whether payout_tx_hash exists and exclude refunded bookings from pending
  const pendingPayouts = payouts?.filter(p => !p.payout_tx_hash && p.booking_status !== 'refunded') || [];
  const completedPayouts = payouts?.filter(p => p.payout_tx_hash) || [];
  
  // Get refunded payment records to show in refunds tab
  const refundedPayments = payouts?.filter(p => p.booking_status === 'refunded') || [];
  
  // Separate dispute refunds from rejected bookings
  const disputeRefunds = refunds?.filter(r => r.refund_type === 'dispute') || [];
  const rejectedBookings = refunds?.filter(r => r.refund_type === 'rejection') || [];
  
  const pendingDisputeRefunds = disputeRefunds.filter(r => !r.refund_tx_hash);
  const completedDisputeRefunds = disputeRefunds.filter(r => r.refund_tx_hash);
  const pendingRejectedBookings = rejectedBookings.filter(r => !r.refund_tx_hash);
  const completedRejectedBookings = rejectedBookings.filter(r => r.refund_tx_hash);
  
  // Keep legacy variables for compatibility
  const pendingRefunds = refunds?.filter(r => !r.refund_tx_hash) || [];
  const completedRefunds = refunds?.filter(r => r.refund_tx_hash) || [];

  const PayoutCard = ({ payout, isPending }: { payout: PayoutRecord; isPending: boolean }) => {
    const workStatus = getWorkStatus(payout);
    
    return (
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
              <div className="flex flex-col items-end gap-1">
                <Badge variant={isPending ? "secondary" : "default"}>
                  {isPending ? 'Pending' : 'Paid Out'}
                </Badge>
                {isPending && (
                  <Badge variant={workStatus.variant} className="text-xs">
                    {workStatus.label}
                  </Badge>
                )}
              </div>
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
                    onClick={() => window.open(getExplorerUrl(payout.network, payout.payout_tx_hash!), '_blank')}
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
  };

  const RefundCard = ({ refund, isPending }: { refund: RefundRecord; isPending: boolean }) => {
    const isRejection = refund.refund_type === 'rejection';

    return (
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
              <div className="flex flex-col gap-1">
                <Badge variant={isPending ? "secondary" : "default"}>
                  {isPending ? 'Refund Pending' : 'Refund Processed'}
                </Badge>
                {isRejection && (
                  <Badge variant="destructive" className="text-xs">
                    Rejected By Creator
                  </Badge>
                )}
              </div>
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
              <div className="font-semibold text-red-600">
                ${formatRefundAmount(refund.amount, refund.refund_type)} USDC
                {isRejection && <span className="text-xs text-muted-foreground ml-1">(5% fee)</span>}
                {!isRejection && <span className="text-xs text-muted-foreground ml-1">(15% fee)</span>}
              </div>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">{isRejection ? 'Rejection Date:' : 'Dispute Date:'}</span>
              <div>{new Date(refund.created_at).toLocaleDateString()}</div>
            </div>
          </div>

          <div>
            <span className="text-muted-foreground text-sm">Client Refund Address:</span>
            <div className="font-mono text-sm bg-muted p-2 rounded break-all">
              {getRefundAddress(refund.client_user, refund.network)}
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
                onClick={() => handleRefund(refund.id, refund.refund_type)}
                disabled={refundMutation.isPending || !refundTxHashes[refund.id]?.trim()}
              >
                {refundMutation.isPending ? 'Recording...' : 'Record Refund'}
              </Button>
            </div>
          ) : (
            // Always show transaction hash section for completed refunds
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Refund Transaction Hash:</span>
                {refund.refund_tx_hash ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {refund.refund_tx_hash.slice(0, 10)}...{refund.refund_tx_hash.slice(-8)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        try {
                          const explorerUrl = getExplorerUrl(refund.network, refund.refund_tx_hash!);
                          window.open(explorerUrl, '_blank');
                        } catch (error) {
                          console.error('Failed to open explorer URL:', error);
                        }
                      }}
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View
                    </Button>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">No transaction hash recorded</span>
                )}
              </div>
              {refund.refund_tx_hash && (
                <div className="text-xs text-muted-foreground">
                  Full Hash: <span className="font-mono break-all">{refund.refund_tx_hash}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

  // New component for refunded services showing client information
  const RefundedServiceCard = ({ payout }: { payout: PayoutRecord }) => {
    // We need to get client info from the booking
    const [clientInfo, setClientInfo] = useState<any>(null);
    
    // Fetch client info when component mounts
    React.useEffect(() => {
      const fetchClientInfo = async () => {
        if (!payout.booking_id) return;
        
        const { data } = await supabase
          .from('bookings')
          .select(`
            client_id,
            tx_hash,
            users:users!bookings_client_id_fkey (
              handle,
              email,
              payout_address_eth,
              payout_address_sol,
              payout_address_bsc,
              payout_address_cardano,
              payout_address_sui
            )
          `)
          .eq('id', payout.booking_id)
          .single();
          
        if (data) {
          setClientInfo(data);
        }
      };
      
      fetchClientInfo();
    }, [payout.booking_id]);

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-red-500" />
                <span className="font-semibold">
                  {clientInfo?.users?.handle || clientInfo?.users?.email || 'Unknown Client'}
                </span>
              </div>
              <Badge variant="destructive">
                Refunded
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Service:</span>
                <div className="font-medium">{payout.services?.title || 'Unknown Service'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Original Amount:</span>
                <div className="font-medium">${payout.amount} USDC</div>
              </div>
              <div>
                <span className="text-muted-foreground">Network:</span>
                <div className="capitalize">{payout.network}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Refund Amount:</span>
                <div className="font-semibold text-red-600">${formatRefundAmount(payout.amount)} USDC</div>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Payment Date:</span>
                <div>{new Date(payout.created_at).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-muted-foreground text-sm">Client Refund Address:</span>
                <div className="font-mono text-sm bg-muted p-2 rounded break-all">
                  {clientInfo ? getRefundAddress(clientInfo.users, payout.network) : 'Loading...'}
                </div>
              </div>
              
              <div>
                <span className="text-muted-foreground text-sm">Creator Payout Address:</span>
                <div className="font-mono text-sm bg-muted p-2 rounded break-all">
                  {getPayoutAddress(payout.creator_user, payout.network)}
                </div>
              </div>
            </div>

            {/* Show original payment transaction hash */}
            {clientInfo?.tx_hash && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Original Payment Hash:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getExplorerUrl(payout.network, clientInfo.tx_hash), '_blank')}
                  className="flex items-center gap-1"
                >
                  <span className="font-mono text-xs">
                    {clientInfo.tx_hash.slice(0, 10)}...{clientInfo.tx_hash.slice(-8)}
                  </span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

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
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
            {isMobile ? (
              <Select value={selectedTab} onValueChange={setSelectedTab}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select tab" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  <SelectItem value="pending">
                    Pending ({pendingPayouts.length})
                  </SelectItem>
                  <SelectItem value="refunds">
                    Refunds ({pendingRefunds.length + completedRefunds.length + refundedPayments.length + pendingRejectedBookings.length + completedRejectedBookings.length})
                  </SelectItem>
                  <SelectItem value="completed">
                    Completed ({completedPayouts.length})
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <TabsList>
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending ({pendingPayouts.length})
                </TabsTrigger>
                <TabsTrigger value="refunds" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refunds ({pendingRefunds.length + completedRefunds.length + refundedPayments.length + pendingRejectedBookings.length + completedRejectedBookings.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Completed ({completedPayouts.length})
                </TabsTrigger>
              </TabsList>
            )}

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
              ) : pendingRefunds.length === 0 && completedRefunds.length === 0 && refundedPayments.length === 0 && pendingRejectedBookings.length === 0 && completedRejectedBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending refunds</p>
                  <p className="text-sm">Refunds will appear here when disputes are resolved in favor of clients.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Show refunded payment records */}
                  {refundedPayments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-4">Refunded Services</h4>
                      {refundedPayments.map((payout) => (
                        <RefundedServiceCard key={payout.id} payout={payout} />
                      ))}
                    </div>
                  )}
                  
                  {/* Show pending rejected bookings */}
                  {pendingRejectedBookings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-4">Pending Creator Rejections (Need Refund)</h4>
                      {pendingRejectedBookings.map((refund) => (
                        <RefundCard key={refund.id} refund={refund} isPending={true} />
                      ))}
                    </div>
                  )}
                  
                  {/* Show completed rejected bookings */}
                  {completedRejectedBookings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-4">Completed Creator Rejection Refunds</h4>
                      {completedRejectedBookings.map((refund) => (
                        <RefundCard key={refund.id} refund={refund} isPending={false} />
                      ))}
                    </div>
                  )}
                  
                  {/* Show pending dispute-based refunds */}
                  {pendingDisputeRefunds.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-4">Pending Dispute Refunds</h4>
                      {pendingDisputeRefunds.map((refund) => (
                        <RefundCard key={refund.id} refund={refund} isPending={true} />
                      ))}
                    </div>
                  )}
                  
                  {/* Show completed dispute-based refunds */}
                  {completedDisputeRefunds.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-4">Completed Dispute Refunds</h4>
                      {completedDisputeRefunds.map((refund) => (
                        <RefundCard key={refund.id} refund={refund} isPending={false} />
                      ))}
                    </div>
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
                  <p>No completed payouts</p>
                  <p className="text-sm">Completed payouts will appear here after successful service deliveries.</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Completed Payouts</h3>
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