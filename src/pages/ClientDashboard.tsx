
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientBookings } from '@/components/client/ClientBookings';
import { MessagesList } from '@/components/messaging/MessagesList';
import { UserDisputes } from '@/components/disputes/UserDisputes';
import { ReferralSystem } from '@/components/referrals/ReferralSystem';
import { BookOpen, MessageSquare, AlertTriangle, Users, TrendingUp } from 'lucide-react';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;

      // Fetch all bookings for stats
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_id', user.id);

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        return;
      }

      const totalBookings = bookings?.length || 0;
      const activeBookings = bookings?.filter(b => ['paid', 'in_progress', 'delivered'].includes(b.status)).length || 0;
      const completedBookings = bookings?.filter(b => ['accepted', 'released'].includes(b.status)).length || 0;
      const totalSpent = bookings?.reduce((acc, booking) => acc + (booking?.usdc_amount || 0), 0) || 0;

      setStats({
        totalBookings,
        activeBookings,
        completedBookings,
        totalSpent,
      });
    };

    fetchStats();
  }, [user?.id]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Client Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{stats.totalBookings}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
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
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completedBookings}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</p>
              </div>
              <div className="text-yellow-500">$</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="bookings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Booked
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="disputes" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Disputes
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Referrals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <ClientBookings />
        </TabsContent>

        <TabsContent value="messages">
          <MessagesList />
        </TabsContent>

        <TabsContent value="disputes">
          <UserDisputes />
        </TabsContent>

        <TabsContent value="referrals">
          <ReferralSystem />
        </TabsContent>
      </Tabs>
    </div>
  );
}
