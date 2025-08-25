
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

      console.log('Fetching chats for user:', user.id, 'role:', userRole);

      let query = supabase
        .from('bookings')
        .select(`
          id,
          status,
          created_at,
          usdc_amount,
          client_id,
          creator_id,
          client:users!bookings_client_id_fkey (id, handle, avatar_url),
          creator:users!bookings_creator_id_fkey (id, handle, avatar_url),
          services (title),
          latest_message:messages (
            body,
            created_at,
            from_user:users!messages_from_user_id_fkey (handle)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1, { foreignTable: 'latest_message' });

      // Filter based on user role and participation
      if (userRole === 'admin') {
        // Admin can see all bookings that have messages
        // We'll filter for bookings that have at least one message
      } else {
        // Regular users see only their bookings
        query = query.or(`client_id.eq.${user.id},creator_id.eq.${user.id}`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching chats:', error);
        throw error;
      }

      console.log('Raw chat data:', data);

      // Filter out bookings without messages and get the latest message for each
      const chatsWithMessages = [];
      
      for (const booking of data || []) {
        // Get the latest message for this booking
        const { data: messages, error: messageError } = await supabase
          .from('messages')
          .select(`
            body,
            created_at,
            from_user:users!messages_from_user_id_fkey (handle)
          `)
          .eq('booking_id', booking.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!messageError && messages && messages.length > 0) {
          chatsWithMessages.push({
            ...booking,
            latest_message: messages
          });
        }
      }

      console.log('Processed chats with messages:', chatsWithMessages);
      return chatsWithMessages;
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
          const isClient = user?.id === chat.client_id;
          const otherUser = isClient ? chat.creator : chat.client;
          
          return (
            <Link key={chat.id} to={`/chat/${chat.id}`}>
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border">
                <Link to={`/profile/${otherUser?.handle}`} className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Avatar className="h-10 w-10 hover:ring-2 hover:ring-primary/20 transition-all">
                    <AvatarImage src={otherUser?.avatar_url} />
                    <AvatarFallback>
                      {otherUser?.handle?.slice(0, 2).toUpperCase() || '??'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium truncate">
                      {userRole === 'admin' ? (
                        <span>
                          <Link 
                            to={`/profile/${chat.client?.handle}`}
                            className="hover:text-primary transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {chat.client?.handle}
                          </Link>
                          {' ↔ '}
                          <Link 
                            to={`/profile/${chat.creator?.handle}`}
                            className="hover:text-primary transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {chat.creator?.handle}
                          </Link>
                        </span>
                      ) : (
                        <Link 
                          to={`/profile/${otherUser?.handle}`}
                          className="hover:text-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          @{otherUser?.handle || 'Unknown'}
                        </Link>
                      )}
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
                        <Link 
                          to={`/profile/${latestMessage.from_user?.handle}`}
                          className="hover:text-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {latestMessage.from_user?.handle}
                        </Link>
                        : {latestMessage.body}
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
