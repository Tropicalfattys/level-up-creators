
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface UseBookingChatProps {
  bookingId: string;
  userId?: string;
}

export const useBookingChat = ({ bookingId, userId }: UseBookingChatProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!bookingId || !userId) return;

    const channel = supabase
      .channel(`booking-chat-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          console.log('New message received:', payload);
          // Invalidate the messages query to fetch new data
          queryClient.invalidateQueries({ queryKey: ['booking-messages', bookingId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public', 
          table: 'bookings',
          filter: `id=eq.${bookingId}`
        },
        (payload) => {
          console.log('Booking updated:', payload);
          // Invalidate booking queries when status changes
          queryClient.invalidateQueries({ queryKey: ['booking-details', bookingId] });
          queryClient.invalidateQueries({ queryKey: ['creator-bookings'] });
          queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          console.log('Connected to booking chat:', bookingId);
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          console.log('Disconnected from booking chat:', bookingId);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [bookingId, userId, queryClient]);

  return { isConnected };
};
