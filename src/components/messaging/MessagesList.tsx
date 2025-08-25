
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Search, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface MessageContact {
  userId: string;
  handle: string;
  avatar_url?: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
}

export const MessagesList = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Get all direct message conversations for the current user
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['message-conversations', user?.id],
    queryFn: async (): Promise<MessageContact[]> => {
      if (!user?.id) return [];

      // Get all direct messages involving the current user
      const { data: messages, error } = await supabase
        .from('direct_messages')
        .select(`
          id,
          from_user_id,
          to_user_id,
          body,
          created_at,
          from_user:users!direct_messages_from_user_id_fkey (handle, avatar_url),
          to_user:users!direct_messages_to_user_id_fkey (handle, avatar_url)
        `)
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      // Group messages by conversation partner
      const conversationMap = new Map<string, MessageContact>();

      messages?.forEach((message: any) => {
        const isFromMe = message.from_user_id === user.id;
        const partnerId = isFromMe ? message.to_user_id : message.from_user_id;
        const partner = isFromMe ? message.to_user : message.from_user;

        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            userId: partnerId,
            handle: partner?.handle || 'Unknown User',
            avatar_url: partner?.avatar_url,
            lastMessage: message.body,
            lastMessageDate: message.created_at,
            unreadCount: 0 // For now, we'll implement this later
          });
        }
      });

      return Array.from(conversationMap.values());
    },
    enabled: !!user?.id
  });

  const filteredConversations = conversations?.filter(conv =>
    !searchTerm || conv.handle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading conversations...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Messages
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Conversations List */}
        <div className="space-y-2">
          {filteredConversations && filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <Link
                key={conversation.userId}
                to={`/messages/${conversation.userId}`}
                className="block"
              >
                <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <Link 
                    to={`/profile/${conversation.handle}`} 
                    className="flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Avatar className="h-10 w-10 hover:ring-2 hover:ring-primary/20 transition-all">
                      <AvatarImage src={conversation.avatar_url} />
                      <AvatarFallback>
                        {conversation.handle?.slice(0, 2).toUpperCase() || '??'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <Link 
                        to={`/profile/${conversation.handle}`}
                        className="font-medium truncate hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        @{conversation.handle}
                      </Link>
                      <div className="flex items-center gap-2">
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(conversation.lastMessageDate), 'MMM d')}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {conversation.lastMessage}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No conversations yet</p>
              <p className="text-sm">
                Start messaging creators or clients to see your conversations here
              </p>
            </div>
          )}
        </div>

        {/* Quick Action */}
        <div className="pt-4 border-t">
          <Link to="/browse">
            <Button className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Browse Creators to Message
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
