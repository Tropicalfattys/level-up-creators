
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Scale } from 'lucide-react';

export const AdminDisputes = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Dispute Management
        </CardTitle>
        <CardDescription>
          Resolve conflicts between clients and creators
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-12">
          <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Dispute Resolution Ready</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            The dispute resolution system is in place to handle conflicts fairly. 
            Disputes will appear here if any issues arise between clients and creators.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
