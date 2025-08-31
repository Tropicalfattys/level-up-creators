
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MessageSquare, Search, Clock, CheckCircle, Users, Briefcase, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const AdminContacts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [response, setResponse] = useState('');
  const queryClient = useQueryClient();

  // Original contact messages query (for contact form submissions)
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['admin-contacts'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('contact_messages')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Contacts query error:', error);
          return [];
        }
        return data || [];
      } catch (error) {
        console.error('Contacts fetch error:', error);
        return [];
      }
    }
  });

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

  const respondToContact = useMutation({
    mutationFn: async ({ contactId }: { contactId: string }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('contact_messages')
        .update({ 
          status: 'closed'
        })
        .eq('id', contactId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      setResponse('');
      toast.success('Contact marked as responded');
    },
    onError: () => {
      toast.error('Failed to respond to contact');
    }
  });

  const filteredContacts = contacts?.filter((contact: any) => {
    const matchesSearch = !searchTerm || 
      contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.message?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'closed': return 'default';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="h-3 w-3 mr-1" />;
      case 'closed': return <CheckCircle className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  const isLoading = contactsLoading || generalLoading || serviceLoading;

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
          <Tabs defaultValue="contact-form" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="contact-form">Contact Form</TabsTrigger>
              <TabsTrigger value="general">General Messages</TabsTrigger>
              <TabsTrigger value="service">Service Messages</TabsTrigger>
            </TabsList>
            
            {/* Contact Form Tab */}
            <TabsContent value="contact-form" className="space-y-4 mt-6">
              {/* Filters */}
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Contacts List */}
              <div className="space-y-4">
                {filteredContacts?.map((contact: any) => (
                  <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                        <Mail className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{contact.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          From: {contact.name} ({contact.email})
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          "{contact.message?.substring(0, 100) || 'No message'}..."
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Received {format(new Date(contact.created_at), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(contact.status)}>
                        {getStatusIcon(contact.status)}
                        {contact.status}
                      </Badge>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedContact(contact)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Contact Inquiry</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Contact Details</h4>
                                <div className="space-y-2 text-sm">
                                  <p><strong>Name:</strong> {contact.name}</p>
                                  <p><strong>Email:</strong> {contact.email}</p>
                                  <p><strong>Status:</strong> {contact.status}</p>
                                  <p><strong>Received:</strong> {format(new Date(contact.created_at), 'PPpp')}</p>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Subject</h4>
                              <div className="p-3 bg-muted rounded text-sm font-medium">
                                {contact.subject}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Message</h4>
                              <div className="p-3 bg-muted rounded text-sm whitespace-pre-wrap">
                                {contact.message}
                              </div>
                            </div>

                            {contact.status === 'open' && (
                              <div className="flex gap-2">
                                <Button 
                                  onClick={() => respondToContact.mutate({
                                    contactId: contact.id
                                  })}
                                  className="flex-1"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Closed
                                </Button>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
                {(!filteredContacts || filteredContacts.length === 0) && (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Contact Inquiries</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      No customer inquiries have been submitted yet.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
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
                  <div key={conversation.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedConversation(conversation)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Conversation
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>General Conversation</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex items-center gap-4 p-3 bg-muted rounded">
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
                                    <div className="flex items-center gap-2 mb-1">
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
                  <div key={conversation.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{conversation.booking?.status}</Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedConversation(conversation)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Conversation
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Service Conversation</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4 p-3 bg-muted rounded">
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
                                    <div className="flex items-center gap-2 mb-1">
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
