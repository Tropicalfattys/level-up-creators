
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Star, 
  Calendar,
  MessageSquare,
  BookOpen,
  Target,
  Award,
  ChevronRight,
  Plus,
  Zap,
  Trophy,
  CheckCircle,
  Package,
  Settings,
  Gift
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { UserBookings } from '@/components/bookings/UserBookings';
import { ReferralSystem } from '@/components/referrals/ReferralSystem';
import { CreatorServices } from '@/components/creator/CreatorServices';

interface DashboardStats {
  totalEarnings: number;
  activeBookings: number;
  completedServices: number;
  rating: number;
  reviewCount: number;
}

interface RecentActivity {
  id: string;
  type: 'booking' | 'message' | 'review' | 'payment';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

export default function Index() {
  const { user, userRole, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Stats Query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.id, userRole],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user?.id) {
        return {
          totalEarnings: 0,
          activeBookings: 0,
          completedServices: 0,
          rating: 0,
          reviewCount: 0
        };
      }

      if (userRole === 'creator') {
        // Creator stats
        const { data: bookings } = await supabase
          .from('bookings')
          .select('usdc_amount, status')
          .eq('creator_id', user.id);

        const { data: creator } = await supabase
          .from('creators')
          .select('rating, review_count')
          .eq('user_id', user.id)
          .single();

        const totalEarnings = bookings?.reduce((sum, booking) => 
          booking.status === 'released' ? sum + Number(booking.usdc_amount) : sum, 0) || 0;
        
        const activeBookings = bookings?.filter(b => 
          ['paid', 'in_progress', 'delivered'].includes(b.status)).length || 0;
        
        const completedServices = bookings?.filter(b => 
          ['accepted', 'released'].includes(b.status)).length || 0;

        return {
          totalEarnings,
          activeBookings,
          completedServices,
          rating: creator?.rating || 0,
          reviewCount: creator?.review_count || 0
        };
      } else {
        // Client stats
        const { data: bookings } = await supabase
          .from('bookings')
          .select('usdc_amount, status')
          .eq('client_id', user.id);

        const totalSpent = bookings?.reduce((sum, booking) => 
          sum + Number(booking.usdc_amount), 0) || 0;
        
        const activeBookings = bookings?.filter(b => 
          ['paid', 'in_progress', 'delivered'].includes(b.status)).length || 0;
        
        const completedServices = bookings?.filter(b => 
          ['accepted', 'released'].includes(b.status)).length || 0;

        return {
          totalEarnings: totalSpent,
          activeBookings,
          completedServices,
          rating: 0,
          reviewCount: 0
        };
      }
    },
    enabled: !!user?.id && !!userRole
  });

  // Recent Activity Query
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['recent-activity', user?.id, userRole],
    queryFn: async (): Promise<RecentActivity[]> => {
      if (!user?.id) return [];

      const activities: RecentActivity[] = [];

      // Get recent bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          id, status, usdc_amount, created_at, updated_at,
          services (title)
        `)
        .or(`client_id.eq.${user.id},creator_id.eq.${user.id}`)
        .order('updated_at', { ascending: false })
        .limit(5);

      bookings?.forEach(booking => {
        activities.push({
          id: booking.id,
          type: 'booking',
          title: booking.services?.title || 'Service Booking',
          description: `$${booking.usdc_amount} USDC - ${booking.status}`,
          timestamp: booking.updated_at || booking.created_at,
          status: booking.status
        });
      });

      // Get recent messages
      const { data: messages } = await supabase
        .from('messages')
        .select(`
          id, body, created_at,
          bookings (
            services (title)
          )
        `)
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(3);

      messages?.forEach(message => {
        activities.push({
          id: message.id,
          type: 'message',
          title: 'New Message',
          description: message.body.substring(0, 50) + '...',
          timestamp: message.created_at
        });
      });

      return activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 8);
    },
    enabled: !!user?.id && !!userRole
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': case 'in_progress': return 'bg-blue-500';
      case 'delivered': return 'bg-purple-500';
      case 'accepted': case 'released': return 'bg-green-500';
      case 'disputed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const StatCard = ({ icon: Icon, label, value, trend, color = "text-primary" }: {
    icon: any;
    label: string;
    value: string | number;
    trend?: string;
    color?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground mt-1">{trend}</p>
            )}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );

  const QuickActionCard = ({ icon: Icon, title, description, href, color = "text-primary" }: {
    icon: any;
    title: string;
    description: string;
    href: string;
    color?: string;
  }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg bg-primary/10`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
            <Button asChild variant="outline" size="sm">
              <Link to={href}>
                Get Started <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (statsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Determine which tabs to show based on user role
  const getTabsList = () => {
    const baseTabs = [
      { value: 'overview', label: 'Overview' },
      { value: 'bookings', label: 'My Bookings' },
    ];

    if (userRole === 'creator') {
      baseTabs.push({ value: 'creator-tools', label: 'Creator Tools' });
    }

    baseTabs.push(
      { value: 'referrals', label: 'Referrals' },
      { value: 'settings', label: 'Profile Settings' },
      { value: 'activity', label: 'Recent Activity' }
    );

    return baseTabs;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {getGreeting()}, {userProfile?.handle || 'there'}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome to your {userRole === 'creator' ? 'creator' : 'client'} dashboard
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={userRole === 'creator' ? 'default' : 'secondary'}>
              {userRole === 'creator' ? 'Creator' : 'Client'}
            </Badge>
            <Avatar>
              <AvatarImage src={userProfile?.avatar_url || ''} />
              <AvatarFallback>
                {userProfile?.handle?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          {getTabsList().map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={DollarSign}
              label={userRole === 'creator' ? 'Total Earnings' : 'Total Spent'}
              value={`$${stats?.totalEarnings?.toFixed(2) || '0.00'}`}
              color="text-green-600"
            />
            <StatCard
              icon={Package}
              label="Active Bookings"
              value={stats?.activeBookings || 0}
              color="text-blue-600"
            />
            <StatCard
              icon={CheckCircle}
              label="Completed Services"
              value={stats?.completedServices || 0}
              color="text-purple-600"
            />
            {userRole === 'creator' && (
              <StatCard
                icon={Star}
                label="Rating"
                value={`${stats?.rating?.toFixed(1) || '0.0'} (${stats?.reviewCount || 0})`}
                color="text-yellow-600"
              />
            )}
            {userRole === 'client' && (
              <StatCard
                icon={Trophy}
                label="Referral Credits"
                value={`$${userProfile?.referral_credits || 0}`}
                color="text-orange-600"
              />
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userRole === 'creator' ? (
                <>
                  <QuickActionCard
                    icon={Plus}
                    title="Create New Service"
                    description="Add a new service to your profile and start earning"
                    href="/services"
                  />
                  <QuickActionCard
                    icon={MessageSquare}
                    title="View Messages"
                    description="Check and respond to client messages"
                    href="/creator-dashboard"
                  />
                  <QuickActionCard
                    icon={TrendingUp}
                    title="Creator Dashboard"
                    description="View detailed analytics and manage your business"
                    href="/creator-dashboard"
                  />
                </>
              ) : (
                <>
                  <QuickActionCard
                    icon={BookOpen}
                    title="Browse Services"
                    description="Discover and book services from crypto experts"
                    href="/browse"
                  />
                  <QuickActionCard
                    icon={Users}
                    title="Become a Creator"
                    description="Share your expertise and start earning"
                    href="/become-creator"
                  />
                  <QuickActionCard
                    icon={Target}
                    title="Find by Category"
                    description="Explore services in specific categories"
                    href="/categories"
                  />
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <UserBookings />
        </TabsContent>

        {userRole === 'creator' && (
          <TabsContent value="creator-tools" className="space-y-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Creator Tools</h2>
                <p className="text-muted-foreground">
                  Manage your services, bookings, and creator profile
                </p>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <QuickActionCard
                  icon={Plus}
                  title="Add New Service"
                  description="Create and publish new services"
                  href="/services"
                />
                <QuickActionCard
                  icon={Package}
                  title="Manage Services"
                  description="Edit your existing services"
                  href="/services"
                />
                <QuickActionCard
                  icon={TrendingUp}
                  title="Analytics Dashboard"
                  description="View performance metrics"
                  href="/creator-dashboard"
                />
                <QuickActionCard
                  icon={MessageSquare}
                  title="Client Communications"
                  description="Manage client messages and bookings"
                  href="/creator-dashboard"
                />
                <QuickActionCard
                  icon={Settings}
                  title="Creator Profile"
                  description="Update your creator profile and settings"
                  href="/settings"
                />
                <QuickActionCard
                  icon={DollarSign}
                  title="Earnings & Payouts"
                  description="Track earnings and payout settings"
                  href="/creator-dashboard"
                />
              </div>

              <CreatorServices />
            </div>
          </TabsContent>
        )}

        <TabsContent value="referrals" className="space-y-6">
          <ReferralSystem />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <QuickActionCard
                  icon={Settings}
                  title="Account Settings"
                  description="Update your profile, email, and password"
                  href="/settings"
                />
                <QuickActionCard
                  icon={DollarSign}
                  title="Payment Settings"
                  description="Manage payout addresses and preferences"
                  href="/settings"
                />
                {userRole === 'creator' && (
                  <QuickActionCard
                    icon={Award}
                    title="Creator Profile"
                    description="Update your creator bio, portfolio, and services"
                    href="/settings"
                  />
                )}
                <QuickActionCard
                  icon={Gift}
                  title="Referral Settings"
                  description="Manage your referral code and credits"
                  href="/settings"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading recent activity...
                </div>
              ) : recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'booking' ? 'bg-blue-100' :
                        activity.type === 'message' ? 'bg-green-100' :
                        activity.type === 'review' ? 'bg-yellow-100' :
                        'bg-purple-100'
                      }`}>
                        {activity.type === 'booking' && <Package className="h-4 w-4" />}
                        {activity.type === 'message' && <MessageSquare className="h-4 w-4" />}
                        {activity.type === 'review' && <Star className="h-4 w-4" />}
                        {activity.type === 'payment' && <DollarSign className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{activity.title}</h4>
                          {activity.status && (
                            <Badge className={getStatusColor(activity.status)}>
                              {activity.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
                  <p className="text-muted-foreground">
                    Your recent bookings, messages, and updates will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Access Footer */}
      <div className="mt-12 p-6 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1">Need Help?</h3>
            <p className="text-sm text-muted-foreground">
              Contact our support team or check out our help center
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/contact">Contact Support</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/how-it-works">How It Works</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
