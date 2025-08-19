
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

export const AdminPricing = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing Management
          </CardTitle>
          <CardDescription>
            Manage platform pricing, fees, and payment configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Pricing Configuration</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Configure platform fees, creator pricing, subscription rates, and payment processing settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
