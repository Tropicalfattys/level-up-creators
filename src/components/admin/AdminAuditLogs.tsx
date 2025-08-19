
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock } from 'lucide-react';

export const AdminAuditLogs = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Audit Logs
        </CardTitle>
        <CardDescription>
          Track important system actions and changes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Audit System Ready</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            The audit logging system has been set up and will start tracking actions 
            as users interact with the platform. Logs will appear here once activity begins.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
