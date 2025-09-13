import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { TrendingUp, Users, DollarSign, Target, Search, Plus, Minus, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface ReferralRelationship {
  id: string;
  handle: string;
  referral_credits: number;
  created_at: string;
  referred_by: string;
  referrer?: {
    handle: string;
    referral_credits: number;
  };
}

export const AdminReferrals = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [creditAdjustment, setCreditAdjustment] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const queryClient = useQueryClient();

  // Get referral performance overview
  const { data: referralStats } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: async () => {
      // Get total users with referrals
      const { data: totalReferred, error: e1 } = await supabase
        .from('users')
        .select('id')
        .not('referred_by', 'is', null);

      // Get total credits awarded
      const { data: creditsData, error: e2 } = await supabase
        .from('users')
        .select('referral_credits')
        .gt('referral_credits', 0);

      // Get referral conversions (users who made bookings after being referred)
      const { data: conversions, error: e3 } = await supabase
        .from('bookings')
        .select(`
          client_id,
          status,
          usdc_amount,
          client:users!bookings_client_id_fkey(referred_by)
        `)
        .not('client.referred_by', 'is', null)
        .in('status', ['accepted', 'released']);

      if (e1 || e2 || e3) throw new Error('Failed to fetch referral stats');

      const totalCredits = creditsData?.reduce((sum, user) => sum + Number(user.referral_credits || 0), 0) || 0;
      const conversionRate = totalReferred?.length > 0 ? (conversions?.length || 0) / totalReferred.length * 100 : 0;
      const avgReferralValue = conversions?.length > 0 ? 
        conversions.reduce((sum, booking) => sum + Number(booking.usdc_amount || 0), 0) / conversions.length : 0;

      return {
        totalReferred: totalReferred?.length || 0,
        totalCredits,
        conversions: conversions?.length || 0,
        conversionRate,
        avgReferralValue
      };
    }
  });

  // Get top referrers
  const { data: topReferrers } = useQuery({
    queryKey: ['top-referrers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, handle, referral_credits, avatar_url')
        .gt('referral_credits', 0)
        .order('referral_credits', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    }
  });

  // Get all referral relationships
  const { data: referralRelationships } = useQuery({
    queryKey: ['referral-relationships', searchTerm],
    queryFn: async (): Promise<ReferralRelationship[]> => {
      let query = supabase
        .from('users')
        .select(`
          id,
          handle,
          referral_credits,
          created_at,
          referred_by
        `)
        .not('referred_by', 'is', null);

      if (searchTerm) {
        query = query.ilike('handle', `%${searchTerm}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get referrer information for each user
      if (data && data.length > 0) {
        const referrerIds = data.map(u => u.referred_by).filter(Boolean);
        if (referrerIds.length > 0) {
          const { data: referrers } = await supabase
            .from('users')
            .select('id, handle, referral_credits')
            .in('id', referrerIds);

          // Attach referrer info to each user
          return data.map(user => ({
            ...user,
            referrer: referrers?.find(r => r.id === user.referred_by)
          })) as ReferralRelationship[];
        }
      }

      return (data || []) as ReferralRelationship[];
    }
  });

  // Get credit transaction history
  const { data: creditHistory } = useQuery({
    queryKey: ['credit-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referral_credits_awarded')
        .select(`
          id,
          credit_amount,
          awarded_at,
          booking_id,
          referrer:users!referral_credits_awarded_referrer_id_fkey(handle),
          referred_user:users!referral_credits_awarded_referred_user_id_fkey(handle)
        `)
        .order('awarded_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    }
  });

  // Get recent referral activity
  const { data: recentActivity } = useQuery({
    queryKey: ['recent-referral-activity'],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          usdc_amount,
          created_at,
          client:users!bookings_client_id_fkey(
            id,
            handle,
            referred_by
          )
        `)
        .not('client.referred_by', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return bookings || [];
    }
  });

  // Manual credit adjustment mutation
  const adjustCreditMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string, amount: number, reason: string }) => {
      // Get current credits
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('referral_credits')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Update credits
      const newCredits = Math.max(0, (user.referral_credits || 0) + amount);
      const { error } = await supabase
        .from('users')
        .update({ referral_credits: newCredits })
        .eq('id', userId);

      if (error) throw error;

      // Log the adjustment in admin notes
      await supabase
        .from('admin_notes')
        .insert({
          user_id: userId,
          note: `Credit adjustment: ${amount > 0 ? '+' : ''}${amount} (${reason})`
        });
    },
    onSuccess: () => {
      toast.success('Credits adjusted successfully');
      queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
      queryClient.invalidateQueries({ queryKey: ['top-referrers'] });
      setCreditAdjustment(0);
      setAdjustmentReason('');
      setSelectedUser('');
    },
    onError: (error: Error) => {
      toast.error(`Failed to adjust credits: ${error.message}`);
    }
  });

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Referral Management</h2>
        <p className="text-muted-foreground">Monitor and manage the referral program</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Performance Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{referralStats?.totalReferred || 0}</div>
                <p className="text-xs text-muted-foreground">Users referred to platform</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Credits Awarded</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${referralStats?.totalCredits || 0}</div>
                <p className="text-xs text-muted-foreground">Total referral credits</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{referralStats?.conversions || 0}</div>
                <p className="text-xs text-muted-foreground">{referralStats?.conversionRate.toFixed(1)}% conversion rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${referralStats?.avgReferralValue.toFixed(2) || 0}</div>
                <p className="text-xs text-muted-foreground">Per referral booking</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Referrers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Referrers</CardTitle>
              <CardDescription>Users who have generated the most referral credits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topReferrers?.map((referrer, index) => (
                  <div key={referrer.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium">@{referrer.handle}</p>
                        <p className="text-sm text-muted-foreground">${referrer.referral_credits} credits</p>
                      </div>
                    </div>
                    <Badge variant="secondary">${referrer.referral_credits}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relationships" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Referral Relationships</CardTitle>
              <CardDescription>View and search all referral connections</CardDescription>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referred User</TableHead>
                    <TableHead>Referred By</TableHead>
                    <TableHead>Credits Earned</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referralRelationships?.map((relationship) => (
                    <TableRow key={relationship.id}>
                      <TableCell>
                        <div className="font-medium">@{relationship.handle}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">@{relationship.referrer?.handle || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">
                          ${relationship.referrer?.referral_credits || 0} total credits
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">${relationship.referral_credits}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(relationship.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={relationship.referral_credits > 0 ? 'default' : 'secondary'}>
                          {relationship.referral_credits > 0 ? 'Converted' : 'Pending'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Manual Credit Adjustment */}
            <Card>
              <CardHeader>
                <CardTitle>Manual Credit Adjustment</CardTitle>
                <CardDescription>Adjust user credits for customer service purposes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-select">Select User</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {topReferrers?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          @{user.handle} (${user.referral_credits} credits)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credit-amount">Credit Adjustment</Label>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCreditAdjustment(creditAdjustment - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="credit-amount"
                      type="number"
                      value={creditAdjustment}
                      onChange={(e) => setCreditAdjustment(Number(e.target.value))}
                      className="text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCreditAdjustment(creditAdjustment + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Adjustment</Label>
                  <Input
                    id="reason"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="e.g., Customer service request, promotion credit"
                  />
                </div>

                <Button
                  onClick={() => adjustCreditMutation.mutate({
                    userId: selectedUser,
                    amount: creditAdjustment,
                    reason: adjustmentReason
                  })}
                  disabled={!selectedUser || creditAdjustment === 0 || !adjustmentReason}
                  className="w-full"
                >
                  Apply Credit Adjustment
                </Button>
              </CardContent>
            </Card>

            {/* Recent Credit History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Credit Awards</CardTitle>
                <CardDescription>Latest automatic referral credit awards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {creditHistory?.map((credit) => (
                    <div key={credit.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          ${credit.credit_amount} to @{credit.referrer?.handle}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          For referring @{credit.referred_user?.handle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(credit.awarded_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <Badge variant="default">Awarded</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Referral Activity</CardTitle>
              <CardDescription>Latest bookings from referred users</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Booking Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Credit Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivity?.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="font-medium">@{booking.client?.handle}</div>
                        <Badge variant="outline" className="text-xs">Referred User</Badge>
                      </TableCell>
                      <TableCell>${booking.usdc_amount}</TableCell>
                      <TableCell>
                        <Badge variant={booking.status === 'accepted' ? 'default' : 'secondary'}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(booking.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={booking.status === 'accepted' ? 'default' : 'secondary'}>
                          {booking.status === 'accepted' ? 'Credit Awarded' : 'Pending'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Referral Program Performance</CardTitle>
                <CardDescription>Key metrics and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Program Value</span>
                    <span className="text-lg font-bold">
                      ${((referralStats?.totalCredits || 0) * (referralStats?.avgReferralValue || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Credits per Referrer</span>
                    <span className="text-lg font-bold">
                      ${((referralStats?.totalCredits || 0) / (topReferrers?.length || 1)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Referral Success Rate</span>
                    <span className="text-lg font-bold">
                      {referralStats?.conversionRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Data</CardTitle>
                <CardDescription>Download referral data for analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full">
                  Export Referral Relationships
                </Button>
                <Button variant="outline" className="w-full">
                  Export Credit History
                </Button>
                <Button variant="outline" className="w-full">
                  Export Performance Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};