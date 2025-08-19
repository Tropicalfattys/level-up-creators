
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Search, MessageCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export const AdminContacts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['admin-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const updateContactStatus = useMutation({
    mutationFn: async ({ contactId, status }: { contactId: string; status: string }) => {
      const resolvedAt = status === 'resolved' ? new Date().toISOString() : null;
      
      const { error } = await supabase
        .from('contacts')
        .update({ 
          status, 
          resolved_at: resolvedAt
        })
        .eq('id', contactId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      toast.success('Contact status updated');
    },
    onError: () => {
      toast.error('Failed to update contact status');
    }
  });

  const filteredContacts = contacts?.filter(contact => {
    const matchesSearch = !searchTerm || 
      contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'resolved': return 'default';
      case 'spam': return 'outline';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading contacts...</div>;
  }

  return (
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
      <CardContent className="space-y-4">
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
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="spam">Spam</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contacts List */}
        <div className="space-y-4">
          {filteredContacts?.map((contact) => (
            <div key={contact.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{contact.subject}</h3>
                    <Badge variant={statusColor(contact.status)}>
                      {contact.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    From: {contact.name} ({contact.email})
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(contact.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {contact.status === 'open' && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => updateContactStatus.mutate({ 
                          contactId: contact.id, 
                          status: 'resolved' 
                        })}
                        disabled={updateContactStatus.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Resolved
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateContactStatus.mutate({ 
                          contactId: contact.id, 
                          status: 'spam' 
                        })}
                        disabled={updateContactStatus.isPending}
                      >
                        Mark Spam
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                </div>
              </div>

              <div className="bg-muted p-3 rounded">
                <p className="text-sm">{contact.message}</p>
              </div>
            </div>
          ))}
          
          {(!filteredContacts || filteredContacts.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No contact inquiries found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
