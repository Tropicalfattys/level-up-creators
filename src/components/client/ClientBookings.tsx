
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MessageSquare, DollarSign, User, ExternalLink, Upload, Hash, Copy, CheckCircle, AlertTriangle, Star } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { BookingChat } from '@/components/messaging/BookingChat';
import { ReviewSystem } from '@/components/reviews/ReviewSystem';

interface ClientBookingWithDetails {
  id: string;
  status: string;
  usdc_amount: number;
  created_at: string;
  delivered_at?: string;
  accepted_at?: string;
  tx_hash?: string;
  proof_link?: string;
  proof_file_url?: string;
  services: {
    title: string;
  } | null;
  creator: {
    id: string;
    handle: string;
    avatar_url?: string;
  } | null;
}

export const ClientBookings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['client-bookings', user?.id],
    queryFn: async (): Promise<ClientBookingWithDetails[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (title),
          creator:users!bookings_creator_id_fkey (id, handle, avatar_url)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching client bookings:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id
  });

  const acceptBooking = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
      toast.success('Booking accepted successfully!');
    },
    onError: (error) => {
      console.error('Accept booking error:', error);
      toast.error('Failed to accept booking');
    }
  });

  const createDispute = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason: string }) => {
      const { error } = await supabase
        .from('disputes')
        .insert({
          booking_id: bookingId,
          opened_by: 'client',
          reason: reason || 'Delivery does not meet requirements',
          status: 'open'
        });

      if (error) throw error;

      // Update booking status to disputed
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'disputed' })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
      toast.success('Dispute created successfully');
    },
    onError: (error) => {
      console.error('Create dispute error:', error);
      toast.error('Failed to create dispute');
    }
  });

  const copyTxHash = (txHash: string) => {
    navigator.clipboard.writeText(txHash);
    toast.success('Transaction hash copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'in_progress': return 'default';
      case 'delivered': return 'secondary';
      case 'accepted': return 'outline';
      case 'released': return 'outline';
      case 'disputed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusActions = (booking: ClientBookingWithDetails) => {
    switch (booking.status) {
      case 'delivered':
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => acceptBooking.mutate(booking.id)}
              disabled={acceptBooking.isPending}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => createDispute.mutate({ 
                bookingId: booking.id, 
                reason: 'Delivery does not meet requirements' 
              })}
              disabled={createDispute.isPending}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Dispute
            </Button>
          </div>
        );
      case 'accepted':
      case 'released':
        return (
          <div className="text-sm text-green-600 font-medium">
            Completed
          </div>
        );
      case 'disputed':
        return (
          <div className="text-sm text-orange-600 font-medium">
            Under Review
          </div>
        );
      default:
        return null;
    }
  };

  const filterBookings = (status: string) => {
    if (!bookings) return [];
    if (status === 'all') return bookings;
    return bookings.filter(booking => booking.status === status);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading your bookings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">My Bookings</h3>
        <p className="text-muted-foreground">
          Track your booked services and communicate with creators
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({bookings?.length || 0})</TabsTrigger>
          <TabsTrigger value="paid">Paid ({filterBookings('paid').length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({filterBookings('in_progress').length})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({filterBookings('delivered').length})</TabsTrigger>
        </TabsList>

        {['all', 'paid', 'in_progress', 'delivered'].map(status => (
          <TabsContent key={status} value={status} className="space-y-4">
            {filterBookings(status).map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{booking.services?.title || 'Service'}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <User className="h-3 w-3" />
                        Creator: @{booking.creator?.handle || 'Unknown'}
                      </CardDescription>
                      {booking.tx_hash && (
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Hash className="h-3 w-3" />
                          <span className="font-mono text-xs">
                            TX: {booking.tx_hash.slice(0, 8)}...{booking.tx_hash.slice(-6)}
                          </span>
                          <Button
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyTxHash(booking.tx_hash!)}
                            className="h-4 w-4 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </CardDescription>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusColor(booking.status)}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                      <p className="font-semibold mt-1">
                        <DollarSign className="h-3 w-3 inline mr-1" />
                        {booking.usdc_amount} USDC
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Display proof if delivered */}
                  {booking.status === 'delivered' && (booking.proof_link || booking.proof_file_url) && (
                    <div className="p-3 bg-muted rounded">
                      <p className="text-sm font-medium mb-2">Proof of Completion:</p>
                      {booking.proof_link && (
                        <div className="flex items-center gap-2 mb-1">
                          <ExternalLink className="h-3 w-3" />
                          <a href={booking.proof_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                            View Link
                          </a>
                        </div>
                      )}
                      {booking.proof_file_url && (
                        <div className="flex items-center gap-2">
                          <Upload className="h-3 w-3" />
                          <a href={booking.proof_file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                            Download File
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Chat Component */}
                  {booking.creator && (
                    <div>
                      <BookingChat
                        bookingId={booking.id}
                        otherUserId={booking.creator.id}
                        otherUserHandle={booking.creator.handle}
                      />
                    </div>
                  )}

                  {/* Review System for accepted/completed bookings */}
                  {(booking.status === 'accepted' || booking.status === 'released') && booking.creator?.id && (
                    <div>
                      <ReviewSystem 
                        bookingId={booking.id}
                        revieweeId={booking.creator.id}
                        canReview={true}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Booked {format(new Date(booking.created_at), 'MMM d, yyyy')}
                      </div>
                      {booking.delivered_at && (
                        <div className="flex items-center gap-1">
                          <Upload className="h-3 w-3" />
                          Delivered {format(new Date(booking.delivered_at), 'MMM d')}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 items-center">
                      <Link to={`/chat/${booking.id}`}>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Full Chat
                        </Button>
                      </Link>
                      {getStatusActions(booking)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filterBookings(status).length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No bookings in this category yet
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
