import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, ExternalLink, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { NETWORK_CONFIG } from '@/lib/contracts';
import { useAuth } from '@/hooks/useAuth';

interface PaymentUser {
  handle: string | null;
  email: string;
}

interface PaymentService {
  title: string;
}

interface PaymentBooking {
  id: string;
}

interface PaymentWithRelations {
  id: string;
  user_id: string;
  creator_id: string | null;
  service_id: string | null;
  booking_id: string | null;
  payment_type: 'service_booking' | 'creator_tier';
  network: string;
  amount: number;
  currency: string;
  tx_hash: string;
  status: 'pending' | 'verified' | 'rejected';
  admin_wallet_address: string;
  created_at: string;
  verified_by: string | null;
  verified_at: string | null;
  users: PaymentUser;
  creator?: PaymentUser;
  services?: PaymentService;
  bookings?: PaymentBooking;
}

export const AdminPayments = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [networkFilter, setNetworkFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['admin-payments', statusFilter, networkFilter, typeFilter, searchQuery],
    queryFn: async (): Promise<PaymentWithRelations[]> => {
      let query = supabase
        .from('payments')
        .select(`
          *,
          users!payments_user_id_fkey (handle, email),
          creator:users!payments_creator_id_fkey (handle, email),
          services (title),
          bookings (id)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (networkFilter !== 'all') {
        query = query.eq('network', networkFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('payment_type', typeFilter);
      }

      if (searchQuery) {
        query = query.or(`tx_hash.ilike.%${searchQuery}%,users.handle.ilike.%${searchQuery}%,users.email.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Filter and type-cast the results properly
      return (data || []).filter(payment => 
        payment.users && 
        typeof payment.users === 'object' && 
        !('error' in payment.users)
      ).map(payment => ({
        ...payment,
        payment_type: payment.payment_type as 'service_booking' | 'creator_tier',
        status: payment.status as 'pending' | 'verified' | 'rejected'
      }));
    }
  });

  const verifyPayment = useMutation({
    mutationFn: async ({ paymentId, status }: { paymentId: string; status: 'verified' | 'rejected' }) => {
      const { error } = await supabase
        .from('payments')
        .update({
          status,
          verified_by: user?.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) throw error;

      // If verifying a service booking, update the booking status
      const payment = payments.find(p => p.id === paymentId);
      if (payment && payment.payment_type === 'service_booking' && payment.booking_id && status === 'verified') {
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({ status: 'paid' })
          .eq('id', payment.booking_id);
        
        if (bookingError) throw bookingError;
      }
    },
    onSuccess: () => {
      toast.success('Payment status updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
    onError: (error: any) => {
      toast.error('Failed to update payment status: ' + error.message);
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'verified': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExplorerUrl = (network: string, txHash: string) => {
    const networkConfig = NETWORK_CONFIG[network as keyof typeof NETWORK_CONFIG];
    return `${networkConfig.explorerUrl}${txHash}`;
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Management</CardTitle>
          <CardDescription>
            Review and verify user payment submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Network</Label>
              <Select value={networkFilter} onValueChange={setNetworkFilter}>
                <SelectTrigger>
                  <SelectValue />
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

            <div>
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="service_booking">Service Booking</SelectItem>
                  <SelectItem value="creator_tier">Creator Tier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Search</Label>
              <Input
                placeholder="TX hash, user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Payments List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Loading payments...</div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payments found matching your filters
              </div>
            ) : (
              payments.map((payment) => (
                <Card key={payment.id} className="p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Payment Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {payment.payment_type === 'service_booking' ? 'Service' : 'Creator Tier'}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <span className="text-lg">
                            {NETWORK_CONFIG[payment.network as keyof typeof NETWORK_CONFIG]?.icon}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {NETWORK_CONFIG[payment.network as keyof typeof NETWORK_CONFIG]?.name}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">User:</span> {payment.users.handle || payment.users.email}
                        </p>
                        {payment.creator && (
                          <p className="text-sm">
                            <span className="font-medium">Creator:</span> {payment.creator.handle || payment.creator.email}
                          </p>
                        )}
                        {payment.services && (
                          <p className="text-sm">
                            <span className="font-medium">Service:</span> {payment.services.title}
                          </p>
                        )}
                        <p className="text-sm">
                          <span className="font-medium">Amount:</span> {formatAmount(payment.amount, payment.currency)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Submitted: {formatDate(payment.created_at)}
                        </p>
                        {payment.verified_at && (
                          <p className="text-sm text-muted-foreground">
                            Verified: {formatDate(payment.verified_at)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                          {payment.tx_hash}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(getExplorerUrl(payment.network, payment.tx_hash), '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col justify-center gap-2">
                      {payment.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => verifyPayment.mutate({ paymentId: payment.id, status: 'verified' })}
                            disabled={verifyPayment.isPending}
                            className="flex-1"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => verifyPayment.mutate({ paymentId: payment.id, status: 'rejected' })}
                            disabled={verifyPayment.isPending}
                            className="flex-1"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      {payment.status !== 'pending' && (
                        <div className="text-center text-sm text-muted-foreground">
                          {payment.status === 'verified' ? 'Payment verified' : 'Payment rejected'}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
