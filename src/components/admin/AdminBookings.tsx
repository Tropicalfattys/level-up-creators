
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, Search, Filter, DollarSign, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const AdminBookings = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [chainFilter, setChainFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-bookings', searchTerm, statusFilter, chainFilter],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          services (title, price_usdc),
          client:users!bookings_client_id_fkey (handle, email),
          creator:users!bookings_creator_id_fkey (handle, email)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (chainFilter !== 'all') {
        query = query.eq('chain', chainFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.filter(booking => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
          booking.client?.handle?.toLowerCase().includes(searchLower) ||
          booking.creator?.handle?.toLowerCase().includes(searchLower) ||
          booking.services?.title?.toLowerCase().includes(searchLower) ||
          booking.tx_hash?.toLowerCase().includes(searchLower)
        );
      }) || [];
    }
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ bookingId, status, adminNote }: { bookingId: string; status: string; adminNote?: string }) => {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status,
          ...(status === 'released' && { release_at: new Date().toISOString() })
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Log admin action
      await supabase.from('audit_logs').insert({
        action: `booking_status_changed_to_${status}`,
        target_table: 'bookings',
        target_id: bookingId,
        metadata: { adminNote, previousStatus: status }
      });
    },
    onSuccess: () => {
      toast.success('Booking status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
    onError: () => {
      toast.error('Failed to update booking status');
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { color: 'bg-gray-500', label: 'Draft' },
      'paid': { color: 'bg-blue-500', label: 'Paid' },
      'in_progress': { color: 'bg-yellow-500', label: 'In Progress' },
      'delivered': { color: 'bg-purple-500', label: 'Delivered' },
      'accepted': { color: 'bg-green-500', label: 'Accepted' },
      'disputed': { color: 'bg-red-500', label: 'Disputed' },
      'refunded': { color: 'bg-orange-500', label: 'Refunded' },
      'released': { color: 'bg-green-600', label: 'Released' },
      'canceled': { color: 'bg-gray-600', label: 'Canceled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getExplorerUrl = (chain: string, txHash: string) => {
    switch (chain?.toLowerCase()) {
      case 'ethereum':
        return `https://etherscan.io/tx/${txHash}`;
      case 'base':
        return `https://basescan.org/tx/${txHash}`;
      case 'solana':
        return `https://explorer.solana.com/tx/${txHash}`;
      default:
        return '#';
    }
  };

  const totalVolume = bookings?.reduce((sum, booking) => sum + Number(booking.usdc_amount || 0), 0) || 0;
  const disputedBookings = bookings?.filter(b => b.status === 'disputed').length || 0;

  if (isLoading) {
    return <div className="text-center py-8">Loading bookings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Total Volume</span>
            </div>
            <p className="text-2xl font-bold">${totalVolume.toFixed(2)} USDC</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Total Bookings</span>
            </div>
            <p className="text-2xl font-bold">{bookings?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Active Disputes</span>
            </div>
            <p className="text-2xl font-bold">{disputedBookings}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bookings Management</CardTitle>
          <CardDescription>
            Monitor all platform bookings and payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, service, or transaction hash..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="released">Released</SelectItem>
              </SelectContent>
            </Select>
            <Select value={chainFilter} onValueChange={setChainFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by chain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chains</SelectItem>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="base">Base</SelectItem>
                <SelectItem value="solana">Solana</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Chain</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings?.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.services?.title}</p>
                        <p className="text-xs text-muted-foreground">ID: {booking.id.slice(0, 8)}...</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">@{booking.client?.handle}</p>
                        <p className="text-xs text-muted-foreground">{booking.client?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">@{booking.creator?.handle}</p>
                        <p className="text-xs text-muted-foreground">{booking.creator?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">${booking.usdc_amount} USDC</p>
                        <p className="text-xs text-muted-foreground">
                          Platform: ${(Number(booking.usdc_amount) * 0.15).toFixed(2)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{booking.chain}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{format(new Date(booking.created_at), 'MMM d')}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(booking.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {booking.tx_hash && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(getExplorerUrl(booking.chain, booking.tx_hash), '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                        {booking.status === 'disputed' && (
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateBookingStatus.mutate({
                                bookingId: booking.id,
                                status: 'refunded'
                              })}
                            >
                              Refund
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateBookingStatus.mutate({
                                bookingId: booking.id,
                                status: 'released'
                              })}
                            >
                              Release
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
