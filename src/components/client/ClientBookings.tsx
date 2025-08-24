

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MessageSquare, DollarSign, User, Star, Hash, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';

interface BookingWithDetails {
  id: string;
  status: string;
  usdc_amount: number;
  tx_hash?: string;
  created_at: string;
  delivered_at?: string;
  accepted_at?: string;
  release_at?: string;
  creator_id: string;
  services: {
    title: string;
  } | null;
  creator_user: {
    handle: string;
    avatar_url?: string;
  } | null;
}

export const ClientBookings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reviewTexts, setReviewTexts] = useState<{[key: string]: string}>({});
  const [reviewRatings, setReviewRatings] = useState<{[key: string]: number}>({});

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['client-bookings', user?.id],
    queryFn: async (): Promise<BookingWithDetails[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (title),
          creator_user:users!bookings_creator_id_fkey (handle, avatar_url)
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

  const submitReview = useMutation({
    mutationFn: async ({ bookingId, rating, comment, creatorUserId }: { 
      bookingId: string; 
      rating: number; 
      comment: string;
      creatorUserId: string;
    }) => {
      const { error } = await supabase
        .from('reviews')
        .insert({
          booking_id: bookingId,
          reviewer_id: user?.id,
          reviewee_id: creatorUserId,
          rating,
          comment
        });

      if (error) throw error;
    },
    onSuccess: (_, { bookingId }) => {
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
      setReviewTexts(prev => ({ ...prev, [bookingId]: '' }));
      setReviewRatings(prev => ({ ...prev, [bookingId]: 0 }));
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
            <Button 
              size="sm"
              onClick={() => acceptBooking.mutate(booking.id)}
              disabled={acceptBooking.isPending}
              className="w-full"
            >
              Accept Delivery
            </Button>
            
            <div className="space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRatings(prev => ({ ...prev, [booking.id]: star }))}
                    className={`p-1 ${reviewRatings[booking.id] >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                  >
                    <Star className="h-4 w-4 fill-current" />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Leave a review..."
                value={reviewTexts[booking.id] || ''}
                onChange={(e) => setReviewTexts(prev => ({ ...prev, [booking.id]: e.target.value }))}
                rows={2}
                className="text-xs"
              />
              <Button 
                size="sm"
                onClick={() => submitReview.mutate({ 
                  bookingId: booking.id,
                  rating: reviewRatings[booking.id] || 5,
                  comment: reviewTexts[booking.id] || '',
                  creatorUserId: booking.creator_id
                })}
                disabled={submitReview.isPending || !reviewRatings[booking.id]}
                className="w-full"
              >
                Submit Review
              </Button>
            </div>
          </div>
        );
      case 'accepted':
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
                        Creator: @{booking.creator_user?.handle || 'Unknown'}
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
                          <Clock className="h-3 w-3" />
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
