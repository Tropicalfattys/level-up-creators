
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, ShoppingCart, Users, Star, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CreatorsFollowedCard } from '@/components/dashboard/CreatorsFollowedCard';
import { ReferralSystem } from '@/components/referrals/ReferralSystem';
import { ClientBookings } from '@/components/client/ClientBookings';
import { DirectMessageInterface } from '@/components/messaging/DirectMessageInterface';
import { UserDisputes } from '@/components/disputes/UserDisputes';

const Index = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Welcome to Level Up Creators</h1>
            <p className="text-muted-foreground mb-6">
              Connect with crypto creators and book personalized services
            </p>
            <Link to="/auth">
              <Button>Get Started</Button>
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
          <h1 className="text-2xl font-bold">Welcome back, @{user.handle || 'User'}</h1>
          <p className="text-muted-foreground">Manage your account and bookings</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="booked">Booked</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Link to="/browse">
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="mr-2 h-4 w-4" />
                        Browse Creators
                      </Button>
                    </Link>
                    <Link to="/services">
                      <Button variant="outline" className="w-full justify-start">
                        <Star className="mr-2 h-4 w-4" />
                        Explore Services
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <CreatorsFollowedCard />

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      No recent activity
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="booked">
            <ClientBookings />
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

export default Index;
