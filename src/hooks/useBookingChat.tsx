
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface UseBookingChatProps {
  bookingId: string;
  userId?: string;
}

export const useBookingChat = ({ bookingId, userId }: UseBookingChatProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 3;

  useEffect(() => {
    if (!bookingId || !userId) {
      console.log('useBookingChat: Missing bookingId or userId');
      return;
    }

    // Prevent multiple connections
    if (channelRef.current) {
      console.log('useBookingChat: Channel already exists, cleaning up first');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    console.log('useBookingChat: Setting up subscription for booking:', bookingId, 'user:', userId);

    const setupChannel = () => {
      try {
        channelRef.current = supabase
          .channel(`booking-chat-${bookingId}-${Date.now()}`) // Add timestamp to prevent conflicts
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `booking_id=eq.${bookingId}`
            },
            (payload) => {
              console.log('useBookingChat: New message received:', payload);
              // Debounce query invalidation
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['booking-messages', bookingId] });
              }, 100);
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
              console.log('useBookingChat: Booking updated:', payload);
              // Debounce query invalidation
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['booking-details', bookingId] });
                queryClient.invalidateQueries({ queryKey: ['creator-bookings'] });
                queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
              }, 200);
            }
          )
          .subscribe((status) => {
            console.log('useBookingChat: Subscription status:', status);
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              setReconnectAttempts(0);
              console.log('useBookingChat: Connected to booking chat:', bookingId);
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              setIsConnected(false);
              console.log('useBookingChat: Disconnected from booking chat:', bookingId);
              
              // Implement exponential backoff for reconnection
              if (reconnectAttempts < maxReconnectAttempts) {
                const backoffDelay = Math.pow(2, reconnectAttempts) * 1000; // 1s, 2s, 4s
                console.log(`useBookingChat: Attempting reconnect in ${backoffDelay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
                
                reconnectTimeoutRef.current = setTimeout(() => {
                  setReconnectAttempts(prev => prev + 1);
                  if (channelRef.current) {
                    supabase.removeChannel(channelRef.current);
                  }
                  setupChannel();
                }, backoffDelay);
              } else {
                console.log('useBookingChat: Max reconnection attempts reached');
              }
            }
          });
      } catch (error) {
        console.error('useBookingChat: Error setting up channel:', error);
        setIsConnected(false);
      }
    };

    setupChannel();

    return () => {
      console.log('useBookingChat: Cleaning up subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setIsConnected(false);
      setReconnectAttempts(0);
    };
  }, [bookingId, userId, queryClient, reconnectAttempts]);

  return { isConnected };
};
