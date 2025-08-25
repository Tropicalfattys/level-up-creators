
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const ReferralTestPanel = () => {
  const [isTestingReferrals, setIsTestingReferrals] = useState(false);
  const queryClient = useQueryClient();

  // Get bookings with referral information
  const { data: bookingsWithReferrals } = useQuery({
    queryKey: ['bookings-referrals-test'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          client_id,
          creator_id,
          usdc_amount,
          tx_hash,
          created_at,
          client:users!bookings_client_id_fkey (
            id,
            handle,
            referred_by,
            referral_credits
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    }
  });

  // Get referrer information separately for users who have referrers
  const { data: referrersInfo } = useQuery({
    queryKey: ['referrers-info'],
    queryFn: async () => {
      if (!bookingsWithReferrals) return {};
      
      const referrerIds = bookingsWithReferrals
        .filter(booking => booking.client?.referred_by)
        .map(booking => booking.client!.referred_by)
        .filter(Boolean);

      if (referrerIds.length === 0) return {};

      const { data, error } = await supabase
        .from('users')
        .select('id, handle, referral_credits')
        .in('id', referrerIds);

      if (error) throw error;
      
      // Convert to object for easy lookup
      const referrersMap: Record<string, any> = {};
      data?.forEach(referrer => {
        referrersMap[referrer.id] = referrer;
      });
      
      return referrersMap;
    },
    enabled: !!bookingsWithReferrals
  });

  const testReferralCredit = useMutation({
    mutationFn: async (bookingId: string) => {
      setIsTestingReferrals(true);
      
      // Update booking status to 'accepted' to trigger the referral credit
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'accepted' })
        .eq('id', bookingId);

      if (error) throw error;
      return bookingId;
    },
    onSuccess: () => {
      toast.success('Booking updated to accepted - referral credit should be awarded!');
      queryClient.invalidateQueries({ queryKey: ['bookings-referrals-test'] });
      queryClient.invalidateQueries({ queryKey: ['referrers-info'] });
      setIsTestingReferrals(false);
    },
    onError: (error: Error) => {
      toast.error(`Error testing referral: ${error.message}`);
      setIsTestingReferrals(false);
    }
  });

  const bookingsWithReferralUsers = bookingsWithReferrals?.filter(
    booking => booking.client?.referred_by && booking.status !== 'accepted'
  ) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Referral Credit Test Panel</CardTitle>
          <CardDescription>
            Test the referral credit system by updating bookings to 'accepted' status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bookingsWithReferralUsers.length === 0 ? (
              <p className="text-muted-foreground">
                No bookings found with referred users that haven't been accepted yet.
              </p>
            ) : (
              bookingsWithReferralUsers.map((booking) => {
                const referrer = referrersInfo?.[booking.client!.referred_by!];
                
                return (
                  <div
                    key={booking.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          Booking by @{booking.client?.handle}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Amount: ${booking.usdc_amount} USDC
                        </p>
                        <p className="text-sm text-muted-foreground">
                          TX: {booking.tx_hash?.slice(0, 20)}...
                        </p>
                      </div>
                      <Badge variant="secondary">{booking.status}</Badge>
                    </div>
                    
                    {referrer && (
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm">
                          <strong>Referred by:</strong> @{referrer.handle}
                        </p>
                        <p className="text-sm">
                          <strong>Referrer's current credits:</strong> ${referrer.referral_credits}
                        </p>
                      </div>
                    )}
                    
                    <Button
                      onClick={() => testReferralCredit.mutate(booking.id)}
                      disabled={isTestingReferrals}
                      className="w-full"
                    >
                      {isTestingReferrals ? 'Testing...' : 'Test Referral Credit (Set to Accepted)'}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Show all recent bookings for context */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {bookingsWithReferrals?.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <span className="text-sm">@{booking.client?.handle}</span>
                  {booking.client?.referred_by && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Referred User
                    </Badge>
                  )}
                </div>
                <Badge variant={booking.status === 'accepted' ? 'default' : 'secondary'}>
                  {booking.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
