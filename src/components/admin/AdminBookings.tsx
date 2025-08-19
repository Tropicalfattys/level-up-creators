
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, ShoppingCart } from 'lucide-react';

export const AdminBookings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Booking Management
        </CardTitle>
        <CardDescription>
          Monitor payments, transactions, and booking lifecycle
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Booking System Ready</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            The booking management system is configured and ready to track transactions. 
            Bookings will appear here once creators start offering services and clients begin booking them.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
