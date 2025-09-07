
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { toast } from 'sonner';
import { PaymentBreakdown } from '@/components/payments/PaymentBreakdown';

interface EscrowManagerProps {
  bookingId: string;
  isClient?: boolean;
}

export const EscrowManager = ({ bookingId, isClient = false }: EscrowManagerProps) => {
  const [disputing, setDisputing] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (title, description),
          client:users!bookings_client_id_fkey (handle, avatar_url),
          creator:users!bookings_creator_id_fkey (handle, avatar_url)
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  // Fetch any existing dispute for this booking
  const { data: existingDispute } = useQuery({
    queryKey: ['booking-dispute', bookingId],
    queryFn: async () => {
      // Ensure user is authenticated before querying
      if (!user?.id) {
        console.log('User not authenticated, skipping dispute query');
        return null;
      }

      console.log('Querying disputes for booking:', bookingId);
      
      // Use maybeSingle() to avoid 406 errors when no dispute exists
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (error) {
        console.error('Dispute query error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        // Don't throw error for missing disputes, just return null
        return null;
      }
      
      console.log('Dispute query result:', data);
      return data;
    },
    enabled: !!user?.id && !!bookingId // Only run query when user is authenticated and bookingId exists
  });

  const acceptDelivery = useMutation({
    mutationFn: async () => {
      console.log('=== ACCEPT DELIVERY DEBUG ===');
      console.log('Booking ID:', bookingId);
      console.log('User ID:', user?.id);
      console.log('Booking object:', booking);
      
      // Ensure user is authenticated before making the call
      if (!user?.id) {
        throw new Error('User not authenticated - please refresh the page and try again');
      }
      
      // Validate booking exists and user is the client
      if (!booking) {
        throw new Error('Booking data not loaded - please refresh the page');
      }
      
      if (booking.client_id !== user.id) {
        throw new Error('You are not authorized to accept this delivery');
      }
      
      // Get fresh session to ensure auth context is valid
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        throw new Error('Authentication session invalid - please refresh the page');
      }
      
      console.log('Session valid, attempting booking update...');
      
      // Try alternative query syntax to avoid 400 error
      const updatePayload = {
        status: 'accepted',
        accepted_at: new Date().toISOString()
      };
      
      console.log('Update payload:', updatePayload);
      
      // Use match instead of eq for better compatibility
      const { data, error } = await supabase
        .from('bookings')
        .update(updatePayload)
        .match({ id: bookingId })
        .select();

      if (error) {
        console.error('=== BOOKING UPDATE ERROR ===');
        console.error('Error object:', error);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Error code:', error.code);
        throw new Error(`Failed to update booking: ${error.message}`);
      }
      
      console.log('=== BOOKING UPDATE SUCCESS ===');
      console.log('Updated data:', data);
      
      return data;
    },
    onSuccess: () => {
      toast.success('Delivery accepted! Funds will be released to creator.');
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
    onError: (error: any) => {
      console.error('Failed to accept delivery:', error);
      toast.error('Failed to accept delivery: ' + (error.message || 'Unknown error'));
    }
  });

  const openDispute = useMutation({
    mutationFn: async (reason: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated - please refresh the page and try again');
      }

      if (!reason?.trim()) {
        throw new Error('Dispute reason is required');
      }

      console.log('Opening dispute for booking:', bookingId, 'reason:', reason);
      console.log('Current user ID:', user.id);

      // Get fresh session to ensure auth context is valid
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication session invalid - please refresh the page');
      }

      // First update booking status using match for better compatibility
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'disputed' })
        .match({ id: bookingId });

      if (bookingError) {
        console.error('Booking update error:', bookingError);
        throw new Error(`Failed to update booking status: ${bookingError.message}`);
      }

      // Then create dispute record
      const { error: disputeError, data: disputeData } = await supabase
        .from('disputes')
        .insert({
          booking_id: bookingId,
          opened_by: isClient ? 'client' : 'creator',
          reason: reason.trim()
        })
        .select()
        .single();

      if (disputeError) {
        console.error('Dispute creation error:', disputeError);
        throw new Error(`Failed to create dispute: ${disputeError.message}`);
      }

      console.log('Dispute created successfully:', disputeData);
      return disputeData;
    },
    onSuccess: () => {
      toast.success('Dispute opened. Admin will review within 24 hours.');
      setDisputing(false);
      setDisputeReason('');
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['booking-dispute', bookingId] });
    },
    onError: (error: any) => {
      console.error('Failed to open dispute:', error);
      toast.error('Failed to open dispute: ' + (error.message || 'Unknown error'));
    }
  });

  const handleOpenDispute = () => {
    if (!disputeReason.trim()) {
      toast.error('Please provide a reason for the dispute');
      return;
    }
    openDispute.mutate(disputeReason);
  };

  if (!booking) return <div>Loading...</div>;

  const releaseDate = booking.delivered_at ? addDays(new Date(booking.delivered_at), 3) : null;
  const daysRemaining = releaseDate ? differenceInDays(releaseDate, new Date()) : 0;
  const isAutoReleaseExpired = releaseDate && daysRemaining <= 0;

  const getStatusBadge = () => {
    switch (booking.status) {
      case 'paid':
        return <Badge variant="secondary">Awaiting Delivery</Badge>;
      case 'delivered':
        return <Badge className="bg-blue-500">Delivered - Review Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500">Accepted - Funds Released</Badge>;
      case 'disputed':
        return <Badge variant="destructive">Under Dispute</Badge>;
      case 'released':
        return <Badge className="bg-green-600">Auto-Released</Badge>;
      default:
        return <Badge variant="outline">{booking.status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Escrow Protection
        </CardTitle>
        <CardDescription>
          Secure payment held until delivery is complete
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Status</span>
          {getStatusBadge()}
        </div>

        <Separator />

        <PaymentBreakdown amount={booking.usdc_amount} />

        {booking.status === 'delivered' && releaseDate && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Auto-Release Timer</span>
            </div>
            <p className="text-sm text-blue-700">
              {daysRemaining > 0 
                ? `Funds will be automatically released in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
                : 'Auto-release period expired - funds will be released'
              }
            </p>
            <p className="text-xs text-blue-600">
              Release Date: {format(releaseDate, 'MMM d, yyyy HH:mm')}
            </p>
          </div>
        )}

        {booking.delivered_at && (
          <div>
            <p className="text-sm text-muted-foreground">
              Delivered: {format(new Date(booking.delivered_at), 'MMM d, yyyy HH:mm')}
            </p>
          </div>
        )}

        {/* Show dispute resolution if dispute exists and is resolved */}
        {existingDispute && existingDispute.status === 'resolved' && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Dispute Resolved
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Resolution:</span>
                <p className="text-gray-700 mt-1">{existingDispute.resolution_note}</p>
              </div>
              {existingDispute.resolved_at && (
                <p className="text-xs text-gray-500">
                  Resolved: {format(new Date(existingDispute.resolved_at), 'MMM d, yyyy HH:mm')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Client Actions */}
        {isClient && booking.status === 'delivered' && !existingDispute && (
          <div className="flex gap-2">
            <Button 
              onClick={() => acceptDelivery.mutate()}
              disabled={acceptDelivery.isPending}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept Delivery
            </Button>
            <Button
              variant="outline"
              onClick={() => setDisputing(true)}
              className="flex-1"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Open Dispute
            </Button>
          </div>
        )}

        {/* Dispute Form */}
        {disputing && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Open Dispute</CardTitle>
              <CardDescription>
                Explain the issue with this delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full p-3 border rounded-lg resize-none text-gray-900 bg-white placeholder-gray-500"
                rows={4}
                placeholder="Please describe the issue with the delivery..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
              />
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleOpenDispute}
                  disabled={openDispute.isPending || !disputeReason.trim()}
                  variant="destructive"
                  className="flex-1"
                >
                  {openDispute.isPending ? 'Submitting...' : 'Submit Dispute'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDisputing(false);
                    setDisputeReason('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {booking.status === 'disputed' && (
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-900">Dispute in Progress</span>
            </div>
            <p className="text-sm text-red-700">
              This booking is under admin review. You will be notified of the resolution.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
