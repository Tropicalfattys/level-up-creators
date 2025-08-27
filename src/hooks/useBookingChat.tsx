
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
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!bookingId || !userId) {
      console.log('useBookingChat: Missing bookingId or userId');
      return;
    }

    // Clean up any existing connections
    if (channelRef.current) {
      console.log('useBookingChat: Cleaning up existing channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    console.log('useBookingChat: Setting up subscription for booking:', bookingId, 'user:', userId);

    const setupChannel = () => {
      if (!mountedRef.current) return;
      
      try {
        // Use consistent channel name without timestamps to prevent conflicts
        const channelName = `booking-chat-${bookingId}`;
        
        channelRef.current = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `booking_id=eq.${bookingId}`
            },
            (payload) => {
              if (!mountedRef.current) return;
              console.log('useBookingChat: New message received:', payload);
              // Debounced query invalidation
              setTimeout(() => {
                if (mountedRef.current) {
                  queryClient.invalidateQueries({ queryKey: ['booking-messages', bookingId] });
                }
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
              if (!mountedRef.current) return;
              console.log('useBookingChat: Booking updated:', payload);
              // Debounced query invalidation
              setTimeout(() => {
                if (mountedRef.current) {
                  queryClient.invalidateQueries({ queryKey: ['booking-details', bookingId] });
                  queryClient.invalidateQueries({ queryKey: ['creator-bookings'] });
                  queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
                }
              }, 200);
            }
          )
          .subscribe((status) => {
            if (!mountedRef.current) return;
            
            console.log('useBookingChat: Subscription status:', status);
            
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              setReconnectAttempts(0);
              console.log('useBookingChat: Connected to booking chat:', bookingId);
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              setIsConnected(false);
              console.log('useBookingChat: Disconnected from booking chat:', bookingId);
              
              // Only attempt reconnection if still mounted and haven't exceeded max attempts
              if (mountedRef.current && reconnectAttempts < maxReconnectAttempts) {
                const backoffDelay = Math.pow(2, reconnectAttempts) * 2000; // 2s, 4s, 8s
                console.log(`useBookingChat: Attempting reconnect in ${backoffDelay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
                
                reconnectTimeoutRef.current = setTimeout(() => {
                  if (mountedRef.current) {
                    setReconnectAttempts(prev => prev + 1);
                    if (channelRef.current) {
                      supabase.removeChannel(channelRef.current);
                      channelRef.current = null;
                    }
                    setupChannel();
                  }
                }, backoffDelay);
              } else if (reconnectAttempts >= maxReconnectAttempts) {
                console.log('useBookingChat: Max reconnection attempts reached, giving up');
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
      mountedRef.current = false;
      
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
  }, [bookingId, userId, queryClient]);

  // Reset mounted ref when component unmounts
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { isConnected };
};
