
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface ChatListProps {
  userRole?: string;
}

export const ChatList = ({ userRole }: ChatListProps) => {
  const { user } = useAuth();

  const { data: chats, isLoading } = useQuery({
    queryKey: ['user-chats', user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('bookings')
        .select(`
          id,
          status,
          created_at,
          usdc_amount,
          client:users!bookings_client_id_fkey (id, handle, avatar_url),
          creator:users!bookings_creator_id_fkey (id, handle, avatar_url),
          services (title),
          latest_message:messages!messages_booking_id_fkey (
            body,
            created_at,
            from_user:users!messages_from_user_id_fkey (handle)
          )
        `)
        .order('created_at', { ascending: false });

      // Filter based on user role and participation
      if (userRole === 'admin') {
        // Admin can see all bookings with messages
        query = query.not('latest_message', 'is', null);
      } else {
        // Regular users see only their bookings
        query = query.or(`client_id.eq.${user.id},creator_id.eq.${user.id}`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.filter(booking => booking.latest_message && booking.latest_message.length > 0) || [];
    },
    enabled: !!user?.id
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading chats...</div>
        </CardContent>
      </Card>
    );
  }

  if (!chats || chats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-sm">Messages will appear here after booking a service</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Messages ({chats.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {chats.map((chat) => {
          const latestMessage = chat.latest_message?.[0];
          const isClient = user?.id === chat.client?.id;
          const otherUser = isClient ? chat.creator : chat.client;
          
          return (
            <Link key={chat.id} to={`/chat/${chat.id}`}>
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={otherUser?.avatar_url} />
                  <AvatarFallback>
                    {otherUser?.handle?.slice(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium truncate">
                      {userRole === 'admin' 
                        ? `${chat.client?.handle} ↔ ${chat.creator?.handle}`
                        : `@${otherUser?.handle || 'Unknown'}`
                      }
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {chat.status}
                      </Badge>
                      {userRole === 'admin' && (
                        <Badge variant="secondary" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.services?.title}
                  </p>
                  
                  {latestMessage && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground truncate flex-1">
                        {latestMessage.from_user?.handle}: {latestMessage.body}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(latestMessage.created_at), 'MMM d')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
};
