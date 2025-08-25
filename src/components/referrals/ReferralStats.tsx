
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-2xl font-bold">Loading...</div>
          <div className="text-sm text-muted-foreground">Credits Earned</div>
        </div>
        <div>
          <div className="text-2xl font-bold">Loading...</div>
          <div className="text-sm text-muted-foreground">Friends Referred</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold">${referralStats?.referral_credits || 0}</div>
        <div className="text-sm text-muted-foreground">Credits Earned</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{referralStats?.referred_count || 0}</div>
        <div className="text-sm text-muted-foreground">Friends Referred</div>
      </div>
    </div>
  );
};
