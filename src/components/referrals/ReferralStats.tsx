
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

      console.log('=== REFERRAL STATS DEBUG ===');
      console.log('Fetching referral stats for user:', user.id);
      console.log('User email:', user.email);

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

      console.log('User referral data:', userData);

      // Get count of users referred by this user
      const { data: referredUsers, count: referredCount, error: countError } = await supabase
        .from('users')
        .select('id, handle, created_at, role, referral_code', { count: 'exact' })
        .eq('referred_by', user.id);

      if (countError) {
        console.error('Error fetching referred users:', countError);
        throw countError;
      }

      console.log('Referred users query result:');
      console.log('- Count:', referredCount);
      console.log('- Users:', referredUsers);

      // If no referred users, let's check if there are any users with this user's referral code
      if ((!referredUsers || referredUsers.length === 0) && userData?.referral_code) {
        console.log('No direct referrals found, checking by referral code:', userData.referral_code);
        
        const { data: codeUsers, count: codeCount, error: codeError } = await supabase
          .from('users')
          .select('id, handle, created_at, role, referred_by, referral_code', { count: 'exact' })
          .eq('referred_by', user.id);

        console.log('Users referred by ID check:');
        console.log('- Count:', codeCount);
        console.log('- Users:', codeUsers);

        // Also check all users to see referral patterns
        const { data: allUsers, error: allUsersError } = await supabase
          .from('users')
          .select('id, handle, referred_by, referral_code')
          .not('referred_by', 'is', null)
          .limit(50);

        console.log('All users with referrals (sample):', allUsers);
      }

      // Get bookings from referred users that have been accepted (to award credits)
      let acceptedBookings = [];
      if (referredUsers && referredUsers.length > 0) {
        const referredUserIds = referredUsers.map(u => u.id);
        console.log('Checking bookings for referred user IDs:', referredUserIds);

        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id,
            status,
            client_id,
            created_at,
            usdc_amount
          `)
          .eq('status', 'accepted')
          .in('client_id', referredUserIds);

        if (bookingsError) {
          console.error('Error fetching accepted bookings:', bookingsError);
        } else {
          acceptedBookings = bookingsData || [];
          console.log('Accepted bookings from referred users:', acceptedBookings);
        }
      }

      const result = {
        ...userData,
        referred_count: referredCount || 0,
        referred_users: referredUsers || [],
        accepted_bookings_count: acceptedBookings?.length || 0
      };

      console.log('Final referral stats result:', result);
      console.log('=== END REFERRAL STATS DEBUG ===');

      return result;
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
