
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Search, ExternalLink, DollarSign } from 'lucide-react';

export const AdminBookings = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [chainFilter, setChainFilter] = useState('all');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (
            id,
            title,
            description
          ),
          client:client_id (
            id,
            handle,
            email
          ),
          creator_user:creator_id (
            id,
            handle,
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const filteredBookings = bookings?.filter(booking => {
    const matchesSearch = !searchTerm || 
      booking.client?.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.creator_user?.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.services?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.tx_hash?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesChain = chainFilter === 'all' || booking.chain === chainFilter;
    
    return matchesSearch && matchesStatus && matchesChain;
  });

  const statusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'in_progress': return 'secondary';
      case 'delivered': return 'secondary';
      case 'accepted': return 'default';
      case 'released': return 'default';
      case 'disputed': return 'destructive';
      case 'refunded': return 'destructive';
      case 'canceled': return 'outline';
      default: return 'outline';
    }
  };

  const getExplorerUrl = (txHash: string, chain: string) => {
    if (chain === 'evm') {
      return `https://etherscan.io/tx/${txHash}`;
    } else if (chain === 'sol') {
      return `https://explorer.solana.com/tx/${txHash}`;
    }
    return '#';
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading bookings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Booking Management
        </CardTitle>
        <CardDescription>
          Monitor payments, transactions, and booking lifecycle
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="released">Released</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={chainFilter} onValueChange={setChainFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Chain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Chains</SelectItem>
              <SelectItem value="evm">EVM</SelectItem>
              <SelectItem value="sol">Solana</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings?.map((booking) => (
            <div key={booking.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{booking.services?.title}</h3>
                    <Badge variant={statusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                    <Badge variant="outline">
                      {booking.chain.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span>Client: {booking.client?.handle}</span> • 
                    <span> Creator: {booking.creator_user?.handle}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1 text-lg font-bold">
                    <DollarSign className="h-4 w-4" />
                    {booking.usdc_amount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Platform: ${booking.platform_fee} • Creator: ${booking.creator_payout}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="space-y-1">
                  <div>Booking ID: <span className="font-mono text-xs">{booking.id}</span></div>
                  {booking.tx_hash && (
                    <div className="flex items-center gap-2">
                      <span>TX Hash:</span>
                      <span className="font-mono text-xs">{booking.tx_hash.slice(0, 20)}...</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(getExplorerUrl(booking.tx_hash!, booking.chain), '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <div>Created: {new Date(booking.created_at).toLocaleString()}</div>
                  {booking.release_at && (
                    <div>Release: {new Date(booking.release_at).toLocaleString()}</div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                  <Button size="sm" variant="outline">
                    View Chat
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {(!filteredBookings || filteredBookings.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No bookings found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
