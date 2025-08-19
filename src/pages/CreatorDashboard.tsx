
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CreatorServices } from '@/components/creator/CreatorServices';
import { BookingManagement } from '@/components/creator/BookingManagement';
import { EarningsTracker } from '@/components/creator/EarningsTracker';
import { BarChart3, Package, Calendar, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

const CreatorDashboard = () => {
  const { user, userProfile, userRole, loading } = useAuth();

  // Check if user has an approved creator profile
  const { data: creatorProfile, isLoading: creatorLoading } = useQuery({
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

  console.log('CreatorDashboard state:', { 
    user: !!user, 
    userRole, 
    creatorProfile, 
    approved: creatorProfile?.approved,
    loading: loading || creatorLoading
  });

  // Show loading state while checking authentication
  if (loading || creatorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access the creator dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/auth">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine creator access - user must be approved creator OR have creator role with approved profile
  const hasCreatorProfile = !!creatorProfile;
  const isApprovedCreator = creatorProfile?.approved === true;
  const canAccessDashboard = isApprovedCreator && (userRole === 'creator' || userRole === 'admin');

  console.log('Access check:', { 
    hasCreatorProfile, 
    isApprovedCreator, 
    canAccessDashboard,
    userRole 
  });

  // Check if user can access creator dashboard
  if (!canAccessDashboard) {
    const hasPendingApplication = hasCreatorProfile && !isApprovedCreator;
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Creator Dashboard Access</CardTitle>
            <CardDescription>
              {!hasCreatorProfile && 'You need to apply to become a creator to access this dashboard.'}
              {hasPendingApplication && 'Your creator application is pending approval.'}
              {hasCreatorProfile && isApprovedCreator && userRole !== 'creator' && 'Your creator profile is approved but your account role needs to be updated.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasCreatorProfile && (
              <Button asChild className="w-full">
                <Link to="/become-creator">Apply to Become a Creator</Link>
              </Button>
            )}
            {hasPendingApplication && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Your application is under review. You'll be notified when it's approved.
                </p>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/">Return to Dashboard</Link>
                </Button>
              </div>
            )}
            {hasCreatorProfile && isApprovedCreator && userRole !== 'creator' && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Please contact support or refresh your session. Your role should be updated automatically.
                </p>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/">Return to Dashboard</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, @{userProfile?.handle || 'Creator'}
              </p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
              Active Creator
            </Badge>
          </div>
        </div>

        {/* Dashboard Tabs */}
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
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
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

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  Performance insights and metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Analytics Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Advanced analytics and performance metrics will be available here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CreatorDashboard;
