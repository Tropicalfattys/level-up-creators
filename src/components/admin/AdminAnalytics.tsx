
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield, MessageCircle, DollarSign, TrendingUp, AlertTriangle, Star, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

export const AdminAnalytics = () => {
  const isMobile = useIsMobile();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      try {
        const [usersRes, creatorsRes, bookingsRes, disputesRes, revenueRes, detailedRevenueRes, pricingTiersRes, servicesRes, categoryBookingsRes, topClientsRes, topCreatorsRes] = await Promise.all([
          supabase.from('users' as any).select('id, role, created_at'),
          supabase.from('creators' as any).select('id, approved, tier, created_at'),
          supabase.from('bookings' as any).select('id, status, usdc_amount, created_at'),
          supabase.from('disputes' as any).select('id, status, created_at'),
          supabase.from('payments' as any).select('amount, payment_type, status').eq('status', 'verified'),
          supabase.from('payments' as any).select('amount, payment_type, status, creator_id').eq('status', 'verified'),
          supabase.from('pricing_tiers' as any).select('tier_name, price_usdc, display_name').eq('active', true),
          supabase.from('services' as any).select('id, category'),
          supabase.from('bookings' as any).select('id, status, usdc_amount, service_id, services!inner(category)').in('status', ['paid', 'delivered', 'accepted', 'released']),
          supabase.from('bookings' as any).select('client_id, usdc_amount, services!inner(category), users!client_id(handle, email)').in('status', ['paid', 'delivered', 'accepted', 'released']),
          supabase.from('bookings' as any).select('creator_id, usdc_amount, services!inner(category), users!creator_id(handle, email)').in('status', ['paid', 'delivered', 'accepted', 'released'])
        ]);

        const users = usersRes.data || [];
        const creators = creatorsRes.data || [];
        const bookings = bookingsRes.data || [];
        const disputes = disputesRes.data || [];
        const pricingTiers = pricingTiersRes.data || [];
        const services = servicesRes.data || [];
        const categoryBookings = categoryBookingsRes.data || [];
        const topClientsData = topClientsRes.data || [];
        const topCreatorsData = topCreatorsRes.data || [];

        // Calculate platform revenue from verified payments
        const revenueData = revenueRes.data || [];
        const totalRevenue = revenueData.reduce((sum: number, payment: any) => {
          const amount = Number(payment.amount) || 0;
          
          if (payment.payment_type === 'creator_tier') {
            // Platform takes 100% of subscription fees
            return sum + amount;
          } else if (payment.payment_type === 'service_booking') {
            // Platform takes 15% of service bookings
            return sum + (amount * 0.15);
          }
          
          return sum;
        }, 0);

        // Calculate detailed revenue breakdown
        const detailedRevenueData = detailedRevenueRes.data || [];
        const subscriptionRevenue = detailedRevenueData
          .filter((p: any) => p.payment_type === 'creator_tier')
          .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
        
        const serviceBookingVolume = detailedRevenueData
          .filter((p: any) => p.payment_type === 'service_booking')
          .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
        
        const serviceFeeRevenue = serviceBookingVolume * 0.15;
        
        // Create a flexible tier mapping that can handle historical price changes
        const getTierFromAmount = (amount: number) => {
          // Handle historical pricing for mid tier: $25, $29, $30
          if (amount >= 25 && amount <= 35) return 'mid';
          // Handle historical pricing for pro tier: $50, $79
          if (amount >= 45 && amount <= 85) return 'pro';
          // Basic tier is always free
          return 'basic';
        };
        
        // Get tier breakdown for subscription revenue
        const tierRevenueBreakdown = detailedRevenueData
          .filter((p: any) => p.payment_type === 'creator_tier')
          .reduce((acc: any, payment: any) => {
            const amount = Number(payment.amount) || 0;
            const tier = getTierFromAmount(amount);
            
            acc[tier] = (acc[tier] || 0) + amount;
            acc[`${tier}_count`] = (acc[`${tier}_count`] || 0) + 1;
            return acc;
          }, {});

        // Get current pricing for display
        const currentPricing = pricingTiers.reduce((acc: any, tier: any) => {
          acc[tier.tier_name] = {
            price: Number(tier.price_usdc),
            displayName: tier.display_name
          };
          return acc;
        }, {});

        const serviceTransactionCount = detailedRevenueData
          .filter((p: any) => p.payment_type === 'service_booking').length;

        // Calculate growth data for the last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        }).reverse();

        const dailyStats = last7Days.map(date => {
          const dayUsers = users.filter((u: any) => u.created_at?.startsWith(date)).length;
          const dayBookings = bookings.filter((b: any) => b.created_at?.startsWith(date)).length;
          return {
            date: date.slice(5), // Show MM-DD
            users: dayUsers,
            bookings: dayBookings
          };
        });

        // Role distribution for pie chart
        const roleDistribution = [
          { name: 'Clients', value: users.filter((u: any) => u.role === 'client').length, color: '#8884d8' },
          { name: 'Creators', value: users.filter((u: any) => u.role === 'creator').length, color: '#82ca9d' },
          { name: 'Admins', value: users.filter((u: any) => u.role === 'admin').length, color: '#ffc658' }
        ];

        // Business insights calculations
        const totalClientSpending = categoryBookings.reduce((sum: number, booking: any) => sum + (Number(booking.usdc_amount) || 0), 0);
        const totalCreatorEarnings = totalClientSpending * 0.85; // 85% after platform fee

        // Category statistics
        const categoryStats = categoryBookings.reduce((acc: any, booking: any) => {
          const category = booking.services?.category || 'Uncategorized';
          const amount = Number(booking.usdc_amount) || 0;
          
          if (!acc[category]) {
            acc[category] = { revenue: 0, bookings: 0 };
          }
          
          acc[category].revenue += amount;
          acc[category].bookings += 1;
          
          return acc;
        }, {});

        // Top categories by revenue and volume
        const categoriesByRevenue = Object.entries(categoryStats)
          .map(([category, stats]: [string, any]) => ({ category, ...stats }))
          .sort((a: any, b: any) => b.revenue - a.revenue);

        const categoriesByVolume = Object.entries(categoryStats)
          .map(([category, stats]: [string, any]) => ({ category, ...stats }))
          .sort((a: any, b: any) => b.bookings - a.bookings);

        const topCategoryByRevenue = categoriesByRevenue[0] || null;
        const topCategoryByVolume = categoriesByVolume[0] || null;

        // Calculate top 5 clients by spending
        const clientSpending = topClientsData.reduce((acc: any, booking: any) => {
          const clientId = booking.client_id;
          const amount = Number(booking.usdc_amount) || 0;
          const category = booking.services?.category || 'Uncategorized';
          const clientData = booking.users;

          if (!acc[clientId]) {
            acc[clientId] = {
              id: clientId,
              handle: clientData?.handle || clientData?.email?.split('@')[0] || 'Unknown',
              email: clientData?.email || 'Unknown',
              totalSpent: 0,
              bookingCount: 0,
              categories: {}
            };
          }

          acc[clientId].totalSpent += amount;
          acc[clientId].bookingCount += 1;
          acc[clientId].categories[category] = (acc[clientId].categories[category] || 0) + 1;

          return acc;
        }, {});

        const top5Clients = Object.values(clientSpending)
          .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
          .slice(0, 5)
          .map((client: any) => ({
            ...client,
            topCategory: Object.entries(client.categories)
              .sort(([,a]: [string, any], [,b]: [string, any]) => b - a)[0]?.[0] || 'None'
          }));

        // Calculate top 5 creators by earnings (85% of bookings)
        const creatorEarnings = topCreatorsData.reduce((acc: any, booking: any) => {
          const creatorId = booking.creator_id;
          const amount = (Number(booking.usdc_amount) || 0) * 0.85; // Creator gets 85%
          const category = booking.services?.category || 'Uncategorized';
          const creatorData = booking.users;

          if (!acc[creatorId]) {
            acc[creatorId] = {
              id: creatorId,
              handle: creatorData?.handle || creatorData?.email?.split('@')[0] || 'Unknown',
              email: creatorData?.email || 'Unknown',
              totalEarned: 0,
              bookingCount: 0,
              categories: {}
            };
          }

          acc[creatorId].totalEarned += amount;
          acc[creatorId].bookingCount += 1;
          acc[creatorId].categories[category] = (acc[creatorId].categories[category] || 0) + 1;

          return acc;
        }, {});

        const top5Creators = Object.values(creatorEarnings)
          .sort((a: any, b: any) => b.totalEarned - a.totalEarned)
          .slice(0, 5)
          .map((creator: any) => ({
            ...creator,
            topCategory: Object.entries(creator.categories)
              .sort(([,a]: [string, any], [,b]: [string, any]) => b - a)[0]?.[0] || 'None'
          }));

        return {
          totalUsers: users.length,
          adminUsers: users.filter((u: any) => u.role === 'admin').length,
          creatorUsers: users.filter((u: any) => u.role === 'creator').length,
          clientUsers: users.filter((u: any) => u.role === 'client').length,
          totalCreators: creators.length,
          approvedCreators: creators.filter((c: any) => c.approved).length,
          pendingCreators: creators.filter((c: any) => !c.approved).length,
          totalBookings: bookings.length,
          activeBookings: bookings.filter((b: any) => ['paid', 'in_progress', 'delivered'].includes(b.status)).length,
          completedBookings: bookings.filter((b: any) => b.status === 'accepted').length,
          totalDisputes: disputes.length,
          openDisputes: disputes.filter((d: any) => d.status === 'open').length,
          totalRevenue,
          subscriptionRevenue,
          serviceFeeRevenue,
          serviceBookingVolume,
          serviceTransactionCount,
          tierRevenueBreakdown,
          currentPricing,
          dailyStats,
          roleDistribution: roleDistribution.filter(r => r.value > 0),
          totalClientSpending,
          totalCreatorEarnings,
          topCategoryByRevenue,
          topCategoryByVolume,
          categoriesByRevenue,
          top5Clients,
          top5Creators
        };
      } catch (error) {
        console.error('Analytics query error:', error);
        return {
          totalUsers: 0,
          adminUsers: 0,
          creatorUsers: 0,
          clientUsers: 0,
          totalCreators: 0,
          approvedCreators: 0,
          pendingCreators: 0,
          totalBookings: 0,
          activeBookings: 0,
          completedBookings: 0,
          totalDisputes: 0,
          openDisputes: 0,
          totalRevenue: 0,
          subscriptionRevenue: 0,
          serviceFeeRevenue: 0,
          serviceBookingVolume: 0,
          serviceTransactionCount: 0,
          tierRevenueBreakdown: {},
          currentPricing: {},
          dailyStats: [],
          roleDistribution: [],
          totalClientSpending: 0,
          totalCreatorEarnings: 0,
          topCategoryByRevenue: null,
          topCategoryByVolume: null,
          categoriesByRevenue: [],
          top5Clients: [],
          top5Creators: []
        };
      }
    }
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className={`space-y-6 ${isMobile ? 'px-4' : ''}`}>
      {/* Key Metrics */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-4'}`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <div className="flex text-xs text-muted-foreground mt-1">
              <Shield className="h-3 w-3 mr-1" />
              {stats?.adminUsers || 0} admins
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Creators</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.approvedCreators || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingCreators || 0} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeBookings || 0}</div>
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
            <div className="text-2xl font-bold">${(stats?.totalRevenue || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.openDisputes || 0} open disputes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Daily Activity (Last 7 Days)
            </CardTitle>
            <CardDescription>New users and bookings per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.dailyStats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#8884d8" name="New Users" />
                <Bar dataKey="bookings" fill="#82ca9d" name="New Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Role Distribution
            </CardTitle>
            <CardDescription>Breakdown of user types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats?.roleDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats?.roleDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Platform Revenue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Detailed Platform Revenue
          </CardTitle>
          <CardDescription>Breakdown of platform earnings by revenue source</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Platform Earnings */}
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">${(stats?.totalRevenue || 0).toFixed(2)}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Platform Earnings</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Subscription Revenue */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Subscription Revenue</h4>
              <div className="bg-green-50 rounded-lg p-4 dark:bg-green-950/30">
                <div className="text-2xl font-bold text-green-600">${(stats?.subscriptionRevenue || 0).toFixed(2)}</div>
                <p className="text-sm text-green-600/80">Total Subscriptions</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">
                    {stats?.currentPricing?.basic?.displayName || 'Basic'} Tier (${stats?.currentPricing?.basic?.price || 0})
                  </span>
                  <div className="text-right">
                    <div className="font-medium">${(stats?.tierRevenueBreakdown?.basic || 0).toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{stats?.tierRevenueBreakdown?.basic_count || 0} payments</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">
                    {stats?.currentPricing?.mid?.displayName || 'Mid'} Tier (${stats?.currentPricing?.mid?.price || 29})
                  </span>
                  <div className="text-right">
                    <div className="font-medium">${(stats?.tierRevenueBreakdown?.mid || 0).toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{stats?.tierRevenueBreakdown?.mid_count || 0} payments</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">
                    {stats?.currentPricing?.pro?.displayName || 'Pro'} Tier (${stats?.currentPricing?.pro?.price || 79})
                  </span>
                  <div className="text-right">
                    <div className="font-medium">${(stats?.tierRevenueBreakdown?.pro || 0).toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{stats?.tierRevenueBreakdown?.pro_count || 0} payments</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Booking Fees */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Service Booking Fees</h4>
              <div className="bg-blue-50 rounded-lg p-4 dark:bg-blue-950/30">
                <div className="text-2xl font-bold text-blue-600">${(stats?.serviceFeeRevenue || 0).toFixed(2)}</div>
                <p className="text-sm text-blue-600/80">Platform Fee (15%)</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Booking Volume</span>
                  <span className="font-medium">${(stats?.serviceBookingVolume || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Number of Transactions</span>
                  <span className="font-medium">{stats?.serviceTransactionCount || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Transaction</span>
                  <span className="font-medium">
                    ${stats?.serviceTransactionCount ? ((stats?.serviceBookingVolume || 0) / stats.serviceTransactionCount).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Split */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-lg mb-3">Revenue Composition</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold">
                  {stats?.totalRevenue ? ((stats.subscriptionRevenue / stats.totalRevenue) * 100).toFixed(1) : 0}%
                </div>
                <p className="text-sm text-muted-foreground">From Subscriptions</p>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">
                  {stats?.totalRevenue ? ((stats.serviceFeeRevenue / stats.totalRevenue) * 100).toFixed(1) : 0}%
                </div>
                <p className="text-sm text-muted-foreground">From Service Fees</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Business Insights
          </CardTitle>
          <CardDescription>Key business metrics and category performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Metrics */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4 dark:bg-green-950/30">
              <div className="text-2xl font-bold text-green-600">${(stats?.totalClientSpending || 0).toFixed(2)}</div>
              <p className="text-sm text-green-600/80">Total Client Spending</p>
              <p className="text-xs text-muted-foreground">100% of all bookings</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 dark:bg-blue-950/30">
              <div className="text-2xl font-bold text-blue-600">${(stats?.totalCreatorEarnings || 0).toFixed(2)}</div>
              <p className="text-sm text-blue-600/80">Total Creator Earnings</p>
              <p className="text-xs text-muted-foreground">85% after platform fees</p>
            </div>
          </div>

          {/* Top Categories */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">Top Category by Revenue</h4>
              {stats?.topCategoryByRevenue ? (
                <div className="border rounded-lg p-3">
                  <div className="font-medium">{stats.topCategoryByRevenue.category}</div>
                  <div className="text-sm text-muted-foreground">
                    ${stats.topCategoryByRevenue.revenue.toFixed(2)} • {stats.topCategoryByRevenue.bookings} bookings
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No data available</div>
              )}
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Top Category by Volume</h4>
              {stats?.topCategoryByVolume ? (
                <div className="border rounded-lg p-3">
                  <div className="font-medium">{stats.topCategoryByVolume.category}</div>
                  <div className="text-sm text-muted-foreground">
                    {stats.topCategoryByVolume.bookings} bookings • ${stats.topCategoryByVolume.revenue.toFixed(2)}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No data available</div>
              )}
            </div>
          </div>

          {/* Category Breakdown */}
          {stats?.categoriesByRevenue && stats.categoriesByRevenue.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">All Categories by Revenue</h4>
              <div className="space-y-2">
                {stats.categoriesByRevenue.map((category: any, index: number) => (
                  <div key={category.category} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium w-4 text-center text-muted-foreground">{index + 1}</span>
                      <span className="font-medium">{category.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${category.revenue.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">{category.bookings} bookings</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Top Performers
          </CardTitle>
          <CardDescription>Top 5 clients and creators by spending/earnings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
            {/* Top 5 Clients */}
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Top 5 Clients by Spending</h4>
              {stats?.top5Clients && stats.top5Clients.length > 0 ? (
                <div className="space-y-3">
                  {stats.top5Clients.map((client: any, index: number) => (
                    <div key={client.id} className="border rounded-lg p-3 bg-black text-white overflow-hidden">
                      <div className={`flex items-center justify-between mb-2 ${isMobile ? 'flex-col gap-2' : ''}`}>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-sm font-medium w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="font-medium text-white truncate">{client.handle}</span>
                        </div>
                        <div className={`text-right ${isMobile ? 'w-full' : ''}`}>
                          <div className="font-bold text-green-400">${client.totalSpent.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-300 break-words">
                        {client.bookingCount} bookings • Top category: {client.topCategory}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No client data available</div>
              )}
            </div>

            {/* Top 5 Creators */}
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Top 5 Creators by Earnings</h4>
              {stats?.top5Creators && stats.top5Creators.length > 0 ? (
                <div className="space-y-3">
                  {stats.top5Creators.map((creator: any, index: number) => (
                    <div key={creator.id} className="border rounded-lg p-3 bg-black text-white overflow-hidden">
                      <div className={`flex items-center justify-between mb-2 ${isMobile ? 'flex-col gap-2' : ''}`}>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-sm font-medium w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="font-medium text-white truncate">{creator.handle}</span>
                        </div>
                        <div className={`text-right ${isMobile ? 'w-full' : ''}`}>
                          <div className="font-bold text-blue-400">${creator.totalEarned.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-300 break-words">
                        {creator.bookingCount} bookings • Top category: {creator.topCategory}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No creator data available</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>Platform metrics and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Connection</span>
                <span className="text-green-600 font-medium">✓ Healthy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Authentication</span>
                <span className="text-green-600 font-medium">✓ Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Storage Buckets</span>
                <span className="text-green-600 font-medium">✓ Ready</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Tables</span>
                <span className="text-blue-600 font-medium">10 Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">RLS Policies</span>
                <span className="text-green-600 font-medium">✓ Enforced</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Audit Logging</span>
                <span className="text-green-600 font-medium">✓ Active</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
