
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Clock, Download } from 'lucide-react';
import { format } from 'date-fns';

interface EarningsData {
  totalEarnings: number;
  monthlyEarnings: number;
  pendingEarnings: number;
  completedBookings: number;
  recentEarnings: {
    id: string;
    amount: number;
    service_title: string;
    client_handle: string;
    completed_at: string;
    status: string;
  }[];
}

export const EarningsTracker = () => {
  const { user } = useAuth();

  const { data: earnings, isLoading } = useQuery({
    queryKey: ['creator-earnings', user?.id],
    queryFn: async (): Promise<EarningsData> => {
      if (!user) return {
        totalEarnings: 0,
        monthlyEarnings: 0,
        pendingEarnings: 0,
        completedBookings: 0,
        recentEarnings: []
      };

      // Get all bookings for the creator
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (title),
          client:users!bookings_client_id_fkey (handle)
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Calculate total earnings from completed bookings
      const completedBookings = bookings?.filter(b => ['accepted', 'released'].includes(b.status)) || [];
      const totalEarnings = completedBookings.reduce((sum, b) => sum + Number(b.usdc_amount || 0), 0);

      // Calculate this month's earnings
      const monthlyEarnings = completedBookings
        .filter(b => new Date(b.accepted_at || b.created_at) >= thisMonth)
        .reduce((sum, b) => sum + Number(b.usdc_amount || 0), 0);

      // Calculate pending earnings from active bookings
      const pendingEarnings = bookings
        ?.filter(b => ['paid', 'in_progress', 'delivered'].includes(b.status))
        ?.reduce((sum, b) => sum + Number(b.usdc_amount || 0), 0) || 0;

      const completedBookingsCount = completedBookings.length;

      // Get recent earnings for display
      const recentEarnings = completedBookings
        .slice(0, 5)
        .map(b => ({
          id: b.id,
          amount: Number(b.usdc_amount || 0),
          service_title: b.services?.title || 'Unknown Service',
          client_handle: b.client?.handle || 'Unknown',
          completed_at: b.accepted_at || b.created_at,
          status: b.status
        }));

      return {
        totalEarnings,
        monthlyEarnings,
        pendingEarnings,
        completedBookings: completedBookingsCount,
        recentEarnings
      };
    },
    enabled: !!user
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading earnings data...</div>;
  }

  if (!earnings) return null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Earnings Overview</h3>
        <p className="text-muted-foreground">
          Track your earnings and payout history
        </p>
      </div>

      {/* Earnings Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Total Earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earnings.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {earnings.completedBookings} completed bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              This Month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earnings.monthlyEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Current month earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Pending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earnings.pendingEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              In progress bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" variant="outline" className="w-full">
              <Download className="h-3 w-3 mr-1" />
              Export Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Earnings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Earnings</CardTitle>
          <CardDescription>Your latest completed bookings</CardDescription>
        </CardHeader>
        <CardContent>
          {earnings.recentEarnings.length > 0 ? (
            <div className="space-y-3">
              {earnings.recentEarnings.map((earning) => (
                <div key={earning.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{earning.service_title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Client: @{earning.client_handle} • {format(new Date(earning.completed_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${earning.amount.toFixed(2)} USDC</div>
                    <Badge variant="outline" className="text-xs">
                      {earning.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No completed bookings yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
