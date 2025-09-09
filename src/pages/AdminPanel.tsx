import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
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
import { AdminNotifications } from '@/components/admin/AdminNotifications';

export default function AdminPanel() {
  const [selectedTab, setSelectedTab] = useState("analytics");
  const isMobile = useIsMobile();

  const tabOptions = [
    { value: "analytics", label: "Analytics" },
    { value: "users", label: "Users" },
    { value: "creators", label: "Creators" },
    { value: "bookings", label: "Bookings" },
    { value: "payments", label: "Payments" },
    { value: "disputes", label: "Disputes" },
    { value: "contacts", label: "Contacts" },
    { value: "pricing", label: "Pricing" },
    { value: "referrals", label: "Referrals" },
    { value: "contact-us", label: "Contact Us" },
    { value: "careers", label: "Careers" },
    { value: "notifications", label: "Notifications" }
  ];

  return (
    <div className={`container mx-auto py-8 ${isMobile ? 'px-0' : 'px-4'}`}>
      <div className={`mb-8 ${isMobile ? 'px-4' : ''}`}>
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">Manage users, bookings, payments, and platform settings</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        {isMobile ? (
          <div className="px-4">
            <Select value={selectedTab} onValueChange={setSelectedTab}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50 max-h-[40vh]">
                {tabOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
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
        )}

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
          <AdminNotifications />
        </TabsContent>

        <TabsContent value="audit">
          <AdminAuditLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}
