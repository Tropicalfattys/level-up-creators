
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Search } from 'lucide-react';
import { toast } from 'sonner';

export const AdminPayments = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [networkFilter, setNetworkFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['admin-payments', statusFilter, networkFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select(`
          *,
          payer:users!payments_user_id_fkey(handle, email),
          creator:users!payments_creator_id_fkey(handle, email),
          service:services!payments_service_id_fkey(title, price_usdc)
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
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status,
          verified_at: status === 'verified' ? new Date().toISOString() : null,
          verified_by: status === 'verified' ? (await supabase.auth.getUser()).data.user?.id : null
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast.success(`Payment ${status} successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
    } catch (error: any) {
      toast.error('Failed to update payment status: ' + error.message);
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
            Review and verify payment transactions
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
                <TableHead>Network</TableHead>
                <TableHead>Status</TableHead>
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
                      <div className="font-medium">{payment.service?.title || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">${payment.service?.price_usdc || payment.amount}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">${payment.amount}</div>
                    <div className="text-sm text-muted-foreground">{payment.currency}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{payment.network}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        payment.status === 'verified' ? 'default' : 
                        payment.status === 'rejected' ? 'destructive' : 
                        'secondary'
                      }
                    >
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(payment.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {payment.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updatePaymentStatus(payment.id, 'verified')}
                        >
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updatePaymentStatus(payment.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
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
