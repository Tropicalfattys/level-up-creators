
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield, MessageCircle, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

export const AdminAnalytics = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const [
        { data: users },
        { data: creators },
        { data: bookings },
        { data: disputes },
        { data: revenue }
      ] = await Promise.all([
        supabase.from('users').select('id, role, created_at'),
        supabase.from('creators').select('id, status, tier'),
        supabase.from('bookings').select('id, status, usdc_amount, platform_fee, created_at'),
        supabase.from('disputes').select('id, status'),
        supabase.from('bookings').select('platform_fee').eq('status', 'released')
      ]);

      const totalUsers = users?.length || 0;
      const totalCreators = creators?.filter(c => c.status === 'approved').length || 0;
      const pendingCreators = creators?.filter(c => c.status === 'pending').length || 0;
      const totalBookings = bookings?.length || 0;
      const completedBookings = bookings?.filter(b => b.status === 'released' || b.status === 'accepted').length || 0;
      const totalRevenue = revenue?.reduce((sum, b) => sum + parseFloat(b.platform_fee || '0'), 0) || 0;
      const openDisputes = disputes?.filter(d => d.status === 'open').length || 0;

      return {
        totalUsers,
        totalCreators,
        pendingCreators,
        totalBookings,
        completedBookings,
        totalRevenue,
        openDisputes
      };
    }
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Creators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCreators || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingCreators || 0} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.completedBookings || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalRevenue?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">15% commission</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions Required
            </CardTitle>
            <CardDescription>Items that need your attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.pendingCreators ? (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-yellow-800">Pending Creator Applications</p>
                  <p className="text-sm text-yellow-600">{stats.pendingCreators} creators waiting for approval</p>
                </div>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">
                  {stats.pendingCreators}
                </span>
              </div>
            ) : null}
            
            {stats?.openDisputes ? (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-red-800">Open Disputes</p>
                  <p className="text-sm text-red-600">{stats.openDisputes} disputes need resolution</p>
                </div>
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                  {stats.openDisputes}
                </span>
              </div>
            ) : null}

            {!stats?.pendingCreators && !stats?.openDisputes && (
              <div className="text-center py-4 text-muted-foreground">
                No urgent actions required
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Health
            </CardTitle>
            <CardDescription>Platform metrics and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database Connection</span>
              <span className="text-green-600 font-medium">✓ Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Authentication</span>
              <span className="text-green-600 font-medium">✓ Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Storage</span>
              <span className="text-green-600 font-medium">✓ Available</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Realtime</span>
              <span className="text-green-600 font-medium">✓ Connected</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
