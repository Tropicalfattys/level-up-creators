
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Users, Share2 } from 'lucide-react';

export const ReferralStats = () => {
  const { user } = useAuth();

  const { data: referralStats, isLoading } = useQuery({
    queryKey: ['referral-stats-detailed', user?.id],
    queryFn: async () => {
      if (!user) return null;

      console.log('Fetching referral stats for user:', user.id);

      // Get user's referral credits and code
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('referral_code, referral_credits, referred_by')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        throw userError;
      }

      console.log('User data:', userData);

      // Get count of users referred by this user
      const { data: referredUsers, count: referredCount, error: countError } = await supabase
        .from('users')
        .select('id, handle, created_at, role', { count: 'exact' })
        .eq('referred_by', user.id);

      if (countError) {
        console.error('Error fetching referred users:', countError);
        throw countError;
      }

      console.log('Referred users:', referredUsers);
      console.log('Referred count:', referredCount);

      // Get bookings from referred users that have been accepted (to award credits)
      const { data: acceptedBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          client_id,
          created_at,
          client:users!bookings_client_id_fkey (
            id,
            handle,
            referred_by
          )
        `)
        .eq('status', 'accepted')
        .in('client_id', referredUsers?.map(u => u.id) || []);

      if (bookingsError) {
        console.error('Error fetching accepted bookings:', bookingsError);
      }

      console.log('Accepted bookings from referred users:', acceptedBookings);

      return {
        ...userData,
        referred_count: referredCount || 0,
        referred_users: referredUsers || [],
        accepted_bookings_count: acceptedBookings?.length || 0
      };
    },
    enabled: !!user,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Available Credits</span>
          </div>
          <p className="text-2xl font-bold">${referralStats?.referral_credits || 0}</p>
          <p className="text-xs text-muted-foreground">
            From {referralStats?.accepted_bookings_count || 0} successful referrals
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">People Referred</span>
          </div>
          <p className="text-2xl font-bold">{referralStats?.referred_count || 0}</p>
          <p className="text-xs text-muted-foreground">
            Total sign-ups using your code
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Your Referral Code</span>
          </div>
          <p className="text-2xl font-bold">{referralStats?.referral_code || 'Loading...'}</p>
          <p className="text-xs text-muted-foreground">
            Share this code with friends
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
