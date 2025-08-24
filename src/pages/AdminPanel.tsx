
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminCreators } from '@/components/admin/AdminCreators';
import { AdminPayments } from '@/components/admin/AdminPayments';
import { AdminBookings } from '@/components/admin/AdminBookings';
import { AdminDisputes } from '@/components/admin/AdminDisputes';
import { AdminContacts } from '@/components/admin/AdminContacts';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { AdminAuditLogs } from '@/components/admin/AdminAuditLogs';
import { AdminPricing } from '@/components/admin/AdminPricing';
import { useAuth } from '@/hooks/useAuth';

export default function AdminPanel() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage platform operations and oversee all activities
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="creators">Creators</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
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

          <TabsContent value="contacts">
            <AdminContacts />
          </TabsContent>

          <TabsContent value="pricing">
            <AdminPricing />
          </TabsContent>

          <TabsContent value="audit">
            <AdminAuditLogs />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
