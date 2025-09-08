
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
import { useIsMobile } from '@/hooks/use-mobile';

export const AdminBookings = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [chainFilter, setChainFilter] = useState('all');
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

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
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status,
          ...(status === 'released' && { release_at: new Date().toISOString() })
        })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Booking status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
    onError: () => {
      toast.error('Failed to update booking status');
    }
  });

  const getStatusBadge = (status: string, workStarted?: boolean) => {
    const statusConfig = {
      'draft': { color: 'bg-gray-500', label: 'Draft' },
      'pending': { color: 'bg-yellow-500', label: 'Pending' },
      'paid': { 
        color: workStarted ? 'bg-blue-600' : 'bg-blue-500', 
        label: workStarted ? 'Work Started' : 'Paid' 
      },
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
      case 'solana':
        return `https://explorer.solana.com/tx/${txHash}`;
      case 'bsc':
        return `https://bscscan.com/tx/${txHash}`;
      case 'sui':
        return `https://explorer.sui.io/txblock/${txHash}`;
      case 'cardano':
        return `https://cardanoscan.io/transaction/${txHash}`;
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
          <div className={`mb-6 ${isMobile ? 'space-y-4' : 'flex gap-4'}`}>
            <div className={isMobile ? 'w-full' : 'flex-1'}>
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
              <SelectTrigger className={isMobile ? 'w-full' : 'w-[180px]'}>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="released">Released</SelectItem>
              </SelectContent>
            </Select>
            <Select value={chainFilter} onValueChange={setChainFilter}>
              <SelectTrigger className={isMobile ? 'w-full' : 'w-[150px]'}>
                <SelectValue placeholder="Filter by chain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chains</SelectItem>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="solana">Solana</SelectItem>
                <SelectItem value="bsc">BSC</SelectItem>
                <SelectItem value="sui">Sui</SelectItem>
                <SelectItem value="cardano">Cardano</SelectItem>
              </SelectContent>
            </Select>
          </div>

{isMobile ? (
            <div className="space-y-4">
              {bookings?.map((booking) => (
                <Card key={booking.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-sm">{booking.services?.title}</h3>
                        <p className="text-xs text-muted-foreground">ID: {booking.id.slice(0, 8)}...</p>
                      </div>
                      {getStatusBadge(booking.status, !!booking.work_started_at)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Client</p>
                        <p className="font-medium">@{booking.client?.handle}</p>
                        <p className="text-xs text-muted-foreground truncate">{booking.client?.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Creator</p>
                        <p className="font-medium">@{booking.creator?.handle}</p>
                        <p className="text-xs text-muted-foreground truncate">{booking.creator?.email}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="font-medium">${booking.usdc_amount} USDC</p>
                        <p className="text-xs text-muted-foreground">
                          Platform: ${(Number(booking.usdc_amount) * 0.15).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Chain & Date</p>
                        <Badge variant="outline" className="capitalize text-xs">{booking.chain}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(booking.created_at), 'MMM d, HH:mm')}
                        </p>
                      </div>
                    </div>

                    {booking.tx_hash && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Transaction</p>
                        <a 
                          href={getExplorerUrl(booking.chain, booking.tx_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View on Explorer
                        </a>
                      </div>
                    )}
                    
                    {/* Deliverables */}
                    {(booking.status === 'delivered' || booking.status === 'accepted' || booking.status === 'released') && 
                     ((booking.proof_links as any)?.length || booking.proof_link || booking.proof_file_url) && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Deliverables</p>
                        <div className="space-y-1">
                          {(booking.proof_links as any)?.map((link: any, index: number) => (
                            <div key={index} className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3 text-blue-600" />
                              <a 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-blue-600 hover:underline text-xs truncate"
                                title={link.label}
                              >
                                {link.label}
                              </a>
                            </div>
                          ))}
                          
                          {booking.proof_link && !(booking.proof_links as any)?.length && (
                            <div className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3 text-blue-600" />
                              <a 
                                href={booking.proof_link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-blue-600 hover:underline text-xs"
                              >
                                Social Proof
                              </a>
                            </div>
                          )}
                          
                          {booking.proof_file_url && (
                            <>
                              {booking.proof_file_url.split(',').map((fileUrl: string, index: number) => (
                                <div key={index} className="flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3 text-blue-600" />
                                  <a 
                                    href={fileUrl.trim()} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-blue-600 hover:underline text-xs"
                                  >
                                    File {booking.proof_file_url.split(',').length > 1 ? `${index + 1}` : ''}
                                  </a>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Admin actions */}
                    {booking.status === 'disputed' && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
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
                          className="flex-1"
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
                </Card>
              ))}
            </div>
          ) : (
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
                    <TableHead>Deliverables</TableHead>
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
                      <TableCell>{getStatusBadge(booking.status, !!booking.work_started_at)}</TableCell>
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
                        <div className="space-y-2">
                          {/* Show deliverables for completed bookings */}
                          {(booking.status === 'delivered' || booking.status === 'accepted' || booking.status === 'released') && 
                           ((booking.proof_links as any)?.length || booking.proof_link || booking.proof_file_url) && (
                            <div className="space-y-1">
                              {(booking.proof_links as any)?.map((link: any, index: number) => (
                                <div key={index} className="flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3 text-blue-600" />
                                  <a 
                                    href={link.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-blue-600 hover:underline text-xs truncate max-w-[120px]"
                                    title={link.label}
                                  >
                                    {link.label}
                                  </a>
                                </div>
                              ))}
                              
                              {booking.proof_link && !(booking.proof_links as any)?.length && (
                                <div className="flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3 text-blue-600" />
                                  <a 
                                    href={booking.proof_link} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-blue-600 hover:underline text-xs"
                                  >
                                    Social Proof
                                  </a>
                                </div>
                              )}
                              
                              {booking.proof_file_url && (
                                <>
                                  {booking.proof_file_url.split(',').map((fileUrl: string, index: number) => (
                                    <div key={index} className="flex items-center gap-1">
                                      <ExternalLink className="h-3 w-3 text-blue-600" />
                                      <a 
                                        href={fileUrl.trim()} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-600 hover:underline text-xs"
                                      >
                                        File {booking.proof_file_url.split(',').length > 1 ? `${index + 1}` : ''}
                                      </a>
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          )}
                          
                          {/* Admin actions */}
                          <div className="flex gap-1">
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
