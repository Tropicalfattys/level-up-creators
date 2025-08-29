
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export const AdminPayouts = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payout Management
        </CardTitle>
        <CardDescription>
          Manage creator payouts and track payment history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          Payout management functionality will be available soon. This will allow you to manage creator payouts and track payment history.
        </div>
      </CardContent>
    </Card>
  );
};
