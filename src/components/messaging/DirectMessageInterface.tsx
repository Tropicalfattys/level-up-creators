
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface DirectMessage {
  id: string;
  from_user_id: string;
  to_user_id: string;
  body: string;
  created_at: string;
  from_user: {
    handle: string;
    avatar_url?: string;
  };
}

interface DirectMessageInterfaceProps {
  otherUserId: string;
}

export const DirectMessageInterface = ({ otherUserId }: DirectMessageInterfaceProps) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get other user info
  const { data: otherUser } = useQuery({
    queryKey: ['user-info', otherUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('handle, avatar_url')
        .eq('id', otherUserId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  // Get direct messages between users
  const { data: messages } = useQuery({
    queryKey: ['direct-messages', user?.id, otherUserId],
    queryFn: async (): Promise<DirectMessage[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          from_user:users!direct_messages_from_user_id_fkey (handle, avatar_url)
        `)
        .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching direct messages:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id
  });

  const sendMessage = useMutation({
    mutationFn: async (messageBody: string) => {
      if (!user || !messageBody.trim()) return;

      const { error } = await supabase
        .from('direct_messages')
        .insert([{
          from_user_id: user.id,
          to_user_id: otherUserId,
          body: messageBody.trim()
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['direct-messages', user?.id, otherUserId] });
    },
    onError: () => {
      toast.error('Failed to send message');
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage.mutate(message);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Please log in to send messages
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          Chat with @{otherUser?.handle || 'User'}
        </CardTitle>
        <CardDescription>Direct conversation</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages && messages.length > 0 ? (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.from_user_id === user?.id ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={msg.from_user?.avatar_url} />
                  <AvatarFallback>
                    {msg.from_user?.handle?.slice(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    msg.from_user_id === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{msg.body}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.from_user_id === user?.id
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {format(new Date(msg.created_at), 'MMM d, HH:mm')}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={sendMessage.isPending}
            />
            <Button size="sm" type="submit" disabled={sendMessage.isPending || !message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};
