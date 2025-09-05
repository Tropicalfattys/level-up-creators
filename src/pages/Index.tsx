import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessagesList } from '@/components/messaging/MessagesList';
import { CreatorsFollowedCard } from '@/components/dashboard/CreatorsFollowedCard';
import { UserDisputes } from '@/components/disputes/UserDisputes';
import { ClientBookings } from '@/components/client/ClientBookings';
import { ReferralSystem } from '@/components/referrals/ReferralSystem';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { 
  DollarSign, 
  Users, 
  Star, 
  Crown, 
  TrendingUp,
  MessageSquare,
  Calendar,
  Plus,
  Clock,
  Settings,
  Copy,
  Gift,
  Share2,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useState } from 'react';

export default function Index() {
  const { user, userRole, loading } = useAuth();

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

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id
  });

  // Get referral count separately for accurate display
  const { data: referralCount } = useQuery({
    queryKey: ['referral-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by', user.id);
      
      if (error) {
        console.error('Error fetching referral count:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!user?.id
  });

  console.log('Dashboard state:', { user: !!user, userRole, creatorProfile, approved: creatorProfile?.approved });

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

  const hasCreatorProfile = !!creatorProfile;
  const isApprovedCreator = creatorProfile?.approved === true;
  const hasPendingApplication = hasCreatorProfile && !isApprovedCreator;
  const canAccessCreatorTools = isApprovedCreator || (userRole === 'creator' && hasCreatorProfile);

  const copyReferralCode = () => {
    if (userProfile?.referral_code) {
      navigator.clipboard.writeText(userProfile.referral_code);
      toast.success('Referral code copied to clipboard!');
    }
  };

  const copyReferralLink = () => {
    if (userProfile?.referral_code) {
      const referralUrl = `${window.location.origin}/auth?ref=${userProfile.referral_code}`;
      navigator.clipboard.writeText(referralUrl);
      toast.success('Referral link copied to clipboard!');
    }
  };

  const shareOnSocial = (platform: string) => {
    if (!userProfile?.referral_code) return;
    
    const referralUrl = `${window.location.origin}/auth?ref=${userProfile.referral_code}`;
    const message = "Join CryptoTalent and get access to amazing crypto services!";
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(referralUrl)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(message)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  // Prevent auto-scroll when changing tabs
  const [activeTab, setActiveTab] = useState('overview');
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Don't auto-scroll, just change the tab
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your account.
        </p>
      </div>

      {hasPendingApplication && (
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

      {isApprovedCreator && (
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Crown className="h-5 w-5" />
                  Creator Dashboard Active
                </CardTitle>
                <CardDescription className="text-green-600">
                  You're approved! Access your full creator dashboard to manage services and bookings.
                </CardDescription>
              </div>
              <Button asChild>
                <Link to="/creator-dashboard">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Creator Dashboard
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {!hasCreatorProfile && (
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="booked">Booked</TabsTrigger>
          {canAccessCreatorTools && (
            <TabsTrigger value="creator">Creator Tools</TabsTrigger>
          )}
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          {userRole === 'admin' && (
            <TabsTrigger value="admin">Admin Panel</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-[2px] bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg h-full">
              <Card className="bg-card border-0 h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profile</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userRole || 'Client'}</div>
                  <p className="text-xs text-muted-foreground">Your current role</p>
                </CardContent>
              </Card>
            </div>

            <div className="p-[2px] bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg h-full">
              <Card className="bg-card border-0 h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Referrals</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{referralCount || 0}</div>
                  <p className="text-xs text-muted-foreground">People you've referred</p>
                </CardContent>
              </Card>
            </div>

            <div className="p-[2px] bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg h-full">
              <Card className="bg-card border-0 h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Credits</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${userProfile?.referral_credits || 0}</div>
                  <p className="text-xs text-muted-foreground">Referral credits</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-[2px] bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg h-full">
              <Card className="bg-card border-0 h-full">
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
                      <Settings className="h-4 w-4 mr-2" />
                      Profile Settings
                    </Link>
                  </Button>
                  {!hasCreatorProfile && (
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link to="/become-creator">
                        <Crown className="h-4 w-4 mr-2" />
                        Become a Creator
                      </Link>
                    </Button>
                  )}
                  {canAccessCreatorTools && (
                    <Button className="w-full justify-start" asChild>
                      <Link to="/creator-dashboard">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Creator Dashboard
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="p-[2px] bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg h-full">
              <Card className="bg-card border-0 h-full">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <RecentActivity />
                </CardContent>
              </Card>
            </div>

            <CreatorsFollowedCard />
          </div>
        </TabsContent>

        <TabsContent value="booked" className="space-y-6">
          <ClientBookings />
        </TabsContent>

        {canAccessCreatorTools && (
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
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-[2px] bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg h-full">
                  <Card className="bg-card border-0 h-full">
                    <CardHeader>
                      <CardTitle>Services</CardTitle>
                      <CardDescription>Manage your service offerings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full">
                        <Link to="/services">Manage Services</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="p-[2px] bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg h-full">
                  <Card className="bg-card border-0 h-full">
                    <CardHeader>
                      <CardTitle>Bookings</CardTitle>
                      <CardDescription>Track active bookings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full">
                        <Link to="/creator-dashboard">View Bookings</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="p-[2px] bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg h-full">
                  <Card className="bg-card border-0 h-full">
                    <CardHeader>
                      <CardTitle>Earnings</CardTitle>
                      <CardDescription>Track your earnings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full">
                        <Link to="/creator-dashboard">View Earnings</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        <TabsContent value="messages" className="space-y-6">
          <MessagesList />
        </TabsContent>

        <TabsContent value="disputes" className="space-y-6">
          <UserDisputes />
        </TabsContent>

        <TabsContent value="referrals" className="space-y-6">
          <ReferralSystem />
        </TabsContent>

        {userRole === 'admin' && (
          <TabsContent value="admin">
            <div className="p-[2px] bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg h-full">
              <Card className="bg-card border-0 h-full">
                <CardHeader>
                  <CardTitle>Admin Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link to="/admin">Admin Panel</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
