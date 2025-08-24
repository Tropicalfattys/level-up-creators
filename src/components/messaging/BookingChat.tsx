
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { MessageAttachments } from './MessageAttachments';
import { Link } from 'react-router-dom';
import { useBookingChat } from '@/hooks/useBookingChat';

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
  };
}

interface BookingChatProps {
  bookingId: string;
  otherUserId: string;
  otherUserHandle: string;
}

export const BookingChat = ({ bookingId, otherUserId, otherUserHandle }: BookingChatProps) => {
  const [message, setMessage] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Use the booking chat hook for real-time updates
  const { isConnected } = useBookingChat({ bookingId, userId: user?.id });

  const { data: messages, isLoading } = useQuery({
    queryKey: ['booking-messages', bookingId],
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          from_user:users!messages_from_user_id_fkey (handle, avatar_url)
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    }
  });

  const sendMessage = useMutation({
    mutationFn: async ({ messageBody, attachments }: { messageBody: string; attachments?: any }) => {
      if (!user || (!messageBody.trim() && (!attachments || attachments.length === 0))) return;

      const messageData: any = {
        booking_id: bookingId,
        from_user_id: user.id,
        to_user_id: otherUserId,
        body: messageBody.trim() || 'Sent attachments'
      };

      if (attachments && attachments.length > 0) {
        messageData.attachments = { files: attachments };
      }

      const { error } = await supabase
        .from('messages')
        .insert([messageData]);

      if (error) throw error;
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

  const handleAttachmentRemove = (attachmentId: string) => {
    setPendingAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return <div className="text-center py-4">Loading messages...</div>;
  }

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Chat with @{otherUserHandle}</CardTitle>
            <CardDescription>Discuss project details and deliverables</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <Link to={`/chat/${bookingId}`}>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
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

        {/* Pending Attachments Preview */}
        {pendingAttachments.length > 0 && (
          <div className="border-t p-4 bg-muted/30">
            <div className="space-y-2">
              {pendingAttachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-2 bg-background rounded">
                  <span className="text-sm truncate">{attachment.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAttachmentRemove(attachment.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
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
              placeholder="Type your message..."
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
      </CardContent>
    </Card>
  );
};
