
import { useState, useEffect } from 'react';
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
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Fetch notifications
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('Fetching notifications for user:', user.id);
      
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

      console.log('Fetched notifications:', data);
      return data as Notification[];
    },
    enabled: !!user?.id,
    retry: 3,
    retryDelay: 1000
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

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id || isSubscribed) return;

    console.log('Setting up notifications subscription for user:', user.id);

    const channel = supabase
      .channel('notifications')
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
          // Invalidate and refetch notifications when changes occur
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      )
      .subscribe((status) => {
        console.log('Notifications subscription status:', status);
      });

    setIsSubscribed(true);

    return () => {
      console.log('Cleaning up notifications subscription');
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [user?.id, queryClient, isSubscribed]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
  };
};
