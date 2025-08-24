
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MessageSquare, Upload, DollarSign, User, ExternalLink, Link, Star, ThumbsUp } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link as RouterLink } from 'react-router-dom';
import { ReviewSystem } from '@/components/reviews/ReviewSystem';

interface ClientBookingWithDetails {
  id: string;
  status: string;
  usdc_amount: number;
  created_at: string;
  delivered_at?: string;
  accepted_at?: string;
  release_at?: string;
  tx_hash?: string;
  chain?: string;
  proof_link?: string;
  proof_file_url?: string;
  creator_id: string;
  services: {
    title: string;
  } | null;
  creator: {
    handle: string;
    avatar_url?: string;
  } | null;
}

export const ClientBookings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showReviewFor, setShowReviewFor] = useState<string | null>(null);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['client-bookings', user?.id],
    queryFn: async (): Promise<ClientBookingWithDetails[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (title),
          creator:users!bookings_creator_id_fkey (handle, avatar_url)
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

  const acceptDelivery = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
      toast.success('Delivery accepted! You can now leave a review.');
    },
    onError: (error) => {
      console.error('Accept delivery error:', error);
      toast.error('Failed to accept delivery');
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'in_progress': return 'default';
      case 'delivered': return 'secondary';
      case 'accepted': return 'outline';
      case 'released': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusActions = (booking: ClientBookingWithDetails) => {
    switch (booking.status) {
      case 'paid':
        return (
          <div className="text-sm text-muted-foreground">
            Waiting for creator to start work
          </div>
        );
      case 'in_progress':
        return (
          <div className="text-sm text-muted-foreground">
            Work in progress
          </div>
        );
      case 'delivered':
        return (
          <div className="space-y-2">
            <Button 
              size="sm"
              onClick={() => acceptDelivery.mutate(booking.id)}
              disabled={acceptDelivery.isPending}
            >
              <ThumbsUp className="h-3 w-3 mr-1" />
              Accept Delivery
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowReviewFor(booking.id)}
            >
              <Star className="h-3 w-3 mr-1" />
              Leave Review
            </Button>
          </div>
        );
      case 'accepted':
      case 'released':
        return (
          <div className="space-y-2">
            <div className="text-sm text-green-600 font-medium">
              Completed
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowReviewFor(booking.id)}
            >
              <Star className="h-3 w-3 mr-1" />
              Review
            </Button>
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
          <TabsTrigger value="paid">Pending ({filterBookings('paid').length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({filterBookings('in_progress').length})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({filterBookings('delivered').length})</TabsTrigger>
          <TabsTrigger value="accepted">Completed ({filterBookings('accepted').length + filterBookings('released').length})</TabsTrigger>
        </TabsList>

        {['all', 'paid', 'in_progress', 'delivered', 'accepted'].map(status => (
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
                <CardContent>
                  <div className="space-y-3">
                    {/* Transaction Hash Display */}
                    {booking.tx_hash && (
                      <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                        <span className="font-medium">Your TX Hash:</span>
                        <code className="flex-1 text-xs">{booking.tx_hash}</code>
                        {booking.chain && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(getExplorerUrl(booking.chain!, booking.tx_hash!), '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Proof Display */}
                    {(booking.proof_link || booking.proof_file_url) && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Delivered Work:</span>
                        <div className="flex gap-2">
                          {booking.proof_link && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(booking.proof_link, '_blank')}
                            >
                              <Link className="h-3 w-3 mr-1" />
                              View Link
                            </Button>
                          )}
                          {booking.proof_file_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(booking.proof_file_url, '_blank')}
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              Download File
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
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
                      <div className="flex gap-2">
                        <RouterLink to={`/chat/${booking.id}`}>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Chat
                          </Button>
                        </RouterLink>
                        {getStatusActions(booking)}
                      </div>
                    </div>

                    {/* Review System */}
                    {showReviewFor === booking.id && (booking.status === 'delivered' || booking.status === 'accepted' || booking.status === 'released') && (
                      <div className="mt-4 pt-4 border-t">
                        <ReviewSystem 
                          bookingId={booking.id}
                          revieweeId={booking.creator_id}
                          canReview={true}
                        />
                      </div>
                    )}
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
