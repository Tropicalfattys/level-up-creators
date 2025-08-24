
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminCreators } from '@/components/admin/AdminCreators';
import { AdminPayments } from '@/components/admin/AdminPayments';
import { AdminBookings } from '@/components/admin/AdminBookings';
import { AdminDisputes } from '@/components/admin/AdminDisputes';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { AdminContacts } from '@/components/admin/AdminContacts';
import { AdminPricing } from '@/components/admin/AdminPricing';
import { Shield, Users, UserCheck, CreditCard, Calendar, AlertTriangle, BarChart3, MessageSquare, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Check if user is admin
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">Please sign in to access the admin panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your platform users, creators, payments, and more.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="creators" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Creators</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Bookings</span>
          </TabsTrigger>
          <TabsTrigger value="disputes" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Disputes</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Contacts</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Pricing</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AdminAnalytics />
        </TabsContent>

        <TabsContent value="users">
          <AdminUsers />
        </TabsContent>

        <TabsContent value="creators">
          <AdminCreators />
        </TabsContent>

        <TabsContent value="payments">
          <AdminPayments />
        </TabsContent>

        <TabsContent value="bookings">
          <AdminBookings />
        </TabsContent>

        <TabsContent value="disputes">
          <AdminDisputes />
        </TabsContent>

        <TabsContent value="analytics">
          <AdminAnalytics />
        </TabsContent>

        <TabsContent value="contacts">
          <AdminContacts />
        </TabsContent>

        <TabsContent value="pricing">
          <AdminPricing />
        </TabsContent>
      </Tabs>
    </div>
  );
}
