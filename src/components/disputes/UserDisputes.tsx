
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Plus, Clock, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInHours } from 'date-fns';

interface BookingForDispute {
  id: string;
  usdc_amount: number;
  status: string;
  created_at: string;
  delivered_at?: string;
  services: {
    title: string;
  };
  client: {
    handle: string;
  };
  creator: {
    handle: string;
  };
}

interface ExistingDispute {
  id: string;
  booking_id: string;
  reason: string;
  opened_by: string;
  status: string;
  created_at: string;
  bookings: BookingForDispute;
}

export const UserDisputes = () => {
  const { user } = useAuth();
  const [selectedBooking, setSelectedBooking] = useState<string>('');
  const [disputeReason, setDisputeReason] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch user's bookings that are eligible for disputes
  const { data: eligibleBookings } = useQuery({
    queryKey: ['eligible-bookings-for-disputes', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          usdc_amount,
          status,
          created_at,
          delivered_at,
          services (title),
          client:users!bookings_client_id_fkey (handle),
          creator:users!bookings_creator_id_fkey (handle)
        `)
        .or(`client_id.eq.${user.id},creator_id.eq.${user.id}`)
        .in('status', ['paid', 'in_progress', 'delivered'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter bookings that are within 48 hours of delivery or payment
      return (data || []).filter(booking => {
        const relevantDate = booking.delivered_at || booking.created_at;
        const hoursElapsed = differenceInHours(new Date(), new Date(relevantDate));
        return hoursElapsed <= 48;
      });
    },
    enabled: !!user
  });

  // Fetch existing disputes
  const { data: existingDisputes } = useQuery({
    queryKey: ['user-disputes', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('disputes')
        .select(`
          id,
          booking_id,
          reason,
          opened_by,
          status,
          created_at,
          bookings (
            id,
            usdc_amount,
            status,
            created_at,
            delivered_at,
            services (title),
            client:users!bookings_client_id_fkey (handle),
            creator:users!bookings_creator_id_fkey (handle)
          )
        `)
        .in('booking_id', 
          supabase
            .from('bookings')
            .select('id')
            .or(`client_id.eq.${user.id},creator_id.eq.${user.id}`)
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ExistingDispute[];
    },
    enabled: !!user
  });

  // Create dispute mutation
  const createDispute = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason: string }) => {
      if (!user) throw new Error('User not authenticated');

      // Determine if user is client or creator for this booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('client_id, creator_id')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) throw new Error('Booking not found');

      const openedBy = booking.client_id === user.id ? 'client' : 'creator';

      const { error } = await supabase
        .from('disputes')
        .insert({
          booking_id: bookingId,
          reason,
          opened_by: openedBy
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-disputes'] });
      queryClient.invalidateQueries({ queryKey: ['eligible-bookings-for-disputes'] });
      setIsDialogOpen(false);
      setSelectedBooking('');
      setDisputeReason('');
      toast.success('Dispute created successfully');
    },
    onError: () => {
      toast.error('Failed to create dispute');
    }
  });

  const handleCreateDispute = () => {
    if (!selectedBooking || !disputeReason.trim()) {
      toast.error('Please select a booking and provide a reason for the dispute');
      return;
    }
    createDispute.mutate({ bookingId: selectedBooking, reason: disputeReason });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'resolved': return 'default';
      case 'refunded': return 'secondary';
      case 'released': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Disputes
              </CardTitle>
              <CardDescription>
                Create disputes for services within 48 hours of payment or delivery
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Dispute
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Dispute</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Select Booking</label>
                    <Select value={selectedBooking} onValueChange={setSelectedBooking}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a booking to dispute" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleBookings?.map((booking) => (
                          <SelectItem key={booking.id} value={booking.id}>
                            {booking.services.title} - ${booking.usdc_amount} USDC
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Only bookings from the last 48 hours are eligible for disputes
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Reason for Dispute</label>
                    <Textarea
                      placeholder="Explain the reason for this dispute..."
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <Button 
                    onClick={handleCreateDispute}
                    disabled={!selectedBooking || !disputeReason.trim() || createDispute.isPending}
                    className="w-full"
                  >
                    {createDispute.isPending ? 'Creating...' : 'Create Dispute'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {existingDisputes && existingDisputes.length > 0 ? (
            <div className="space-y-4">
              {existingDisputes.map((dispute) => (
                <div key={dispute.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">{dispute.bookings.services.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Amount: ${dispute.bookings.usdc_amount} USDC
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Between: {dispute.bookings.client.handle} ↔ {dispute.bookings.creator.handle}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Opened by: {dispute.opened_by}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created: {format(new Date(dispute.created_at), 'PPp')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(dispute.status)}>
                      {dispute.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Disputes</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You haven't created any disputes. You can create a dispute for any booking within 48 hours of payment or delivery.
              </p>
            </div>
          )}

          {eligibleBookings && eligibleBookings.length === 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-800">
                  No bookings are currently eligible for disputes. Disputes can only be created within 48 hours of payment or delivery.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
