
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
  const queryClient = useQueryClient();

  const { data: payouts, isLoading } = useQuery({
    queryKey: ['admin-payouts', statusFilter, networkFilter],
    queryFn: async (): Promise<PayoutData[]> => {
      console.log('Fetching payouts with filters:', { statusFilter, networkFilter });
      
      // First check what's in bookings table - this is likely where the payment data is
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          client:users!bookings_client_id_fkey(handle, email),
          creator:users!bookings_creator_id_fkey(handle, email),
          service:services!bookings_service_id_fkey(title, price_usdc, payment_method),
          disputes(status)
        `)
        .not('creator_id', 'is', null)
        .not('tx_hash', 'is', null) // Only bookings with actual payments
        .in('status', ['paid', 'delivered', 'accepted', 'released'])
        .order('created_at', { ascending: false });
      
      console.log('Bookings with payments:', bookingsData);
      console.log('Bookings error:', bookingsError);
      
      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        throw bookingsError;
      }
      
      // Transform bookings data to match PayoutData interface
      const transformedData: PayoutData[] = (bookingsData || []).map(booking => ({
        id: booking.id,
        user_id: booking.client_id,
        creator_id: booking.creator_id,
        service_id: booking.service_id,
        booking_id: booking.id,
        amount: Number(booking.usdc_amount),
        network: booking.chain || 'ethereum',
        tx_hash: booking.tx_hash,
        payout_tx_hash: null, // This would be added when payout is processed
        payout_status: 'pending', // Default for existing bookings
        created_at: booking.created_at,
        paid_out_at: null,
        paid_out_by: null,
        payer: {
          handle: booking.client?.handle || 'Unknown',
          email: booking.client?.email || 'Unknown'
        },
        creator: {
          handle: booking.creator?.handle || 'Unknown',
          email: booking.creator?.email || 'Unknown',
          payout_address_eth: booking.creator?.payout_address_eth,
          payout_address_sol: booking.creator?.payout_address_sol,
          payout_address_bsc: booking.creator?.payout_address_bsc,
          payout_address_sui: booking.creator?.payout_address_sui,
          payout_address_cardano: booking.creator?.payout_address_cardano
        },
        service: {
          title: booking.service?.title || 'Unknown Service',
          price_usdc: Number(booking.service?.price_usdc || booking.usdc_amount),
          payment_method: booking.service?.payment_method || 'ethereum_usdc'
        },
        booking: {
          status: booking.status,
          delivered_at: booking.delivered_at
        },
        disputes: booking.disputes || []
      }));
      
      // Apply filters
      let filteredData = transformedData;
      
      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'pending') {
          // Show bookings that are delivered or accepted but not yet paid out
          filteredData = filteredData.filter(payout => 
            ['delivered', 'accepted'].includes(payout.booking.status)
          );
        } else if (statusFilter === 'completed') {
          // Show bookings that have been released (paid out)
          filteredData = filteredData.filter(payout => 
            payout.booking.status === 'released'
          );
        }
      }
      
      if (networkFilter && networkFilter !== 'all') {
        filteredData = filteredData.filter(payout => payout.network === networkFilter);
      }
      
      console.log('Final filtered payout data:', filteredData);
      console.log('Number of payouts found:', filteredData.length);
      
      return filteredData;
    }
  });

  const processPayoutMutation = useMutation({
    mutationFn: async ({ paymentId, payoutTxHash }: { paymentId: string; payoutTxHash: string }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      
      // Update the booking status to released
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'released'
        })
        .eq('id', paymentId);

      if (error) throw error;
      
      // TODO: In a real implementation, you might want to store payout transaction details 
      // in a separate payouts table for better tracking
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

    // Check if 48 hours have passed since delivery
    if (payout.booking.delivered_at) {
      const deliveredAt = new Date(payout.booking.delivered_at);
      const hoursSinceDelivery = (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60);
      return hoursSinceDelivery >= 48;
    }

    // If not delivered yet, not eligible for payout
    return false;
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
                  <TableHead>Received Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts?.map((payout) => {
                  const walletAddress = getCreatorWalletAddress(payout.creator, payout.network);
                  const isEligible = isPayoutEligible(payout);
                  const currentPayoutStatus = payout.booking.status === 'released' ? 'completed' : 'pending';
                  
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
                              onClick={() => window.open(getExplorerUrl(payout.network, payout.tx_hash), '_blank')}
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
                Debug: Showing paid bookings from bookings table that need payouts
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
