
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Users, Clock, Star, Plus, Upload } from 'lucide-react';
import { BookingManagement } from '@/components/creator/BookingManagement';
import { EarningsTracker } from '@/components/creator/EarningsTracker';

export default function CreatorDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your services, bookings, and earnings
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,847.50</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              2 pending delivery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">
              Based on 47 reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3h</div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bookings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <BookingManagement />
        </TabsContent>

        <TabsContent value="earnings">
          <EarningsTracker />
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Your Services</h3>
            <Button onClick={() => window.location.href = '/services'}>
              <Plus className="h-4 w-4 mr-2" />
              Manage Services
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Mock services */}
            {[
              { title: 'Trading Analysis', price: 99.99, active: true, bookings: 23 },
              { title: 'Portfolio Review', price: 149.99, active: true, bookings: 15 },
              { title: 'Private Consultation', price: 299.99, active: false, bookings: 8 }
            ].map((service, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                    <Badge variant={service.active ? 'default' : 'secondary'}>
                      {service.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription>${service.price} USDC</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {service.bookings} total bookings
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button size="sm" variant="outline">
                      {service.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your creator profile</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Profile management will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
