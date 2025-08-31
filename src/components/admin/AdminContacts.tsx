
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
import { Mail, MessageSquare, Search, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export const AdminContacts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [response, setResponse] = useState('');
  const queryClient = useQueryClient();

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['admin-contacts'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('contacts' as any)
          .select(`
            *,
            responded_by_user:responded_by (
              handle
            )
          `)
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

  const respondToContact = useMutation({
    mutationFn: async ({ contactId }: { contactId: string }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('contacts' as any)
        .update({ 
          status: 'responded',
          responded_by: user.user?.id,
          responded_at: new Date().toISOString()
        })
        .eq('id', contactId);
      
      if (error) throw error;
      
      // In a real app, you'd send an email here using an edge function
      // For now, we'll just mark it as responded
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'destructive';
      case 'responded': return 'default';
      case 'closed': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock className="h-3 w-3 mr-1" />;
      case 'responded': return <CheckCircle className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

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
            Manage and respond to customer inquiries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General Messages</TabsTrigger>
              <TabsTrigger value="service">Service Messages</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4 mt-6">
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
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="responded">Responded</SelectItem>
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
                          Received {new Date(contact.created_at).toLocaleString()}
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
                            View & Respond
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
                                  <p><strong>Received:</strong> {new Date(contact.created_at).toLocaleString()}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Response Info</h4>
                                <div className="space-y-2 text-sm">
                                  {contact.responded_by_user ? (
                                    <>
                                      <p><strong>Responded By:</strong> {contact.responded_by_user?.handle || 'Admin'}</p>
                                      <p><strong>Response Date:</strong> {contact.responded_at ? new Date(contact.responded_at).toLocaleString() : 'N/A'}</p>
                                    </>
                                  ) : (
                                    <p className="text-muted-foreground">Not yet responded</p>
                                  )}
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

                            {contact.status === 'new' && (
                              <div>
                                <h4 className="font-medium mb-2">Response</h4>
                                <Textarea
                                  placeholder="Write your response here... (Note: This is a demo - in production, this would send an email)"
                                  value={response}
                                  onChange={(e) => setResponse(e.target.value)}
                                  className="mb-3"
                                  rows={4}
                                />
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={() => respondToContact.mutate({
                                      contactId: contact.id
                                    })}
                                    className="flex-1"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark as Responded
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                  In a production environment, this would automatically send an email response to the customer.
                                </p>
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
                      {statusFilter === 'all' 
                        ? "No customer inquiries have been submitted yet. The contact system is ready to receive messages."
                        : `No contacts with status "${statusFilter}" found.`}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="service" className="space-y-4 mt-6">
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Service Messages</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Service-related messages and inquiries will be displayed here.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
