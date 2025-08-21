
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BookingChatWrapper } from '@/components/messaging/BookingChatWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, DollarSign, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function Chat() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking-details', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (
            title,
            description,
            category
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        console.error('Error fetching booking details:', error);
        throw error;
      }

      // Fetch client info
      const { data: client, error: clientError } = await supabase
        .from('users')
        .select('handle, avatar_url')
        .eq('id', data.client_id)
        .single();

      if (clientError) {
        console.error('Error fetching client:', clientError);
      }

      // Fetch creator info
      const { data: creator, error: creatorError } = await supabase
        .from('creators')
        .select(`
          users!creators_user_id_fkey (
            handle,
            avatar_url
          )
        `)
        .eq('id', data.creator_id)
        .single();

      if (creatorError) {
        console.error('Error fetching creator:', creatorError);
      }

      return {
        ...data,
        client: client || null,
        creator: creator || null
      };
    },
    enabled: !!bookingId
  });

  if (!bookingId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chat Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested chat could not be found.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-center py-8">Loading chat...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-center py-8">
          <h2 className="text-xl font-bold mb-2">Booking Not Found</h2>
          <p className="text-muted-foreground">This booking could not be found or you don't have access to it.</p>
        </div>
      </div>
    );
  }

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

  const isClient = user?.id === booking.client_id;
  const otherUser = isClient ? booking.creator?.users : booking.client;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Booking Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {booking.services?.title}
              </CardTitle>
              <CardDescription className="mt-1">
                Booking created {format(new Date(booking.created_at), 'MMM d, yyyy')} • 
                Chatting with @{otherUser?.handle || 'User'}
              </CardDescription>
            </div>
            {getStatusBadge(booking.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-medium">${booking.usdc_amount} USDC</span>
            </div>
            {booking.services?.category && (
              <Badge variant="outline">{booking.services.category}</Badge>
            )}
            {booking.delivered_at && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Delivered {format(new Date(booking.delivered_at), 'MMM d')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <BookingChatWrapper bookingId={bookingId} />
    </div>
  );
}
