
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Users, Star, Calendar, Package } from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';

interface AnalyticsData {
  totalEarnings: number;
  totalBookings: number;
  avgRating: number;
  activeServices: number;
  completionRate: number;
  monthlyEarnings: Array<{ month: string; earnings: number }>;
  servicePopularity: Array<{ service: string; bookings: number }>;
  ratingDistribution: Array<{ rating: number; count: number }>;
  recentActivity: Array<{ date: string; bookings: number; earnings: number }>;
}

export const CreatorAnalytics = () => {
  const { user } = useAuth();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['creator-analytics', user?.id],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!user) throw new Error('User not authenticated');

      // Get creator services
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, title, price_usdc')
        .eq('creator_id', user.id);

      if (servicesError) throw servicesError;

      const serviceIds = services?.map(s => s.id) || [];

      // Get bookings data
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services (title, price_usdc),
          reviews (rating)
        `)
        .in('service_id', serviceIds);

      if (bookingsError) throw bookingsError;

      // Get reviews data
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating, created_at')
        .in('service_id', serviceIds);

      if (reviewsError) throw reviewsError;

      // Calculate analytics
      const totalEarnings = bookings?.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.usdc_amount || 0), 0) || 0;
      const totalBookings = bookings?.length || 0;
      const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
      const avgRating = reviews?.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
      const activeServices = services?.filter(s => s).length || 0;
      const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

      // Monthly earnings (last 6 months)
      const monthlyEarnings = [];
      for (let i = 5; i >= 0; i--) {
        const date = subDays(new Date(), i * 30);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthBookings = bookings?.filter(b => {
          const bookingDate = new Date(b.created_at);
          return bookingDate >= monthStart && bookingDate <= monthEnd && b.status === 'completed';
        }) || [];
        
        const earnings = monthBookings.reduce((sum, b) => sum + (b.usdc_amount || 0), 0);
        
        monthlyEarnings.push({
          month: format(date, 'MMM yyyy'),
          earnings
        });
      }

      // Service popularity
      const servicePopularity = services?.map(service => {
        const serviceBookings = bookings?.filter(b => b.service_id === service.id).length || 0;
        return {
          service: service.title.length > 20 ? service.title.substring(0, 20) + '...' : service.title,
          bookings: serviceBookings
        };
      }).sort((a, b) => b.bookings - a.bookings).slice(0, 5) || [];

      // Rating distribution
      const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews?.forEach(review => {
        ratingCounts[Math.floor(review.rating) as keyof typeof ratingCounts]++;
      });
      
      const ratingDistribution = Object.entries(ratingCounts).map(([rating, count]) => ({
        rating: parseInt(rating),
        count
      }));

      // Recent activity (last 30 days)
      const recentActivity = [];
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayBookings = bookings?.filter(b => {
          const bookingDate = new Date(b.created_at);
          return format(bookingDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        }) || [];
        
        const dayEarnings = dayBookings
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (b.usdc_amount || 0), 0);
        
        recentActivity.push({
          date: format(date, 'MMM dd'),
          bookings: dayBookings.length,
          earnings: dayEarnings
        });
      }

      return {
        totalEarnings,
        totalBookings,
        avgRating,
        activeServices,
        completionRate,
        monthlyEarnings,
        servicePopularity,
        ratingDistribution,
        recentActivity
      };
    },
    enabled: !!user
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-8">No analytics data available</div>;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">${analytics.totalEarnings}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{analytics.totalBookings}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold">{analytics.avgRating.toFixed(1)}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Services</p>
                <p className="text-2xl font-bold">{analytics.activeServices}</p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{analytics.completionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="earnings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="ratings">Ratings</TabsTrigger>
        </TabsList>

        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Earnings</CardTitle>
              <CardDescription>Your earnings over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthlyEarnings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Earnings']} />
                  <Line type="monotone" dataKey="earnings" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Bookings and earnings over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.recentActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#8884d8" name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Service Popularity</CardTitle>
              <CardDescription>Most booked services</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.servicePopularity} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="service" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratings">
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
              <CardDescription>How customers rate your services</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.ratingDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ rating, count, percent }) => 
                      count > 0 ? `${rating}★ (${(percent * 100).toFixed(0)}%)` : ''
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
