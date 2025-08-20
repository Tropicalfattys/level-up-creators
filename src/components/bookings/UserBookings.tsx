
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Package, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { EscrowManager } from '@/components/escrow/EscrowManager';

export const UserBookings = () => {
  const { user } = useAuth();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['user-bookings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (
            title,
            description,
            category
          ),
          creators!bookings_creator_id_fkey (
            id,
            users!creators_user_id_fkey (
              handle,
              avatar_url
            )
          )
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user bookings:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { color: 'bg-gray-500', label: 'Draft' },
      'paid': { color: 'bg-blue-500', label: 'Paid - In Progress' },
      'in_progress': { color: 'bg-yellow-500', label: 'In Progress' },
      'delivered': { color: 'bg-purple-500', label: 'Delivered - Review Required' },
      'accepted': { color: 'bg-green-500', label: 'Accepted' },
      'disputed': { color: 'bg-red-500', label: 'Disputed' },
      'refunded': { color: 'bg-orange-500', label: 'Refunded' },
      'released': { color: 'bg-green-600', label: 'Completed' },
      'canceled': { color: 'bg-gray-400', label: 'Canceled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-500', label: status };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading your bookings...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Bookings</CardTitle>
          <CardDescription>Track your service bookings and communicate with creators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by browsing our services and booking your first service.
            </p>
            <Button asChild>
              <Link to="/browse">Browse Services</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Bookings</h2>
        <Button variant="outline" asChild>
          <Link to="/browse">Book New Service</Link>
        </Button>
      </div>

      <div className="grid gap-6">
        {bookings.map((booking) => (
          <Card key={booking.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{booking.services?.title}</CardTitle>
                  <CardDescription className="mt-1">
                    with @{booking.creators?.users?.handle} • 
                    Booked {format(new Date(booking.created_at), 'MMM d, yyyy')}
                  </CardDescription>
                </div>
                {getStatusBadge(booking.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.services?.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {booking.services.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="font-medium">${booking.usdc_amount} USDC</span>
                  {booking.services?.category && (
                    <Badge variant="outline">{booking.services.category}</Badge>
                  )}
                </div>
                {booking.delivered_at && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Delivered {format(new Date(booking.delivered_at), 'MMM d')}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" asChild className="flex-1">
                  <Link to={`/chat/${booking.id}`}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat with Creator
                  </Link>
                </Button>
                
                {booking.status === 'delivered' && (
                  <Button asChild className="flex-1">
                    <Link to={`/chat/${booking.id}`}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Review Delivery
                    </Link>
                  </Button>
                )}
                
                {['disputed', 'delivered'].includes(booking.status) && (
                  <Button variant="outline" asChild>
                    <Link to={`/chat/${booking.id}`}>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </Button>
                )}
              </div>

              {/* Escrow Manager for delivered bookings */}
              {booking.status === 'delivered' && (
                <EscrowManager bookingId={booking.id} isClient={true} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
