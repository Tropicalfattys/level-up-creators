
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminBookings } from '@/components/admin/AdminBookings';
import { AdminPayments } from '@/components/admin/AdminPayments';
import { AdminDisputes } from '@/components/admin/AdminDisputes';
import { AdminCreators } from '@/components/admin/AdminCreators';
import { AdminContacts } from '@/components/admin/AdminContacts';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { AdminAuditLogs } from '@/components/admin/AdminAuditLogs';
import { AdminPricing } from '@/components/admin/AdminPricing';
import { ReferralTestPanel } from '@/components/admin/ReferralTestPanel';
import { AdminContactUs } from '@/components/admin/AdminContactUs';
import { AdminCareers } from '@/components/admin/AdminCareers';

export default function AdminPanel() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">Manage users, bookings, payments, and platform settings</p>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-12">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="contact-us">Contact Us</TabsTrigger>
          <TabsTrigger value="careers">Careers</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
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

        <TabsContent value="payments">
          <AdminPayments />
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

        <TabsContent value="referrals">
          <ReferralTestPanel />
        </TabsContent>

        <TabsContent value="contact-us">
          <AdminContactUs />
        </TabsContent>

        <TabsContent value="careers">
          <AdminCareers />
        </TabsContent>

        <TabsContent value="notifications">
          <div className="rounded-lg border p-6">
            <h2 className="text-2xl font-bold mb-4">Notifications Management</h2>
            <p className="text-muted-foreground">Notification management functionality will be implemented here.</p>
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <AdminAuditLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}
