
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowLeft, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function BookingConfirmation() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user, userRole } = useAuth();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking-details', bookingId],
    queryFn: async () => {
      if (!bookingId) throw new Error('No booking ID provided');

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (title, description, price_usdc, delivery_days),
          client:users!bookings_client_id_fkey (handle, email),
          creator:users!bookings_creator_id_fkey (handle, email)
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!bookingId
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading booking details...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Booking Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested booking could not be found.</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
        <p className="text-muted-foreground">Your service has been successfully booked.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Booking Details
            <Badge variant="secondary">{booking.status}</Badge>
          </CardTitle>
          <CardDescription>
            Booking ID: {booking.id}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Service</h3>
            <p className="font-medium">{booking.services?.title}</p>
            <p className="text-sm text-muted-foreground">{booking.services?.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold">Price</h4>
              <p>${booking.usdc_amount} USDC</p>
            </div>
            <div>
              <h4 className="font-semibold">Delivery Time</h4>
              <p>{booking.services?.delivery_days} days</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold">Creator</h4>
            <p>@{booking.creator?.handle}</p>
          </div>

          <div>
            <h4 className="font-semibold">Booked On</h4>
            <p>{format(new Date(booking.created_at), 'PPP')}</p>
          </div>

          {booking.tx_hash && (
            <div>
              <h4 className="font-semibold">Transaction Hash</h4>
              <p className="text-xs font-mono break-all">{booking.tx_hash}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4 mt-6">
        <Link to={`/chat/${booking.id}`}>
          <Button className="flex-1">
            <MessageSquare className="h-4 w-4 mr-2" />
            Start Chat
          </Button>
        </Link>
        <Link to={
          userRole === 'creator' ? '/creator-dashboard' : 
          userRole === 'admin' ? '/admin' : 
          '/'
        }>
          <Button variant="outline" className="flex-1">
            Back To Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
