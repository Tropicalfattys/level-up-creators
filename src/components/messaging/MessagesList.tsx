
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Search, Users } from 'lucide-react';
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

interface UserSearchResult {
  id: string;
  handle: string;
  avatar_url?: string;
  role: string;
}

export const MessagesList = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Get all direct message conversations for the current user
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
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

  // Search for users when search term is entered
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['user-search', searchTerm],
    queryFn: async (): Promise<UserSearchResult[]> => {
      if (!searchTerm.trim() || !user?.id) return [];

      const { data, error } = await supabase
        .from('users')
        .select('id, handle, avatar_url, role')
        .neq('id', user.id) // Exclude current user
        .or('banned.is.null,banned.eq.false') // Only non-banned users
        .ilike('handle', `%${searchTerm.trim()}%`)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!searchTerm.trim() && !!user?.id
  });

  // Filter existing conversations based on search
  const filteredConversations = conversations?.filter(conv =>
    !searchTerm || conv.handle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = conversationsLoading || searchLoading;
  const showSearchResults = searchTerm.trim().length > 0;
  const displayResults = showSearchResults ? searchResults : filteredConversations;

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
            placeholder="Search users to message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Results */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              {showSearchResults ? 'Searching users...' : 'Loading conversations...'}
            </div>
          ) : displayResults && displayResults.length > 0 ? (
            <div className="space-y-2">
              {showSearchResults && (
                <div className="text-sm text-muted-foreground px-2 py-1 border-b">
                  <Users className="h-4 w-4 inline mr-1" />
                  Search Results
                </div>
              )}
              {showSearchResults ? (
                // Show search results (users to start new conversations with)
                searchResults?.map((userResult) => (
                  <Link
                    key={userResult.id}
                    to={`/messages/${userResult.id}`}
                    className="block"
                  >
                    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={userResult.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userResult.handle || 'User')}&background=6b7280&color=ffffff&size=128`} 
                        />
                        <AvatarFallback>
                          {userResult.handle?.slice(0, 2).toUpperCase() || '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">@{userResult.handle}</span>
                          {userResult.role === 'creator' && (
                            <Badge variant="secondary" className="text-xs">Creator</Badge>
                          )}
                          {userResult.role === 'admin' && (
                            <Badge variant="destructive" className="text-xs">Admin</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Start a conversation
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                // Show existing conversations
                filteredConversations?.map((conversation) => (
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
                          <AvatarImage 
                            src={conversation.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.handle || 'User')}&background=6b7280&color=ffffff&size=128`} 
                          />
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
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              {showSearchResults ? (
                <div>
                  <p className="text-lg font-medium mb-2">No users found</p>
                  <p className="text-sm">
                    Try searching for a different username
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium mb-2">No conversations yet</p>
                  <p className="text-sm">
                    Search for users above to start messaging
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
