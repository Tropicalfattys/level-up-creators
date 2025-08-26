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
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Use the booking chat hook for real-time updates
  const { isConnected } = useBookingChat({ bookingId, userId: user?.id });

  // Determine the other user
  const isClient = user?.id === clientId;
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
          from_user:users!messages_from_user_id_fkey (handle, avatar_url)
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }
      console.log('Fetched messages:', data);
      return data || [];
    }
  });

  const sendMessage = useMutation({
    mutationFn: async ({ messageBody, attachments }: { messageBody: string; attachments?: any }) => {
      if (!user || (!messageBody.trim() && !attachments)) {
        console.log('Invalid message data:', { user: !!user, messageBody, attachments });
        return;
      }

      console.log('Sending message:', { messageBody, attachments, bookingId, fromUserId: user.id, toUserId: otherUserId });

      const messageData: any = {
        booking_id: bookingId,
        from_user_id: user.id,
        to_user_id: otherUserId,
        body: messageBody.trim() || (attachments ? 'Sent attachment' : '')
      };

      if (attachments) {
        messageData.attachments = attachments;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      console.log('Message sent successfully:', data);
      return data;
    },
    onSuccess: () => {
      console.log('Message sent, clearing form');
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['booking-messages', bookingId] });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  });

  const uploadFile = async (file: File) => {
    console.log('Starting file upload:', {
      name: file.name,
      size: file.size,
      type: file.type,
      bookingId
    });

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error('File too large:', file.size);
      toast.error('File size must be less than 10MB');
      return null;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type);
      toast.error('File type not supported');
      return null;
    }

    try {
      setUploading(true);
      const fileName = `chat/${bookingId}/${Date.now()}-${file.name}`;
      
      console.log('Uploading to path:', fileName);

      // Upload to attachments bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error details:', {
          error: uploadError,
          message: uploadError.message
        });
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Upload successful:', uploadData);

      // Create attachment object
      const attachment = {
        id: uploadData.path,
        name: file.name,
        size: file.size,
        type: file.type,
        path: uploadData.path
      };

      console.log('Created attachment object:', attachment);
      toast.success('File uploaded successfully');
      return attachment;

    } catch (error) {
      console.error('File upload failed:', error);
      toast.error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = () => {
    console.log('File select clicked');
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('File selected:', file);
    
    if (!file) {
      console.log('No file selected');
      return;
    }

    const attachment = await uploadFile(file);
    
    if (attachment) {
      console.log('File uploaded, sending message with attachment');
      // Send message with attachment
      sendMessage.mutate({ 
        messageBody: '',
        attachments: { files: [attachment] }
      });
    }

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Send button clicked, message:', message);
    
    if (message.trim()) {
      sendMessage.mutate({ 
        messageBody: message,
        attachments: null
      });
    }
  };

  const downloadFile = async (attachment: any) => {
    try {
      console.log('Downloading file:', attachment);
      
      // Create a signed URL for download (valid for 5 minutes)
      const { data: signedUrlData, error } = await supabase.storage
        .from('attachments')
        .createSignedUrl(attachment.path || attachment.id, 300);

      if (error) {
        console.error('Error getting signed URL:', error);
        toast.error('Failed to get download link');
        return;
      }

      console.log('Got signed URL for download');

      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = signedUrlData.signedUrl;
      link.download = attachment.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const getFileIcon = (type: string) => {
    if (type?.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages && messages.length > 0 ? (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.from_user_id === user?.id ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={msg.from_user?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {msg.from_user?.handle?.slice(0, 2).toUpperCase() || '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 max-w-xs ${msg.from_user_id === user?.id ? 'text-right' : 'text-left'}`}>
                    <div
                      className={`inline-block px-4 py-2 rounded-lg ${
                        msg.from_user_id === user?.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {msg.body && (
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                      )}
                      
                      {/* Message Attachments */}
                      {msg.attachments?.files && Array.isArray(msg.attachments.files) && (
                        <div className="mt-2 space-y-2">
                          {msg.attachments.files.map((attachment: any, index: number) => (
                            <div key={index} className={`p-2 rounded border ${
                              msg.from_user_id === user?.id 
                                ? 'bg-white/10 border-white/20' 
                                : 'bg-white border-gray-200'
                            }`}>
                              <div className="flex items-center gap-2 text-xs">
                                {getFileIcon(attachment.type)}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{attachment.name}</p>
                                  <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => downloadFile(attachment)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
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
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                onChange={handleFileChange}
              />
              <Button 
                type="button"
                variant="outline"
                size="icon"
                onClick={handleFileSelect}
                disabled={uploading || sendMessage.isPending}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                type="submit" 
                disabled={sendMessage.isPending || uploading || !message.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            {uploading && (
              <p className="text-xs text-muted-foreground mt-2">Uploading file...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
