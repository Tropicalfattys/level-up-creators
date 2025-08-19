
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

interface EscrowManagerProps {
  bookingId: string;
  isClient?: boolean;
}

export const EscrowManager = ({ bookingId, isClient = false }: EscrowManagerProps) => {
  const [disputing, setDisputing] = useState(false);
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

  const acceptDelivery = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Delivery accepted! Funds will be released to creator.');
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
    onError: () => {
      toast.error('Failed to accept delivery');
    }
  });

  const openDispute = useMutation({
    mutationFn: async (reason: string) => {
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'disputed' })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      const { error: disputeError } = await supabase
        .from('disputes')
        .insert({
          booking_id: bookingId,
          opened_by: isClient ? 'client' : 'creator',
          reason
        });

      if (disputeError) throw disputeError;
    },
    onSuccess: () => {
      toast.success('Dispute opened. Admin will review within 24 hours.');
      setDisputing(false);
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
    onError: () => {
      toast.error('Failed to open dispute');
    }
  });

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

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Service Amount</span>
            <span>${booking.usdc_amount} USDC</span>
          </div>
          <div className="flex justify-between">
            <span>Platform Fee (15%)</span>
            <span>${(booking.usdc_amount * 0.15).toFixed(2)} USDC</span>
          </div>
          <div className="flex justify-between">
            <span>Creator Receives</span>
            <span className="font-medium">${(booking.usdc_amount * 0.85).toFixed(2)} USDC</span>
          </div>
        </div>

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

        {/* Client Actions */}
        {isClient && booking.status === 'delivered' && (
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
                className="w-full p-3 border rounded-lg resize-none"
                rows={4}
                placeholder="Please describe the issue with the delivery..."
                id="dispute-reason"
              />
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => {
                    const reason = (document.getElementById('dispute-reason') as HTMLTextAreaElement)?.value;
                    if (reason?.trim()) {
                      openDispute.mutate(reason);
                    } else {
                      toast.error('Please provide a reason for the dispute');
                    }
                  }}
                  disabled={openDispute.isPending}
                  variant="destructive"
                  className="flex-1"
                >
                  Submit Dispute
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDisputing(false)}
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
