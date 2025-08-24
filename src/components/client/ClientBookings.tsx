
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MessageSquare, DollarSign, User, ExternalLink, Upload, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
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
                          TX: {booking.tx_hash.slice(0, 10)}...{booking.tx_hash.slice(-6)}
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
                  {/* Display proof if delivered */}
                  {booking.status === 'delivered' && (booking.proof_link || booking.proof_file_url) && (
                    <div className="mb-4 p-3 bg-muted rounded">
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

                  {/* Review System for delivered bookings */}
                  {booking.status === 'delivered' && booking.creator?.id && (
                    <div className="mb-4">
                      <ReviewSystem 
                        bookingId={booking.id}
                        revieweeId={booking.creator.id}
                        canReview={true}
                      />
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
                      <Link to={`/chat/${booking.id}`}>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Chat
                        </Button>
                      </Link>
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
