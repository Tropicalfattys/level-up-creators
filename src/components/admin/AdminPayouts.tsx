
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, DollarSign, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PayoutData {
  id: string;
  user_id: string;
  creator_id: string;
  service_id: string;
  booking_id: string;
  amount: number;
  network: string;
  tx_hash: string;
  payout_tx_hash: string | null;
  payout_status: string | null;
  created_at: string;
  paid_out_at: string | null;
  paid_out_by: string | null;
  payer: {
    handle: string;
    email: string;
  };
  creator: {
    handle: string;
    email: string;
    payout_address_eth: string | null;
    payout_address_sol: string | null;
    payout_address_bsc: string | null;
    payout_address_sui: string | null;
    payout_address_cardano: string | null;
  };
  service: {
    title: string;
    price_usdc: number;
    payment_method: string;
  };
  booking: {
    status: string;
    delivered_at: string | null;
  };
  disputes: Array<{
    status: string;
  }>;
}

export const AdminPayouts = () => {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [networkFilter, setNetworkFilter] = useState<string>('all');
  const [payoutHashes, setPayoutHashes] = useState<Record<string, string>>({});
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: payouts, isLoading } = useQuery({
    queryKey: ['admin-payouts', statusFilter, networkFilter],
    queryFn: async (): Promise<PayoutData[]> => {
      console.log('=== PAYOUTS DEBUG START ===');
      
      // First, let's see what payment records exist
      const { data: allPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('All payments in database:', allPayments);
      console.log('Payments query error:', paymentsError);
      
      // Check what bookings exist
      const { data: allBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('All bookings in database:', allBookings);
      console.log('Bookings query error:', bookingsError);
      
      // Now let's get payments that should be eligible for payouts
      // Looking for any payments that have tx_hash (meaning payment was made) and have creator_id
      const { data: eligiblePayments, error: eligibleError } = await supabase
        .from('payments')
        .select(`
          *,
          users!payments_user_id_fkey(handle, email),
          creators:users!payments_creator_id_fkey(
            handle, 
            email, 
            payout_address_eth, 
            payout_address_sol, 
            payout_address_bsc, 
            payout_address_sui, 
            payout_address_cardano
          ),
          services!payments_service_id_fkey(title, price_usdc, payment_method),
          bookings!payments_booking_id_fkey(status, delivered_at)
        `)
        .not('tx_hash', 'is', null)
        .not('creator_id', 'is', null)
        .order('created_at', { ascending: false });
      
      console.log('Eligible payments for payouts:', eligiblePayments);
      console.log('Eligible payments error:', eligibleError);
      
      setDebugInfo({
        totalPayments: allPayments?.length || 0,
        totalBookings: allBookings?.length || 0,
        eligiblePayments: eligiblePayments?.length || 0,
        paymentTypes: [...new Set(allPayments?.map(p => p.payment_type))],
        paymentStatuses: [...new Set(allPayments?.map(p => p.status))],
        bookingStatuses: [...new Set(allBookings?.map(b => b.status))]
      });
      
      if (eligibleError) {
        console.error('Error fetching eligible payments:', eligibleError);
        throw eligibleError;
      }
      
      if (!eligiblePayments || eligiblePayments.length === 0) {
        console.log('No eligible payments found for payouts');
        return [];
      }
      
      // Get disputes for these bookings
      const bookingIds = eligiblePayments.map(p => p.booking_id).filter(Boolean);
      const { data: disputesData } = await supabase
        .from('disputes')
        .select('booking_id, status')
        .in('booking_id', bookingIds);
      
      console.log('Disputes for bookings:', disputesData);
      
      // Transform the data
      const transformedData: PayoutData[] = eligiblePayments.map(payment => {
        const relatedDisputes = disputesData?.filter(d => d.booking_id === payment.booking_id) || [];
        
        return {
          id: payment.id,
          user_id: payment.user_id,
          creator_id: payment.creator_id,
          service_id: payment.service_id,
          booking_id: payment.booking_id,
          amount: Number(payment.amount),
          network: payment.network,
          tx_hash: payment.tx_hash,
          payout_tx_hash: payment.payout_tx_hash,
          payout_status: payment.payout_status || 'pending',
          created_at: payment.created_at,
          paid_out_at: payment.paid_out_at,
          paid_out_by: payment.paid_out_by,
          payer: {
            handle: payment.users?.handle || 'Unknown',
            email: payment.users?.email || 'Unknown'
          },
          creator: {
            handle: payment.creators?.handle || 'Unknown',
            email: payment.creators?.email || 'Unknown',
            payout_address_eth: payment.creators?.payout_address_eth,
            payout_address_sol: payment.creators?.payout_address_sol,
            payout_address_bsc: payment.creators?.payout_address_bsc,
            payout_address_sui: payment.creators?.payout_address_sui,
            payout_address_cardano: payment.creators?.payout_address_cardano
          },
          service: {
            title: payment.services?.title || 'Unknown Service',
            price_usdc: Number(payment.services?.price_usdc || payment.amount),
            payment_method: payment.services?.payment_method || 'ethereum_usdc'
          },
          booking: {
            status: payment.bookings?.status || 'unknown',
            delivered_at: payment.bookings?.delivered_at
          },
          disputes: relatedDisputes.map(d => ({ status: d.status || 'unknown' }))
        };
      });
      
      // Apply filters
      let filteredData = transformedData;
      
      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'pending') {
          filteredData = filteredData.filter(payout => 
            payout.payout_status === 'pending'
          );
        } else if (statusFilter === 'completed') {
          filteredData = filteredData.filter(payout => 
            payout.payout_status === 'completed'
          );
        }
      }
      
      if (networkFilter && networkFilter !== 'all') {
        filteredData = filteredData.filter(payout => payout.network === networkFilter);
      }
      
      console.log('Final filtered payout data:', filteredData);
      console.log('=== PAYOUTS DEBUG END ===');
      
      return filteredData;
    }
  });

  const processPayoutMutation = useMutation({
    mutationFn: async ({ paymentId, payoutTxHash }: { paymentId: string; payoutTxHash: string }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('payments')
        .update({
          payout_status: 'completed',
          payout_tx_hash: payoutTxHash,
          paid_out_at: new Date().toISOString(),
          paid_out_by: currentUser.user?.id
        })
        .eq('id', paymentId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Payout processed successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['creator-earnings'] });
      setPayoutHashes({});
    },
    onError: (error: any) => {
      toast.error('Failed to process payout: ' + error.message);
    }
  });

  const getPayoutAmount = (amount: number) => {
    return Number(amount) * 0.85; // Creator receives 85%
  };

  const getExplorerUrl = (network: string, txHash: string) => {
    const explorers = {
      ethereum: `https://etherscan.io/tx/${txHash}`,
      solana: `https://explorer.solana.com/tx/${txHash}`,
      bsc: `https://bscscan.com/tx/${txHash}`,
      sui: `https://explorer.sui.io/txblock/${txHash}`,
      cardano: `https://cardanoscan.io/transaction/${txHash}`
    };
    return explorers[network as keyof typeof explorers] || '#';
  };

  const getCreatorWalletAddress = (creator: PayoutData['creator'], network: string) => {
    switch (network) {
      case 'ethereum':
        return creator.payout_address_eth;
      case 'solana':
        return creator.payout_address_sol;
      case 'bsc':
        return creator.payout_address_bsc;
      case 'sui':
        return creator.payout_address_sui;
      case 'cardano':
        return creator.payout_address_cardano;
      default:
        return null;
    }
  };

  const isPayoutEligible = (payout: PayoutData) => {
    // Check if there are any open disputes
    const hasOpenDispute = payout.disputes.some(dispute => dispute.status === 'open');
    if (hasOpenDispute) return false;

    // Check if booking is delivered
    if (!payout.booking.delivered_at) return false;

    // Check if 48 hours have passed since delivery
    const deliveredAt = new Date(payout.booking.delivered_at);
    const hoursSinceDelivery = (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceDelivery >= 48;
  };

  const handlePayoutHashChange = (paymentId: string, value: string) => {
    setPayoutHashes(prev => ({
      ...prev,
      [paymentId]: value
    }));
  };

  const handleProcessPayout = (paymentId: string) => {
    const payoutTxHash = payoutHashes[paymentId]?.trim();
    if (!payoutTxHash) {
      toast.error('Please enter a transaction hash');
      return;
    }

    processPayoutMutation.mutate({ paymentId, payoutTxHash });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading payouts...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Creator Payouts
          </CardTitle>
          <CardDescription>
            Manage payouts to creators after service delivery. Only eligible payments (no active disputes, 48+ hours after delivery) can be processed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Debug Information */}
          {debugInfo && (
            <div className="mb-4 p-4 bg-gray-100 rounded-lg text-sm">
              <h4 className="font-semibold mb-2">Debug Information:</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>Total Payments: {debugInfo.totalPayments}</div>
                <div>Total Bookings: {debugInfo.totalBookings}</div>
                <div>Eligible for Payout: {debugInfo.eligiblePayments}</div>
                <div>Payment Types: {debugInfo.paymentTypes?.join(', ') || 'None'}</div>
                <div>Payment Statuses: {debugInfo.paymentStatuses?.join(', ') || 'None'}</div>
                <div>Booking Statuses: {debugInfo.bookingStatuses?.join(', ') || 'None'}</div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending Payout</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={networkFilter} onValueChange={setNetworkFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Networks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Networks</SelectItem>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="solana">Solana</SelectItem>
                <SelectItem value="bsc">BSC</SelectItem>
                <SelectItem value="sui">Sui</SelectItem>
                <SelectItem value="cardano">Cardano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creator</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Original Amount</TableHead>
                  <TableHead>Payout Amount</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Creator Wallet</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts?.map((payout) => {
                  const walletAddress = getCreatorWalletAddress(payout.creator, payout.network);
                  const isEligible = isPayoutEligible(payout);
                  const currentPayoutStatus = payout.payout_status || 'pending';
                  
                  return (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payout.creator?.handle || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{payout.creator?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payout.service?.title || 'Unknown Service'}</div>
                          <div className="text-sm text-muted-foreground">${payout.service?.price_usdc || payout.amount}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payout.payer?.handle || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{payout.payer?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">${payout.amount}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">${getPayoutAmount(payout.amount).toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">85% of original</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{payout.network}</Badge>
                      </TableCell>
                      <TableCell>
                        {walletAddress ? (
                          <div className="font-mono text-xs">
                            {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                          </div>
                        ) : (
                          <div className="text-sm text-red-500">No wallet configured</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              currentPayoutStatus === 'completed' ? 'default' : 
                              'secondary'
                            }
                          >
                            {currentPayoutStatus === 'completed' ? 'Paid Out' : 'Pending'}
                          </Badge>
                          {!isEligible && currentPayoutStatus === 'pending' && (
                            <div className="flex items-center gap-1 text-orange-600">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs">Waiting</span>
                            </div>
                          )}
                          {isEligible && currentPayoutStatus === 'pending' && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              <span className="text-xs">Ready</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{new Date(payout.created_at).toLocaleDateString()}</div>
                      </TableCell>
                      <TableCell>
                        {currentPayoutStatus === 'pending' && isEligible && walletAddress ? (
                          <div className="space-y-2">
                            <Input
                              placeholder="Transaction hash..."
                              value={payoutHashes[payout.id] || ''}
                              onChange={(e) => handlePayoutHashChange(payout.id, e.target.value)}
                              className="w-40"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleProcessPayout(payout.id)}
                              disabled={processPayoutMutation.isPending}
                            >
                              Process Payout
                            </Button>
                          </div>
                        ) : currentPayoutStatus === 'completed' ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="default">Completed</Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(getExplorerUrl(payout.network, payout.payout_tx_hash || payout.tx_hash), '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : !isEligible ? (
                          <div className="flex items-center gap-1 text-orange-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-xs">Not eligible</span>
                          </div>
                        ) : !walletAddress ? (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-xs">No wallet</span>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {(!payouts || payouts.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No payouts found matching your criteria.
              <div className="text-xs mt-2">
                Check the debug information above to see what data exists in the database.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
