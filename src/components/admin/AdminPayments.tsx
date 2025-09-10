
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ExternalLink, Search, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { AdminPayouts } from "./AdminPayouts";
import { AdminEscrow } from "./AdminEscrow";

export const AdminPayments = () => {
  const [selectedTab, setSelectedTab] = useState("payment-management");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [networkFilter, setNetworkFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [processingPayments, setProcessingPayments] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Fetch pricing tiers for dynamic tier assignment
  const { data: pricingTiers } = useQuery({
    queryKey: ['pricing-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_tiers')
        .select('*')
        .eq('active', true)
        .order('price_usdc', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  // Helper function to determine tier from payment amount (now async to always get fresh data)
  const getTierFromAmount = async (amount: number): Promise<string> => {
    console.log(`Getting tier for amount: $${amount}`);
    
    // Always fetch fresh pricing data from database to avoid race conditions
    const { data: currentPricingTiers, error } = await supabase
      .from('pricing_tiers')
      .select('*')
      .eq('active', true)
      .order('price_usdc', { ascending: true });

    if (error) {
      console.error('Error fetching pricing tiers:', error);
      return 'basic'; // Only fallback on database error
    }

    if (!currentPricingTiers) {
      console.error('No pricing tiers found in database');
      return 'basic';
    }

    console.log('Available pricing tiers:', currentPricingTiers.map(t => ({ tier: t.tier_name, price: t.price_usdc })));
    
    // Find the matching tier based on payment amount
    for (const tier of currentPricingTiers) {
      if (Math.abs(Number(tier.price_usdc) - amount) < 0.01) {
        console.log(`Found matching tier: ${tier.tier_name} for amount $${amount}`);
        return tier.tier_name;
      }
    }
    
    console.error(`No matching tier found for amount $${amount}. Available tiers:`, currentPricingTiers.map(t => `${t.tier_name}: $${t.price_usdc}`));
    return 'basic'; // Only return basic if truly no match found
  };

  const { data: payments, isLoading } = useQuery({
    queryKey: ['admin-payments', statusFilter, networkFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select(`
          *,
          payer:users!payments_user_id_fkey(handle, email),
          creator:users!payments_creator_id_fkey(handle, email),
          service:services!payments_service_id_fkey(title, price_usdc),
          booking:bookings!payments_booking_id_fkey(id, status)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (networkFilter && networkFilter !== 'all') {
        query = query.eq('network', networkFilter);
      }

      if (searchQuery) {
        query = query.or(`tx_hash.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data;
    }
  });

  const updatePaymentStatus = async (paymentId: string, status: string) => {
    // Add payment to processing set
    setProcessingPayments(prev => new Set(prev).add(paymentId));
    
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (paymentError) throw paymentError;

      // Update payment status
      const { error: updateError } = await supabase
        .from('payments')
        .update({ 
          status,
          verified_at: status === 'verified' ? new Date().toISOString() : null,
          verified_by: status === 'verified' ? currentUser.user?.id : null
        })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      // If this is a creator_tier payment being verified, create/approve creator record
      if (status === 'verified' && payment.payment_type === 'creator_tier') {
        // Check if creator record already exists
        const { data: existingCreator } = await supabase
          .from('creators')
          .select('*')
          .eq('user_id', payment.user_id)
          .single();

        const assignedTier = await getTierFromAmount(Number(payment.amount));
        console.log(`Assigning tier: ${assignedTier} for payment amount: $${payment.amount}`);

        if (!existingCreator) {
          // Create new creator record
          const { error: creatorError } = await supabase
            .from('creators')
            .insert({
              user_id: payment.user_id,
              tier: assignedTier,
              approved: true,
              approved_at: new Date().toISOString(),
              category: 'general'
            });

          if (creatorError) throw creatorError;
        } else {
          // Update existing creator to approved
          const { error: approveError } = await supabase
            .from('creators')
            .update({
              approved: true,
              approved_at: new Date().toISOString(),
              tier: assignedTier
            })
            .eq('user_id', payment.user_id);

          if (approveError) throw approveError;
        }

        // Update user role to creator ONLY if currently 'client' - preserve admin roles!
        const { data: currentUser, error: userFetchError } = await supabase
          .from('users')
          .select('role')
          .eq('id', payment.user_id)
          .single();

        if (userFetchError) throw userFetchError;

        // Only update role to 'creator' if user is currently 'client'
        // NEVER overwrite 'admin' role - admins can be creators too!
        if (currentUser?.role === 'client') {
          const { error: roleError } = await supabase
            .from('users')
            .update({ role: 'creator' })
            .eq('id', payment.user_id);

          if (roleError) throw roleError;
          
          console.log(`Updated user ${payment.user_id} role from 'client' to 'creator'`);
        } else {
          console.log(`Preserved existing role '${currentUser?.role}' for user ${payment.user_id} - not changing to creator`);
        }
      }

      toast.success(
        status === 'verified' 
          ? payment.payment_type === 'creator_tier'
            ? 'Payment verified! Creator approved and role updated.'
            : 'Payment verified! Booking status automatically updated to paid.'
          : `Payment ${status} successfully`
      );
      
      // Refresh all related data
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-creators'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-referrals-test'] });
    } catch (error: any) {
      toast.error('Failed to update payment status: ' + error.message);
    } finally {
      // Remove payment from processing set
      setProcessingPayments(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
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

  // Helper function to get service title display
  const getServiceTitle = (payment: any) => {
    if (payment.payment_type === 'creator_tier') {
      return 'Subscription';
    }
    return payment.service?.title || 'Unknown';
  };

  // Helper function to detect repayments (retry payments)
  const isRepayment = (payment: any, allPayments: any[]) => {
    if (!payment.booking_id) return false;
    
    return allPayments.some(p => 
      p.booking_id === payment.booking_id && 
      p.status === 'rejected' && 
      p.id !== payment.id &&
      new Date(p.created_at) < new Date(payment.created_at)
    );
  };

  // Helper function to calculate payout amount (creator's 85% share)
  const getPayoutAmount = (payment: any) => {
    // Only calculate payout for service payments, not creator tier subscriptions
    if (payment.payment_type === 'creator_tier') {
      return 0; // No payout for subscription payments
    }
    return Number(payment.amount) * 0.85; // Creator receives 85%
  };

  const PaymentManagementContent = () => {
    if (isLoading) {
      return (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading payments...</div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Management</CardTitle>
            <CardDescription>
              Review and verify payment transactions. Verified payments automatically update booking status to "paid".
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by transaction hash..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
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

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payout</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Booking Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments?.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {payment.tx_hash.slice(0, 8)}...{payment.tx_hash.slice(-8)}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(getExplorerUrl(payment.network, payment.tx_hash), '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.payer?.handle || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{payment.payer?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.creator?.handle || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{payment.creator?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{getServiceTitle(payment)}</div>
                        <div className="text-sm text-muted-foreground">${payment.service?.price_usdc || payment.amount}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">${payment.amount}</div>
                      <div className="text-sm text-muted-foreground">{payment.currency}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">${getPayoutAmount(payment).toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">Creator share</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.network}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            payment.status === 'verified' ? 'default' : 
                            payment.status === 'rejected' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {payment.status}
                        </Badge>
                        {payment.status === 'verified' && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {payment.booking?.status ? (
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              payment.booking.status === 'paid' ? 'default' : 
                              payment.booking.status === 'accepted' ? 'default' : 
                              'secondary'
                            }
                          >
                            {payment.booking.status}
                          </Badge>
                          {payment.status === 'verified' && payment.booking.status === 'paid' && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline">No Booking</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{new Date(payment.created_at).toLocaleDateString()}</div>
                        {payment.verified_at && (
                          <div className="text-xs text-muted-foreground">
                            Verified: {new Date(payment.verified_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {/* Show repayment indicator first if applicable */}
                        {isRepayment(payment, payments || []) && (
                          <Badge variant="outline" className="text-blue-600 border-blue-600 w-fit">
                            Repayment
                          </Badge>
                        )}
                        
                        {/* Existing action buttons for pending payments */}
                        {payment.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updatePaymentStatus(payment.id, 'verified')}
                              disabled={processingPayments.has(payment.id)}
                            >
                              {processingPayments.has(payment.id) && (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              )}
                              Verify
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={processingPayments.has(payment.id)}
                                >
                                  {processingPayments.has(payment.id) && (
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                  )}
                                  Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject Payment</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reject this payment? This action cannot be undone.
                                    <br /><br />
                                    <strong>Transaction:</strong> {payment.tx_hash.slice(0, 8)}...{payment.tx_hash.slice(-8)}
                                    <br />
                                    <strong>Amount:</strong> ${payment.amount} {payment.currency}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => updatePaymentStatus(payment.id, 'rejected')}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Reject Payment
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                        
                        {/* Status indicators for completed payments */}
                        {payment.status === 'verified' && payment.booking?.status === 'paid' && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs">Synced</span>
                          </div>
                        )}
                        {payment.status === 'rejected' && (
                          <div className="flex items-center gap-1 text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-xs">Rejected</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {(!payments || payments.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No payments found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const tabOptions = [
    { value: "payment-management", label: "Payment Management" },
    { value: "payouts", label: "Payouts" },
    { value: "escrow", label: "Escrow" },
    { value: "subscriptions", label: "Subscriptions" }
  ];

  return (
    <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
      {isMobile ? (
        <div className="px-4">
          <Select value={selectedTab} onValueChange={setSelectedTab}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a section" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              {tabOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="payment-management">Payment Management</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="escrow">Escrow</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>
      )}

      <TabsContent value="payment-management">
        <PaymentManagementContent />
      </TabsContent>

      <TabsContent value="payouts">
        <AdminPayouts />
      </TabsContent>

      <TabsContent value="escrow">
        <AdminEscrow />
      </TabsContent>

      <TabsContent value="subscriptions">
        <Card>
          <CardHeader>
            <CardTitle>Subscriptions</CardTitle>
            <CardDescription>Manage subscription settings and billing</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Subscription management functionality will be added here.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
