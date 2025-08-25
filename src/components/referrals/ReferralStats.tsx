
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

      // Get ALL bookings from referred users (not just accepted ones) to understand the flow
      let allBookings = [];
      let acceptedBookings = [];
      if (referredUsers && referredUsers.length > 0) {
        const referredUserIds = referredUsers.map(u => u.id);
        console.log('Checking bookings for referred user IDs:', referredUserIds);

        // Get all bookings to see what statuses exist
        const { data: allBookingsData, error: allBookingsError } = await supabase
          .from('bookings')
          .select(`
            id,
            status,
            client_id,
            created_at,
            usdc_amount,
            updated_at
          `)
          .in('client_id', referredUserIds)
          .order('created_at', { ascending: false });

        if (allBookingsError) {
          console.error('Error fetching all bookings:', allBookingsError);
        } else {
          allBookings = allBookingsData || [];
          console.log('ALL bookings from referred users:', allBookings);
          console.log('Booking statuses found:', allBookings.map(b => b.status));
        }

        // Get accepted bookings specifically
        const { data: acceptedBookingsData, error: acceptedBookingsError } = await supabase
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

        if (acceptedBookingsError) {
          console.error('Error fetching accepted bookings:', acceptedBookingsError);
        } else {
          acceptedBookings = acceptedBookingsData || [];
          console.log('Accepted bookings from referred users:', acceptedBookings);
        }

        // Check if trigger should have fired - look for first accepted booking per user
        referredUserIds.forEach(userId => {
          const userBookings = allBookings.filter(b => b.client_id === userId);
          const userAcceptedBookings = acceptedBookings.filter(b => b.client_id === userId);
          console.log(`User ${userId} bookings:`, userBookings.length, 'total,', userAcceptedBookings.length, 'accepted');
          
          if (userAcceptedBookings.length > 0) {
            console.log(`User ${userId} first accepted booking:`, userAcceptedBookings[0]);
          }
        });
      }

      const result = {
        ...userData,
        referred_count: referredCount || 0,
        referred_users: referredUsers || [],
        accepted_bookings_count: acceptedBookings?.length || 0,
        total_bookings_count: allBookings?.length || 0
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
        <div className="text-center">
          <div className="text-2xl font-bold">Loading...</div>
          <div className="text-sm text-muted-foreground">Credits Earned</div>
        </div>
        <div className="text-center">
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
        {referralStats?.total_bookings_count > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            {referralStats.accepted_bookings_count} of {referralStats.total_bookings_count} bookings completed
          </div>
        )}
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{referralStats?.referred_count || 0}</div>
        <div className="text-sm text-muted-foreground">Friends Referred</div>
        {referralStats?.referred_count > 0 && referralStats?.accepted_bookings_count === 0 && (
          <div className="text-xs text-orange-500 mt-1">
            Credits earned when they complete first purchase
          </div>
        )}
      </div>
    </div>
  );
};
