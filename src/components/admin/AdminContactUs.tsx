
import { useQuery } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Mail, Calendar, User } from 'lucide-react';

export const AdminContactUs = () => {
  const isMobile = useIsMobile();
  const { data: contactMessages, isLoading } = useQuery({
    queryKey: ['admin-contact-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Contact Messages</h2>
          <p className="text-muted-foreground">Loading contact form submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Contact Messages</h2>
        <p className="text-muted-foreground">
          Messages submitted through the contact form on the website.
        </p>
      </div>

      {contactMessages && contactMessages.length > 0 ? (
        <div className="space-y-4">
          {contactMessages.map((message) => (
            <Card key={message.id}>
              <CardHeader>
                <div className={isMobile ? 'space-y-3' : 'flex justify-between items-start'}>
                  <div className="space-y-1">
                    <CardTitle className="text-lg break-words">{message.subject}</CardTitle>
                    <div className={isMobile ? 'space-y-2' : 'flex items-center gap-4 text-sm text-muted-foreground'}>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span className="break-words">{message.name}</span>
                        {!isMobile && (
                          <>
                            <Calendar className="h-4 w-4 ml-3" />
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="break-words">{message.email}</span>
                      </div>
                      {isMobile && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </div>
                          <Badge variant={message.status === 'open' ? 'default' : 'secondary'}>
                            {message.status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  {!isMobile && (
                    <Badge variant={message.status === 'open' ? 'default' : 'secondary'}>
                      {message.status}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{message.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No contact messages found.</p>
              <p className="text-sm mt-2">Messages submitted through the contact form will appear here.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
