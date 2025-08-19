
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ChatInterface } from './ChatInterface';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

interface BookingChatWrapperProps {
  bookingId: string;
}

export const BookingChatWrapper = ({ bookingId }: BookingChatWrapperProps) => {
  const { user } = useAuth();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking-details', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          client:users!bookings_client_id_fkey (handle, avatar_url),
          creator:users!bookings_creator_id_fkey (handle, avatar_url),
          services (title, description)
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <MessageSquare className="h-6 w-6 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!booking) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Booking not found
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if user has access to this chat
  const hasAccess = user?.id === booking.client_id || 
                   user?.id === booking.creator_id || 
                   currentUser?.role === 'admin';

  if (!hasAccess) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            You don't have access to this chat
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ChatInterface
      bookingId={bookingId}
      clientId={booking.client_id}
      creatorId={booking.creator_id}
      clientHandle={booking.client?.handle || 'Client'}
      creatorHandle={booking.creator?.handle || 'Creator'}
      currentUserRole={currentUser?.role}
    />
  );
};
