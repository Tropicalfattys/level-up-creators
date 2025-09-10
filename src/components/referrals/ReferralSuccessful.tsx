import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Users, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface SuccessfulReferral {
  id: string;
  referred_user_handle: string;
  awarded_at: string;
  credit_amount: number;
}

export const ReferralSuccessful = () => {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: successfulReferrals, isLoading } = useQuery({
    queryKey: ['successful-referrals', user?.id],
    queryFn: async () => {
      if (!user) return [];

      console.log('Fetching referrals for user:', user.id);

      const { data, error } = await supabase
        .from('referral_credits_awarded')
        .select(`
          id,
          credit_amount,
          awarded_at,
          users!referral_credits_awarded_referred_user_id_fkey (
            handle
          )
        `)
        .eq('referrer_id', user.id)
        .order('awarded_at', { ascending: false });

      console.log('Raw Supabase response:', { data, error });

      if (error) {
        console.error('Error fetching successful referrals:', error);
        return [];
      }

      const mappedData = (data || []).map(item => {
        console.log('Processing item:', item);
        const result = {
          id: item.id,
          referred_user_handle: item.users?.handle || 'Unknown User',
          awarded_at: item.awarded_at,
          credit_amount: item.credit_amount
        };
        console.log('Mapped result:', result);
        return result;
      });

      console.log('Final mapped data:', mappedData);
      return mappedData;
    },
    enabled: !!user
  });

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Successful Referrals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading referral history...</div>
        </CardContent>
      </Card>
    );
  }

  const displayReferrals = successfulReferrals?.slice(0, 4) || [];
  const hasMore = (successfulReferrals?.length || 0) > 4;

  if (!successfulReferrals || successfulReferrals.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Successful Referrals
          </CardTitle>
          <CardDescription>
            Users who have completed their first purchase using your referral
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-4">
            No successful referrals yet. Keep sharing your link!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Successful Referrals
        </CardTitle>
        <CardDescription>
          Users who have completed their first purchase using your referral
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayReferrals.map((referral) => (
            <div key={referral.id} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium text-sm">@{referral.referred_user_handle}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  +${referral.credit_amount}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(referral.awarded_at), 'MMM d')}
                </span>
              </div>
            </div>
          ))}
          
          {hasMore && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <Eye className="h-4 w-4 mr-2" />
                  View More ({successfulReferrals.length - 4} more)
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    All Successful Referrals
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-96 pr-4">
                  <div className="space-y-3">
                    {successfulReferrals.map((referral) => (
                      <div key={referral.id} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium text-sm">@{referral.referred_user_handle}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="secondary" className="text-xs">
                            +${referral.credit_amount}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(referral.awarded_at), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
};