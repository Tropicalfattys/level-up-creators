
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageCircle, ShoppingCart, Search, ExternalLink, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export const AdminBookings = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const queryClient = useQueryClient();

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
            description,
            price_usdc
          ),
          client:client_id (
            id,
            handle,
            email
          ),
          creator:creator_id (
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

  const { data: messages } = useQuery({
    queryKey: ['booking-messages', selectedBooking?.id],
    queryFn: async () => {
      if (!selectedBooking?.id) return [];
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          from_user:from_user_id (handle),
          to_user:to_user_id (handle)
        `)
        .eq('booking_id', selectedBooking.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBooking?.id
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast.success('Booking status updated');
    },
    onError: () => {
      toast.error('Failed to update booking status');
    }
  });

  const filteredBookings = bookings?.filter(booking => {
    const matchesSearch = !searchTerm || 
      booking.client?.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.creator?.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.services?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'outline';
      case 'paid': return 'default';
      case 'in_progress': return 'secondary';
      case 'delivered': return 'default';
      case 'accepted': return 'default';
      case 'disputed': return 'destructive';
      case 'refunded': return 'destructive';
      case 'released': return 'default';
      case 'canceled': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <DollarSign className="h-3 w-3 mr-1" />;
      case 'in_progress': return <Clock className="h-3 w-3 mr-1" />;
      case 'delivered': return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'accepted': return <CheckCircle className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading bookings...</div>;
  }

  return (
    <div className="space-y-6">
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="released">Released</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bookings List */}
          <div className="space-y-4">
            {filteredBookings?.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{booking.services?.title || 'Unknown Service'}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.client?.handle} → {booking.creator?.handle}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {booking.usdc_amount && (
                        <span className="text-sm font-medium text-green-600">
                          ${Number(booking.usdc_amount).toFixed(2)} USDC
                        </span>
                      )}
                      {booking.platform_fee && (
                        <span className="text-xs text-muted-foreground">
                          (${Number(booking.platform_fee).toFixed(2)} fee)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(booking.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(booking.status)}>
                    {getStatusIcon(booking.status)}
                    {booking.status}
                  </Badge>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Booking Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Service & Payment</h4>
                            <div className="space-y-2 text-sm">
                              <p><strong>Service:</strong> {booking.services?.title}</p>
                              <p><strong>Description:</strong> {booking.services?.description}</p>
                              <p><strong>Amount:</strong> ${Number(booking.usdc_amount || 0).toFixed(2)} USDC</p>
                              <p><strong>Platform Fee:</strong> ${Number(booking.platform_fee || 0).toFixed(2)}</p>
                              <p><strong>Creator Amount:</strong> ${Number(booking.creator_amount || 0).toFixed(2)}</p>
                              {booking.tx_hash && (
                                <p><strong>TX Hash:</strong> 
                                  <a 
                                    href={`https://etherscan.io/tx/${booking.tx_hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline ml-1"
                                  >
                                    {booking.tx_hash.slice(0, 10)}... <ExternalLink className="h-3 w-3 inline" />
                                  </a>
                                </p>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Parties & Timeline</h4>
                            <div className="space-y-2 text-sm">
                              <p><strong>Client:</strong> {booking.client?.handle} ({booking.client?.email})</p>
                              <p><strong>Creator:</strong> {booking.creator?.handle} ({booking.creator?.email})</p>
                              <p><strong>Created:</strong> {new Date(booking.created_at).toLocaleString()}</p>
                              {booking.delivered_at && (
                                <p><strong>Delivered:</strong> {new Date(booking.delivered_at).toLocaleString()}</p>
                              )}
                              {booking.accepted_at && (
                                <p><strong>Accepted:</strong> {new Date(booking.accepted_at).toLocaleString()}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {booking.deliverable_url && (
                          <div>
                            <h4 className="font-medium mb-2">Deliverable</h4>
                            <a 
                              href={booking.deliverable_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              View Deliverable <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}

                        <div>
                          <h4 className="font-medium mb-2">Messages ({messages?.length || 0})</h4>
                          <div className="max-h-40 overflow-y-auto space-y-2">
                            {messages?.map((message) => (
                              <div key={message.id} className="p-2 bg-muted rounded text-sm">
                                <p><strong>{message.from_user?.handle}:</strong> {message.body}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(message.created_at).toLocaleString()}
                                </p>
                              </div>
                            ))}
                            {(!messages || messages.length === 0) && (
                              <p className="text-sm text-muted-foreground">No messages yet</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Admin Actions</h4>
                          <div className="flex gap-2">
                            <Select
                              value={booking.status}
                              onValueChange={(status) => updateBookingStatus.mutate({ 
                                bookingId: booking.id, 
                                status 
                              })}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="disputed">Disputed</SelectItem>
                                <SelectItem value="refunded">Refunded</SelectItem>
                                <SelectItem value="released">Released</SelectItem>
                                <SelectItem value="canceled">Canceled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
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
    </div>
  );
};
