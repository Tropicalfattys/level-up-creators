
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users } from 'lucide-react';

export const AdminCreators = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Creator Management
        </CardTitle>
        <CardDescription>
          Approve, reject, and manage creator applications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Creator System Ready</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            The creator management system is set up and ready. 
            Creator applications will appear here once users start applying to become creators.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
