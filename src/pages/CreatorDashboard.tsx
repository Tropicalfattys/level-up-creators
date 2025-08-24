
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, Users, Star, MessageSquare, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CreatorServices } from '@/components/creator/CreatorServices';
import { BookingManagement } from '@/components/creator/BookingManagement';
import { EarningsTracker } from '@/components/creator/EarningsTracker';
import { ReferralSystem } from '@/components/referrals/ReferralSystem';
import { DirectMessageInterface } from '@/components/messaging/DirectMessageInterface';
import { UserDisputes } from '@/components/disputes/UserDisputes';

const CreatorDashboard = () => {
  const { user } = useAuth();

  const { data: creatorProfile } = useQuery({
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
    enabled: !!user?.id && user?.role === 'creator'
  });

  const { data: stats } = useQuery({
    queryKey: ['creator-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const [servicesResult, bookingsResult] = await Promise.all([
        supabase
          .from('services')
          .select('id')
          .eq('creator_id', user.id)
          .eq('active', true),
        supabase
          .from('bookings')
          .select('usdc_amount, status')
          .eq('creator_id', user.id)
      ]);

      const activeServices = servicesResult.data?.length || 0;
      const totalBookings = bookingsResult.data?.length || 0;
      const totalEarnings = bookingsResult.data?.reduce((sum, booking) => {
        if (booking.status === 'released' || booking.status === 'accepted') {
          return sum + Number(booking.usdc_amount || 0);
        }
        return sum;
      }, 0) || 0;

      return {
        activeServices,
        totalBookings,
        totalEarnings: totalEarnings * 0.85 // 85% after platform fee
      };
    },
    enabled: !!user?.id
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Creator Dashboard</h1>
            <p className="text-muted-foreground mb-6">
              Please log in to access your creator dashboard
            </p>
            <Link to="/auth">
              <Button>Login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user.role !== 'creator') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Become a Creator</h1>
            <p className="text-muted-foreground mb-6">
              You need to apply to become a creator to access this dashboard
            </p>
            <Link to="/become-creator">
              <Button>Apply Now</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Creator Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, @{user.handle}</p>
            </div>
            <div className="flex items-center gap-2">
              {creatorProfile && (
                <Badge variant={creatorProfile.tier === 'elite' ? 'default' : 'secondary'}>
                  {creatorProfile.tier} Tier
                </Badge>
              )}
              <Link to="/settings">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="booked">Booked</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Services</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.activeServices || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Services available for booking
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    All-time bookings received
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats?.totalEarnings.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">
                    After platform fees (85%)
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to="/services/new">
                    <Button className="w-full justify-start">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Service
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/creator-profile">
                      <Settings className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <EarningsTracker />
            </div>
          </TabsContent>

          <TabsContent value="services">
            <CreatorServices />
          </TabsContent>

          <TabsContent value="booked">
            <BookingManagement />
          </TabsContent>

          <TabsContent value="messages">
            <DirectMessageInterface />
          </TabsContent>

          <TabsContent value="disputes">
            <UserDisputes />
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralSystem />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CreatorDashboard;
