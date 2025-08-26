
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Message {
  id: string;
  booking_id: string;
  from_user_id: string;
  to_user_id: string;
  body: string;
  attachments?: any;
  created_at: string;
}

export const useBookingChat = (bookingId: string | null, shouldLoad: boolean = true) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!bookingId || !user || !shouldLoad) {
      setMessages([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [bookingId, user, shouldLoad]);

  useEffect(() => {
    if (!bookingId || !user || !shouldLoad) return;

    fetchMessages();

    // Subscribe to real-time updates only if we should load messages
    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          console.log('New message:', payload);
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, user, fetchMessages, shouldLoad]);

  const sendMessage = async (messageBody: string, toUserId: string) => {
    if (!bookingId || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          booking_id: bookingId,
          from_user_id: user.id,
          to_user_id: toUserId,
          body: messageBody,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    refetch: fetchMessages,
  };
};
