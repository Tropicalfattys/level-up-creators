
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MessageSquare, Upload, DollarSign, User, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface BookingWithDetails {
  id: string;
  status: string;
  usdc_amount: number;
  created_at: string;
  delivered_at?: string;
  accepted_at?: string;
  release_at?: string;
  services: {
    title: string;
  } | null;
  client: {
    handle: string;
    avatar_url?: string;
  } | null;
}

export const BookingManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['creator-bookings', user?.id],
    queryFn: async (): Promise<BookingWithDetails[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (title),
          client:users!bookings_client_id_fkey (handle, avatar_url)
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ bookingId, status, deliveredAt }: { 
      bookingId: string; 
      status: string; 
      deliveredAt?: string; 
    }) => {
      const updateData: any = { status };
      if (deliveredAt) {
        updateData.delivered_at = deliveredAt;
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['creator-bookings'] });
      const statusText = status === 'in_progress' ? 'started' : 
                        status === 'delivered' ? 'delivered' : 'updated';
      toast.success(`Booking ${statusText} successfully!`);
    },
    onError: (error) => {
      console.error('Update booking error:', error);
      toast.error('Failed to update booking status');
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'in_progress': return 'default';
      case 'delivered': return 'secondary';
      case 'accepted': return 'outline';
      case 'released': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusActions = (booking: BookingWithDetails) => {
    switch (booking.status) {
      case 'paid':
        return (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => updateBookingStatus.mutate({ 
              bookingId: booking.id, 
              status: 'in_progress' 
            })}
            disabled={updateBookingStatus.isPending}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Start Work
          </Button>
        );
      case 'in_progress':
        return (
          <Button 
            size="sm"
            onClick={() => updateBookingStatus.mutate({ 
              bookingId: booking.id, 
              status: 'delivered',
              deliveredAt: new Date().toISOString()
            })}
            disabled={updateBookingStatus.isPending}
          >
            <Upload className="h-3 w-3 mr-1" />
            Mark as Delivered
          </Button>
        );
      case 'delivered':
        return (
          <div className="text-sm text-muted-foreground">
            Waiting for client review
          </div>
        );
      case 'accepted':
      case 'released':
        return (
          <div className="text-sm text-green-600 font-medium">
            Completed
          </div>
        );
      default:
        return null;
    }
  };

  const filterBookings = (status: string) => {
    if (!bookings) return [];
    if (status === 'all') return bookings;
    return bookings.filter(booking => booking.status === status);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading bookings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Booking Management</h3>
        <p className="text-muted-foreground">
          Manage your active bookings and deliverables
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({bookings?.length || 0})</TabsTrigger>
          <TabsTrigger value="paid">New ({filterBookings('paid').length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({filterBookings('in_progress').length})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({filterBookings('delivered').length})</TabsTrigger>
        </TabsList>

        {['all', 'paid', 'in_progress', 'delivered'].map(status => (
          <TabsContent key={status} value={status} className="space-y-4">
            {filterBookings(status).map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{booking.services?.title || 'Service'}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <User className="h-3 w-3" />
                        Client: @{booking.client?.handle || 'Unknown'}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusColor(booking.status)}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                      <p className="font-semibold mt-1">
                        <DollarSign className="h-3 w-3 inline mr-1" />
                        {booking.usdc_amount} USDC
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Booked {format(new Date(booking.created_at), 'MMM d, yyyy')}
                      </div>
                      {booking.delivered_at && (
                        <div className="flex items-center gap-1">
                          <Upload className="h-3 w-3" />
                          Delivered {format(new Date(booking.delivered_at), 'MMM d')}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Chat
                      </Button>
                      {getStatusActions(booking)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filterBookings(status).length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No bookings in this category yet
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
