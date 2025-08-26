
import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate to relevant page
    if (notification.booking_id) {
      navigate(`/booking-confirmation/${notification.booking_id}`);
    }

    setIsOpen(false);
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-white/80 hover:text-white hover:bg-zinc-800"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-600 text-white text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 bg-zinc-900 border-zinc-800 z-50" align="end">
        <div className="flex items-center justify-between p-3 border-b border-zinc-800">
          <h3 className="font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-96">
          {recentNotifications.length > 0 ? (
            <>
              {recentNotifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer text-white hover:bg-zinc-800 focus:bg-zinc-800"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{notification.title}</span>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-zinc-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              
              {notifications.length > 5 && (
                <>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem 
                    className="text-center text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 focus:bg-zinc-800"
                    onClick={() => {
                      navigate('/notifications');
                      setIsOpen(false);
                    }}
                  >
                    View all notifications
                  </DropdownMenuItem>
                </>
              )}
            </>
          ) : (
            <div className="p-6 text-center text-zinc-400">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
