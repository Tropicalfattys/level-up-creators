
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { MessageAttachments } from './MessageAttachments';

interface Message {
  id: string;
  from_user_id: string;
  to_user_id: string;
  body: string;
  created_at: string;
  attachments?: any;
  from_user: {
    handle: string;
    avatar_url?: string;
    role?: string;
  };
}

interface ChatInterfaceProps {
  bookingId: string;
  clientId: string;
  creatorId: string;
  clientHandle: string;
  creatorHandle: string;
  currentUserRole?: string;
}

export const ChatInterface = ({ 
  bookingId, 
  clientId, 
  creatorId, 
  clientHandle, 
  creatorHandle,
  currentUserRole 
}: ChatInterfaceProps) => {
  const [message, setMessage] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Determine the other user based on current user
  const isClient = user?.id === clientId;
  const isCreator = user?.id === creatorId;
  const isAdmin = currentUserRole === 'admin';
  const otherUserId = isClient ? creatorId : clientId;
  const otherUserHandle = isClient ? creatorHandle : clientHandle;

  const { data: messages, isLoading } = useQuery({
    queryKey: ['booking-messages', bookingId],
    queryFn: async (): Promise<Message[]> => {
      console.log('Fetching messages for booking:', bookingId);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          from_user:users!messages_from_user_id_fkey (handle, avatar_url, role)
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }
      return data || [];
    }
  });

  const sendMessage = useMutation({
    mutationFn: async ({ messageBody, attachments }: { messageBody: string; attachments?: any }) => {
      if (!user || (!messageBody.trim() && !attachments)) return;

      console.log('Sending message:', { messageBody, attachments, bookingId });

      // Determine recipient based on sender
      let toUserId = otherUserId;
      if (isAdmin) {
        // Admin can send to both, but let's default to the other participant
        toUserId = otherUserId;
      }

      const messageData: any = {
        booking_id: bookingId,
        from_user_id: user.id,
        to_user_id: toUserId,
        body: messageBody.trim() || 'Sent attachments'
      };

      if (attachments && attachments.length > 0) {
        messageData.attachments = { files: attachments };
      }

      const { error } = await supabase
        .from('messages')
        .insert([messageData]);

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },
    onSuccess: () => {
      setMessage('');
      setPendingAttachments([]);
      queryClient.invalidateQueries({ queryKey: ['booking-messages', bookingId] });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || pendingAttachments.length > 0) {
      sendMessage.mutate({ 
        messageBody: message,
        attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined
      });
    }
  };

  const handleAttachmentAdd = (attachment: any) => {
    setPendingAttachments(prev => [...prev, attachment]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up real-time subscription
  useEffect(() => {
    console.log('Setting up real-time subscription for booking:', bookingId);
    const channel = supabase
      .channel(`booking-messages-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          console.log('New message received via realtime:', payload);
          queryClient.invalidateQueries({ queryKey: ['booking-messages', bookingId] });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [bookingId, queryClient]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading messages...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {isAdmin ? `Chat: ${clientHandle} ↔ ${creatorHandle}` : `Chat with @${otherUserHandle}`}
        </CardTitle>
        <CardDescription>
          {isAdmin 
            ? 'Admin view - monitoring booking conversation'
            : 'Discuss project details and deliverables'
          }
        </CardDescription>
        {isAdmin && (
          <Badge variant="secondary" className="w-fit">
            Admin Monitoring
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages && messages.length > 0 ? (
            messages.map((msg) => {
              const isCurrentUser = msg.from_user_id === user?.id;
              const isAdminMessage = msg.from_user?.role === 'admin';
              
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    isCurrentUser ? 'flex-row-reverse' : 'flex-row'
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
                      isCurrentUser
                        ? 'bg-primary text-primary-foreground'
                        : isAdminMessage
                        ? 'bg-orange-100 border border-orange-200'
                        : 'bg-muted'
                    }`}
                  >
                    {isAdminMessage && (
                      <Badge variant="outline" className="mb-1 text-xs">
                        Admin
                      </Badge>
                    )}
                    <p className="text-sm">{msg.body}</p>
                    
                    {/* Message Attachments */}
                    {msg.attachments?.files && (
                      <div className="mt-2">
                        <MessageAttachments 
                          attachments={msg.attachments.files}
                          canUpload={false}
                        />
                      </div>
                    )}
                    
                    <p
                      className={`text-xs mt-1 ${
                        isCurrentUser
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {format(new Date(msg.created_at), 'MMM d, HH:mm')}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Pending Attachments Preview */}
        {pendingAttachments.length > 0 && (
          <div className="border-t p-4 bg-muted/30">
            <MessageAttachments 
              attachments={pendingAttachments}
              canUpload={false}
            />
          </div>
        )}

        {/* Message Input - Only show if user is participant or admin */}
        {(isClient || isCreator || isAdmin) && (
          <div className="border-t p-4">
            <div className="mb-2">
              <MessageAttachments
                onAttachmentAdd={handleAttachmentAdd}
                canUpload={true}
              />
            </div>
            <form onSubmit={handleSend} className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isAdmin ? "Send admin message..." : "Type your message..."}
                className="flex-1"
                disabled={sendMessage.isPending}
              />
              <Button 
                size="sm" 
                type="submit" 
                disabled={sendMessage.isPending || (!message.trim() && pendingAttachments.length === 0)}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
