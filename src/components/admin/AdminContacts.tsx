
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MessageSquare } from 'lucide-react';

export const AdminContacts = () => {
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
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Contact System Ready</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            The contact management system is ready to handle customer inquiries. 
            Messages will appear here once users start submitting contact forms.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
