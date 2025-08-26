
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface NotificationsListProps {
  notifications?: any[];
  onMarkAsRead?: (id: string) => void;
}

export const NotificationsList = ({ notifications: propNotifications, onMarkAsRead: propMarkAsRead }: NotificationsListProps = {}) => {
  const { notifications: hookNotifications, unreadCount, markAsRead: hookMarkAsRead, loading } = useNotifications();
  const navigate = useNavigate();

  // Use props if provided, otherwise use hook data
  const notifications = propNotifications || hookNotifications;
  const markAsRead = propMarkAsRead || hookMarkAsRead;

  const handleNotificationClick = async (notification: any) => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate to relevant page
    if (notification.booking_id) {
      navigate(`/booking-confirmation/${notification.booking_id}`);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadNotifications = notifications.filter((n: any) => !n.read);
    for (const notification of unreadNotifications) {
      await markAsRead(notification.id);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-zinc-800 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // If used as a standalone component (not in popover)
  if (!propNotifications) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} unread</Badge>
              )}
            </CardTitle>
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleMarkAllRead}
                className="flex items-center gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-zinc-800/50 ${
                  notification.read ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-800 border-zinc-700'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm text-white truncate">
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-zinc-400 mb-2 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                      {notification.read && (
                        <Check className="h-3 w-3 text-zinc-600" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-zinc-600 mb-3" />
              <h3 className="text-lg font-medium text-white mb-1">No notifications</h3>
              <p className="text-zinc-400">You're all caught up! Check back later for updates.</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // If used in popover (with props)
  return (
    <div className="space-y-1">
      {notifications.length > 0 ? (
        notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-zinc-800/50 ${
              notification.read ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-800 border-zinc-700'
            }`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm text-white truncate">
                    {notification.title}
                  </h4>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-zinc-400 mb-2 line-clamp-2">
                  {notification.message}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </span>
                  {notification.read && (
                    <Check className="h-3 w-3 text-zinc-600" />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <Bell className="h-12 w-12 mx-auto text-zinc-600 mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">No notifications</h3>
          <p className="text-zinc-400">You're all caught up! Check back later for updates.</p>
        </div>
      )}
    </div>
  );
};
