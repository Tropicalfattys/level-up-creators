
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Users, 
  Star, 
  Crown, 
  TrendingUp,
  MessageSquare,
  Calendar,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Index() {
  const { user, userRole, loading } = useAuth();

  // Check if user has a creator profile
  const { data: creatorProfile } = useQuery({
    queryKey: ['creator-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching creator profile:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to CryptoTalent</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to access your dashboard
          </p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your account.
        </p>
      </div>

      {/* Creator Application CTA */}
      {!creatorProfile && userRole !== 'admin' && (
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Become a Creator
                </CardTitle>
                <CardDescription>
                  Start earning by offering your expertise to the crypto community
                </CardDescription>
              </div>
              <Button asChild>
                <Link to="/become-creator">
                  <Plus className="h-4 w-4 mr-2" />
                  Apply Now
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Creator Application Status */}
      {creatorProfile && !creatorProfile.approved && (
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Clock className="h-5 w-5" />
              Creator Application Pending
            </CardTitle>
            <CardDescription className="text-orange-600">
              Your creator application is under review. We'll notify you within 3 business days.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {userRole === 'creator' && creatorProfile?.approved && (
            <TabsTrigger value="creator">Creator Tools</TabsTrigger>
          )}
          {userRole === 'admin' && (
            <TabsTrigger value="admin">Admin Panel</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profile</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userRole || 'Client'}</div>
                <p className="text-xs text-muted-foreground">Your current role</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activity</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Recent bookings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$0.00</div>
                <p className="text-xs text-muted-foreground">Total earned</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/browse">
                    <Star className="h-4 w-4 mr-2" />
                    Browse Services
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/settings">
                    <Users className="h-4 w-4 mr-2" />
                    Profile Settings
                  </Link>
                </Button>
                {!creatorProfile && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/become-creator">
                      <Crown className="h-4 w-4 mr-2" />
                      Become a Creator
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  No recent activity to show
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {userRole === 'creator' && creatorProfile?.approved && (
          <TabsContent value="creator">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Creator Tools</h2>
                <Button asChild>
                  <Link to="/creator-dashboard">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Full Dashboard
                  </Link>
                </Button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link to="/services">Manage Services</Link>
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Bookings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link to="/creator-dashboard">View Bookings</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        )}

        {userRole === 'admin' && (
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Admin Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to="/admin">Admin Panel</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
