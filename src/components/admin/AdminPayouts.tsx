
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export const AdminPayouts = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payout Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4 py-8">
            <CreditCard className="h-16 w-16 mx-auto text-muted-foreground" />
            <h3 className="text-xl font-semibold">Payout Management</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Payout management functionality will be available soon. This will allow you to manage creator payouts and track payment history.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
