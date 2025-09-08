
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { Mail, MessageSquare, Search, Users, Briefcase, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const AdminContacts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('general');
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // General Messages query (direct_messages table)
  const { data: generalMessages, isLoading: generalLoading } = useQuery({
    queryKey: ['admin-general-messages'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('direct_messages')
          .select(`
            *,
            from_user:users!direct_messages_from_user_id_fkey (handle, avatar_url, role),
            to_user:users!direct_messages_to_user_id_fkey (handle, avatar_url, role)
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('General messages query error:', error);
          return [];
        }

        // Group messages by conversation pairs
        const conversationMap = new Map();
        
        data?.forEach((message: any) => {
          const participants = [message.from_user_id, message.to_user_id].sort();
          const conversationKey = participants.join('-');
          
          if (!conversationMap.has(conversationKey)) {
            conversationMap.set(conversationKey, {
              id: conversationKey,
              participants: [message.from_user, message.to_user],
              lastMessage: message,
              messageCount: 1,
              messages: [message]
            });
          } else {
            const conversation = conversationMap.get(conversationKey);
            conversation.messageCount++;
            conversation.messages.push(message);
            if (new Date(message.created_at) > new Date(conversation.lastMessage.created_at)) {
              conversation.lastMessage = message;
            }
          }
        });

        return Array.from(conversationMap.values());
      } catch (error) {
        console.error('General messages fetch error:', error);
        return [];
      }
    }
  });

  // Service Messages query (messages table with booking context)
  const { data: serviceMessages, isLoading: serviceLoading } = useQuery({
    queryKey: ['admin-service-messages'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            from_user:users!messages_from_user_id_fkey (handle, avatar_url, role),
            to_user:users!messages_to_user_id_fkey (handle, avatar_url, role),
            booking:bookings (
              id,
              status,
              usdc_amount,
              services (title, description),
              client:users!bookings_client_id_fkey (handle),
              creator:users!bookings_creator_id_fkey (handle)
            )
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Service messages query error:', error);
          return [];
        }

        // Group messages by booking_id
        const bookingMap = new Map();
        
        data?.forEach((message: any) => {
          const bookingId = message.booking_id;
          
          if (!bookingMap.has(bookingId)) {
            bookingMap.set(bookingId, {
              id: bookingId,
              booking: message.booking,
              lastMessage: message,
              messageCount: 1,
              messages: [message]
            });
          } else {
            const conversation = bookingMap.get(bookingId);
            conversation.messageCount++;
            conversation.messages.push(message);
            if (new Date(message.created_at) > new Date(conversation.lastMessage.created_at)) {
              conversation.lastMessage = message;
            }
          }
        });

        return Array.from(bookingMap.values());
      } catch (error) {
        console.error('Service messages fetch error:', error);
        return [];
      }
    }
  });

  const filteredGeneralMessages = generalMessages?.filter((conversation: any) => {
    if (!searchTerm) return true;
    return conversation.participants.some((user: any) => 
      user?.handle?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || conversation.lastMessage?.body?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredServiceMessages = serviceMessages?.filter((conversation: any) => {
    if (!searchTerm) return true;
    return conversation.booking?.services?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conversation.booking?.client?.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conversation.booking?.creator?.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conversation.lastMessage?.body?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const isLoading = generalLoading || serviceLoading;

  if (isLoading) {
    return <div className="text-center py-8">Loading contacts...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Management
          </CardTitle>
          <CardDescription>
            Manage and respond to customer inquiries and view all platform messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {isMobile ? (
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full mb-4">
                  <SelectValue placeholder="Select message type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Messages</SelectItem>
                  <SelectItem value="service">Service Messages</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">General Messages</TabsTrigger>
                <TabsTrigger value="service">Service Messages</TabsTrigger>
              </TabsList>
            )}
            
            {/* General Messages Tab */}
            <TabsContent value="general" className="space-y-4 mt-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search general conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredGeneralMessages?.map((conversation: any) => (
                  <div key={conversation.id} className={`p-4 border rounded-lg ${isMobile ? 'flex flex-col space-y-3' : 'flex items-center justify-between'}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          @{conversation.participants[0]?.handle} ↔ @{conversation.participants[1]?.handle}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {conversation.messageCount} message{conversation.messageCount !== 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          "{conversation.lastMessage?.body?.substring(0, 100) || 'No content'}..."
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last: {format(new Date(conversation.lastMessage.created_at), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 ${isMobile ? 'w-full justify-center' : ''}`}>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedConversation(conversation)}
                            className={isMobile ? 'w-full' : ''}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Conversation
                          </Button>
                        </DialogTrigger>
                        <DialogContent className={`${isMobile ? 'max-w-[95vw] w-[95vw] max-h-[90vh]' : 'max-w-4xl max-h-[80vh]'} overflow-hidden`}>
                          <DialogHeader>
                            <DialogTitle>General Conversation</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="h-full">
                            <div className="space-y-4">
                              <div className={`p-3 bg-muted rounded ${isMobile ? 'flex flex-col gap-2' : 'flex items-center gap-4'}`}>
                                <Users className="h-5 w-5" />
                                <span className="font-medium">
                                  @{conversation.participants[0]?.handle} ↔ @{conversation.participants[1]?.handle}
                                </span>
                                <Badge>{conversation.messageCount} messages</Badge>
                              </div>
                              
                              <div className="space-y-3 max-h-96 overflow-y-auto">
                                {conversation.messages?.sort((a: any, b: any) => 
                                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                                ).map((message: any) => (
                                  <div key={message.id} className="flex gap-3 p-3 border rounded">
                                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-xs font-medium">
                                        {message.from_user?.handle?.charAt(0) || '?'}
                                      </span>
                                    </div>
                                    <div className="flex-1">
                                      <div className={`gap-2 mb-1 ${isMobile ? 'flex flex-col' : 'flex items-center'}`}>
                                        <span className="font-medium text-sm">@{message.from_user?.handle}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {format(new Date(message.created_at), 'MMM d, HH:mm')}
                                        </span>
                                      </div>
                                      <p className="text-sm">{message.body}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
                {(!filteredGeneralMessages || filteredGeneralMessages.length === 0) && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No General Messages</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      No direct messages between users found.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Service Messages Tab */}
            <TabsContent value="service" className="space-y-4 mt-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search service conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredServiceMessages?.map((conversation: any) => (
                  <div key={conversation.id} className={`p-4 border rounded-lg ${isMobile ? 'flex flex-col space-y-3' : 'flex items-center justify-between'}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {conversation.booking?.services?.title || 'Service Booking'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{conversation.booking?.client?.handle} → @{conversation.booking?.creator?.handle}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {conversation.messageCount} message{conversation.messageCount !== 1 ? 's' : ''} • 
                          ${conversation.booking?.usdc_amount} USDC • 
                          Status: {conversation.booking?.status}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          "{conversation.lastMessage?.body?.substring(0, 100) || 'No content'}..."
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last: {format(new Date(conversation.lastMessage.created_at), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 ${isMobile ? 'w-full flex-col space-y-2' : ''}`}>
                      <Badge variant="secondary">{conversation.booking?.status}</Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedConversation(conversation)}
                            className={isMobile ? 'w-full' : ''}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Conversation
                          </Button>
                        </DialogTrigger>
                        <DialogContent className={`${isMobile ? 'max-w-[95vw] w-[95vw] max-h-[90vh]' : 'max-w-4xl max-h-[80vh]'} overflow-hidden`}>
                          <DialogHeader>
                            <DialogTitle>Service Conversation</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="h-full">
                            <div className="space-y-4">
                              <div className={`gap-4 p-3 bg-muted rounded ${isMobile ? 'flex flex-col space-y-4' : 'grid md:grid-cols-2'}`}>
                                <div>
                                  <h4 className="font-medium mb-2">Service Details</h4>
                                  <p className="text-sm"><strong>Service:</strong> {conversation.booking?.services?.title}</p>
                                  <p className="text-sm"><strong>Amount:</strong> ${conversation.booking?.usdc_amount} USDC</p>
                                  <p className="text-sm"><strong>Status:</strong> {conversation.booking?.status}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Participants</h4>
                                  <p className="text-sm"><strong>Client:</strong> @{conversation.booking?.client?.handle}</p>
                                  <p className="text-sm"><strong>Creator:</strong> @{conversation.booking?.creator?.handle}</p>
                                  <p className="text-sm"><strong>Messages:</strong> {conversation.messageCount}</p>
                                </div>
                              </div>
                              
                              <div className="space-y-3 max-h-96 overflow-y-auto">
                              {conversation.messages?.sort((a: any, b: any) => 
                                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                              ).map((message: any) => (
                                <div key={message.id} className="flex gap-3 p-3 border rounded">
                                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-medium">
                                      {message.from_user?.handle?.charAt(0) || '?'}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <div className={`gap-2 mb-1 ${isMobile ? 'flex flex-col' : 'flex items-center'}`}>
                                      <span className="font-medium text-sm">@{message.from_user?.handle}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {message.from_user?.role}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(message.created_at), 'MMM d, HH:mm')}
                                      </span>
                                    </div>
                                    <p className="text-sm">{message.body}</p>
                                  </div>
                                </div>
                              ))}
                              </div>
                            </div>
                           </ScrollArea>
                         </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
                {(!filteredServiceMessages || filteredServiceMessages.length === 0) && (
                  <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Service Messages</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      No service-related conversations found.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
