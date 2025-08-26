
import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  booking_id?: string;
  payment_id?: string;
  dispute_id?: string;
  read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  // Fetch notifications with better error handling
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('Fetching notifications for user:', user.id);
      
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching notifications:', error);
          throw error;
        }

        console.log('Fetched notifications:', data?.length || 0, 'items');
        return data as Notification[];
      } catch (error) {
        console.error('Exception fetching notifications:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    retry: 2,
    retryDelay: 2000,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false // Prevent excessive refetching
  });

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;

    try {
      console.log('Marking notification as read:', notificationId);
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      console.log('Notification marked as read successfully');
      // Update the query cache
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
    } catch (error) {
      console.error('Exception marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      console.log('Marking all notifications as read for user:', user.id);
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      console.log('All notifications marked as read successfully');
      // Update the query cache
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
    } catch (error) {
      console.error('Exception marking all notifications as read:', error);
    }
  };

  // Set up real-time subscription with proper connection management
  useEffect(() => {
    if (!user?.id) return;

    // Prevent multiple subscriptions
    if (channelRef.current) {
      console.log('Notifications: Cleaning up existing channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log('Setting up notifications subscription for user:', user.id);
    setConnectionStatus('connecting');

    try {
      channelRef.current = supabase
        .channel(`notifications-${user.id}-${Date.now()}`) // Add timestamp to prevent conflicts
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Notifications realtime event:', payload);
            // Debounce query invalidation to prevent excessive requests
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
            }, 500);
          }
        )
        .subscribe((status) => {
          console.log('Notifications subscription status:', status);
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setConnectionStatus('disconnected');
          }
        });
    } catch (error) {
      console.error('Error setting up notifications subscription:', error);
      setConnectionStatus('disconnected');
    }

    return () => {
      console.log('Cleaning up notifications subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setConnectionStatus('disconnected');
    };
  }, [user?.id, queryClient]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    connectionStatus,
  };
};
