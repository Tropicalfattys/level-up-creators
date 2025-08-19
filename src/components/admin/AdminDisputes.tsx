
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

export const AdminDisputes = () => {
  const { data: disputes, isLoading } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disputes')
        .select(`
          *,
          bookings (
            id,
            usdc_amount,
            status,
            services (
              title
            ),
            client:client_id (
              handle,
              email
            ),
            creator_user:creator_id (
              handle,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const statusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'resolved': return 'default';
      case 'refunded': return 'secondary';
      case 'released': return 'default';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading disputes...</div>;
  }

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
        {disputes?.map((dispute) => (
          <div key={dispute.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{dispute.bookings?.services?.title}</h3>
                  <Badge variant={statusColor(dispute.status)}>
                    {dispute.status}
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>
                    Opened by: <span className="font-medium">{dispute.opened_by}</span>
                  </div>
                  <div>
                    Client: {dispute.bookings?.client?.handle} • 
                    Creator: {dispute.bookings?.creator_user?.handle}
                  </div>
                  <div>
                    Amount: <span className="font-medium">${dispute.bookings?.usdc_amount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Opened: {new Date(dispute.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="text-right space-y-2">
                {dispute.status === 'open' && (
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="default">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Release to Creator
                    </Button>
                    <Button size="sm" variant="outline">
                      Refund Client
                    </Button>
                  </div>
                )}
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            </div>

            <div className="bg-muted p-3 rounded">
              <p className="text-sm font-medium mb-1">Dispute Reason:</p>
              <p className="text-sm">{dispute.reason}</p>
            </div>

            {dispute.resolution_note && (
              <div className="bg-green-50 p-3 rounded">
                <p className="text-sm font-medium mb-1 text-green-800">Resolution:</p>
                <p className="text-sm text-green-700">{dispute.resolution_note}</p>
                {dispute.resolved_at && (
                  <p className="text-xs text-green-600 mt-1">
                    Resolved: {new Date(dispute.resolved_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
        
        {(!disputes || disputes.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            No disputes found
          </div>
        )}
      </CardContent>
    </Card>
  );
};
