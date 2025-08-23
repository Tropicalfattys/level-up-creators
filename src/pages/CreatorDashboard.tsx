
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreatorServices } from '@/components/creator/CreatorServices';
import { BookingManagement } from '@/components/creator/BookingManagement';
import { EarningsTracker } from '@/components/creator/EarningsTracker';
import { MessagesList } from '@/components/messaging/MessagesList';
import { Package, Calendar, DollarSign, RefreshCw, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CreatorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeServices: 0,
    activeBookings: 0,
    totalEarnings: 0,
  });

  const { data: creator } = useQuery({
    queryKey: ['creator-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching creator profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;

      // Fetch active services count
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*', { count: 'exact' })
        .eq('creator_id', user.id)
        .eq('active', true);

      if (servicesError) {
        console.error('Error fetching active services:', servicesError);
        return;
      }

      // Fetch active bookings count
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact' })
        .eq('creator_id', user.id)
        .in('status', ['paid', 'in_progress', 'delivered']);

      if (bookingsError) {
        console.error('Error fetching active bookings:', bookingsError);
        return;
      }

      // Fetch total earnings - using usdc_amount since creator_amount doesn't exist
      const { data: earnings, error: earningsError } = await supabase
        .from('bookings')
        .select('usdc_amount')
        .eq('creator_id', user.id)
        .in('status', ['accepted', 'released']);

      if (earningsError) {
        console.error('Error fetching earnings:', earningsError);
        return;
      }

      // Calculate 85% of total earnings (platform takes 15%)
      const totalGross = earnings?.reduce((acc, booking) => acc + (booking?.usdc_amount || 0), 0) || 0;
      const totalEarnings = totalGross * 0.85;

      setStats({
        activeServices: services?.length || 0,
        activeBookings: bookings?.length || 0,
        totalEarnings: totalEarnings,
      });
    };

    fetchStats();
  }, [user?.id]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Creator Application Status */}
      {!creator ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Complete Your Creator Profile</h2>
              <p className="text-muted-foreground">
                Join our platform as a creator and start offering your services to clients.
              </p>
              <Link to="/become-creator">
                <Button size="lg">
                  Complete Creator Application
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : !creator.approved ? (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-8 w-8 text-yellow-600 animate-spin" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">
                  Application Under Review
                </h3>
                <p className="text-yellow-700">
                  Your creator application is being reviewed by our team. You'll receive an email once approved.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Creator Stats Overview */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Services</p>
                    <p className="text-2xl font-bold">{stats.activeServices}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Bookings</p>
                    <p className="text-2xl font-bold">{stats.activeBookings}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                    <p className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rating</p>
                    <p className="text-2xl font-bold">{creator.rating.toFixed(1)}</p>
                  </div>
                  <div className="text-yellow-500">★</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dashboard Tabs - Using the exact same components as main dashboard */}
          <Tabs defaultValue="services" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="services" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Services
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Bookings
              </TabsTrigger>
              <TabsTrigger value="earnings" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Earnings
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages
              </TabsTrigger>
            </TabsList>

            <TabsContent value="services">
              <CreatorServices />
            </TabsContent>

            <TabsContent value="bookings">
              <BookingManagement />
            </TabsContent>

            <TabsContent value="earnings">
              <EarningsTracker />
            </TabsContent>

            <TabsContent value="messages">
              <MessagesList />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
