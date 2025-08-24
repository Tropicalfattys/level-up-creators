
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Clock, MessageSquare, Star, DollarSign, User, Hash, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface BookingWithDetails {
  id: string;
  status: string;
  usdc_amount: number;
  tx_hash?: string;
  created_at: string;
  delivered_at?: string;
  accepted_at?: string;
  release_at?: string;
  proof_data?: any;
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
  const [reviewRatings, setReviewRatings] = useState<{[key: string]: number}>({});
  const [reviewComments, setReviewComments] = useState<{[key: string]: string}>({});

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['client-bookings', user?.id],
    queryFn: async (): Promise<BookingWithDetails[]> => {
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
        console.error('Error fetching bookings:', error);
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
          accepted_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
      toast.success('Delivery accepted!');
    },
    onError: (error) => {
      console.error('Accept delivery error:', error);
      toast.error('Failed to accept delivery');
    }
  });

  const submitReview = useMutation({
    mutationFn: async ({ bookingId, rating, comment }: { 
      bookingId: string; 
      rating: number; 
      comment: string; 
    }) => {
      const booking = bookings?.find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');

      const { error } = await supabase
        .from('reviews')
        .insert({
          booking_id: bookingId,
          reviewer_id: user?.id,
          reviewee_id: booking.creator_id,
          rating,
          comment
        });

      if (error) throw error;
    },
    onSuccess: (_, { bookingId }) => {
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
      setReviewRatings(prev => ({ ...prev, [bookingId]: 0 }));
      setReviewComments(prev => ({ ...prev, [bookingId]: '' }));
      toast.success('Review submitted successfully!');
    },
    onError: (error) => {
      console.error('Submit review error:', error);
      toast.error('Failed to submit review');
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

  const getStatusActions = (booking: BookingWithDetails) => {
    switch (booking.status) {
      case 'delivered':
        return (
          <div className="space-y-3">
            {booking.proof_data && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Delivery Proof:</h4>
                {booking.proof_data.note && (
                  <p className="text-sm mb-2">{booking.proof_data.note}</p>
                )}
                {booking.proof_data.link && (
                  <a
                    href={booking.proof_data.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Work
                  </a>
                )}
                {booking.proof_data.files && (
                  <div className="space-y-1">
                    {booking.proof_data.files.map((file: string, index: number) => (
                      <a
                        key={index}
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm block"
                      >
                        Download File {index + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
            <Button 
              size="sm"
              onClick={() => acceptDelivery.mutate(booking.id)}
              disabled={acceptDelivery.isPending}
            >
              Accept Delivery
            </Button>
          </div>
        );
      case 'accepted':
        return (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">Delivery accepted! Leave a review below.</p>
            </div>
            <div className="space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRatings(prev => ({ ...prev, [booking.id]: star }))}
                    className={`p-1 ${
                      (reviewRatings[booking.id] || 0) >= star
                        ? 'text-yellow-500'
                        : 'text-gray-300'
                    }`}
                  >
                    <Star className="h-4 w-4 fill-current" />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Leave a review..."
                value={reviewComments[booking.id] || ''}
                onChange={(e) => setReviewComments(prev => ({ ...prev, [booking.id]: e.target.value }))}
                rows={3}
              />
              <Button
                size="sm"
                onClick={() => submitReview.mutate({
                  bookingId: booking.id,
                  rating: reviewRatings[booking.id] || 5,
                  comment: reviewComments[booking.id] || ''
                })}
                disabled={submitReview.isPending || !reviewRatings[booking.id]}
              >
                Submit Review
              </Button>
            </div>
          </div>
        );
      case 'released':
        return (
          <div className="text-sm text-green-600 font-medium">
            Completed
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
    return <div className="text-center py-8">Loading bookings...</div>;
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
          <TabsTrigger value="paid">Active ({filterBookings('paid').length + filterBookings('in_progress').length})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({filterBookings('delivered').length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({filterBookings('accepted').length + filterBookings('released').length})</TabsTrigger>
        </TabsList>

        {['all', 'paid', 'delivered', 'completed'].map(status => (
          <TabsContent key={status} value={status} className="space-y-4">
            {filterBookings(status === 'paid' ? 'all' : status === 'completed' ? 'all' : status)
              .filter(booking => {
                if (status === 'paid') return ['paid', 'in_progress'].includes(booking.status);
                if (status === 'completed') return ['accepted', 'released'].includes(booking.status);
                return status === 'all' || booking.status === status;
              })
              .map((booking) => (
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
                          TX: {booking.tx_hash.slice(0, 20)}...
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => navigator.clipboard.writeText(booking.tx_hash || '')}
                          >
                            <ExternalLink className="h-3 w-3" />
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
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Booked {format(new Date(booking.created_at), 'MMM d, yyyy')}
                      </div>
                      {booking.delivered_at && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Delivered {format(new Date(booking.delivered_at), 'MMM d')}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Link to={`/chat/${booking.id}`}>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Chat
                        </Button>
                      </Link>
                    </div>
                    
                    {getStatusActions(booking)}
                  </div>
                </CardContent>
              </Card>
            ))}

            {filterBookings(status === 'paid' ? 'all' : status === 'completed' ? 'all' : status)
              .filter(booking => {
                if (status === 'paid') return ['paid', 'in_progress'].includes(booking.status);
                if (status === 'completed') return ['accepted', 'released'].includes(booking.status);
                return status === 'all' || booking.status === status;
              }).length === 0 && (
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
