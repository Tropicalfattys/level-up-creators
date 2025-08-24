
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Paperclip, Download, FileText, Image } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
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
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      if (!user || (!messageBody.trim() && !attachments)) return;

      const messageData: any = {
        booking_id: bookingId,
        from_user_id: user.id,
        to_user_id: otherUserId,
        body: messageBody.trim() || 'Sent attachments'
      };

      if (attachments) {
        messageData.attachments = attachments;
      }

      const { error } = await supabase
        .from('messages')
        .insert([messageData]);

      if (error) throw error;
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['booking-messages', bookingId] });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  });

  const handleFileUpload = async (file: File) => {
    if (!file) return null;

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `message-attachments/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      return {
        files: [{
          id: uploadData.path,
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl
        }]
      };
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || fileInputRef.current?.files?.[0]) {
      let attachments = null;
      
      if (fileInputRef.current?.files?.[0]) {
        attachments = await handleFileUpload(fileInputRef.current.files[0]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }

      sendMessage.mutate({ 
        messageBody: message,
        attachments
      });
    }
  };

  const downloadFile = async (attachment: any) => {
    try {
      const response = await fetch(attachment.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const getFileIcon = (type: string) => {
    if (type?.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return <div className="text-center py-4">Loading messages...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="h-[500px] flex flex-col">
        <CardHeader className="pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Chat with @{otherUserHandle}</CardTitle>
              <CardDescription>Discuss project details and deliverables</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          {/* Messages Area - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages && messages.length > 0 ? (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${
                    msg.from_user_id === user?.id ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage src={msg.from_user?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {msg.from_user?.handle?.slice(0, 2).toUpperCase() || '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 max-w-xs">
                    <div
                      className={`inline-block px-3 py-2 rounded-lg ${
                        msg.from_user_id === user?.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                      
                      {/* Message Attachments */}
                      {msg.attachments?.files && Array.isArray(msg.attachments.files) && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.files.map((attachment: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-white/10 rounded text-xs">
                              {getFileIcon(attachment.type)}
                              <span className="flex-1 truncate">{attachment.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadFile(attachment)}
                                className="h-6 w-6 p-0 hover:bg-white/20"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs mt-1 opacity-70">
                        {format(new Date(msg.created_at), 'MMM d, HH:mm')}
                      </p>
                    </div>
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

          {/* Message Input - Fixed at bottom */}
          <div className="border-t p-4 flex-shrink-0">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
                disabled={sendMessage.isPending || uploading}
              />
              <Button 
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                type="submit" 
                disabled={sendMessage.isPending || uploading || (!message.trim() && !fileInputRef.current?.files?.[0])}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <input
              ref={fileInputRef}
              type="file"
              onChange={() => {}} // Handle on form submit
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt,.zip"
            />
            {uploading && (
              <p className="text-xs text-muted-foreground mt-2">Uploading file...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
