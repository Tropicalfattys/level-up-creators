
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminCreators } from '@/components/admin/AdminCreators';
import { AdminBookings } from '@/components/admin/AdminBookings';
import { AdminDisputes } from '@/components/admin/AdminDisputes';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { AdminContacts } from '@/components/admin/AdminContacts';
import { AdminAuditLogs } from '@/components/admin/AdminAuditLogs';
import { AdminPricing } from '@/components/admin/AdminPricing';

export default function AdminPanel() {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin panel.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage users, creators, bookings, disputes, and platform operations
        </p>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
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

        <TabsContent value="bookings">
          <AdminBookings />
        </TabsContent>

        <TabsContent value="disputes">
          <AdminDisputes />
        </TabsContent>

        <TabsContent value="contacts">
          <AdminContacts />
        </TabsContent>

        <TabsContent value="audit">
          <AdminAuditLogs />
        </TabsContent>

        <TabsContent value="pricing">
          <AdminPricing />
        </TabsContent>
      </Tabs>
    </div>
  );
}
