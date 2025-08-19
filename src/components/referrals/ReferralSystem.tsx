
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Share2, Copy, Users, DollarSign, Facebook, Twitter, MessageCircle, Linkedin } from 'lucide-react';
import { toast } from 'sonner';

export const ReferralSystem = () => {
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: userStats } = useQuery({
    queryKey: ['referral-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get user's referral credits and code
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('referral_code, referral_credits')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      // Get count of users referred by this user
      const { count: referredCount, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by', user.id);

      if (countError) throw countError;

      return {
        ...userData,
        referred_count: referredCount || 0
      };
    },
    enabled: !!user
  });

  const { data: referredUsers } = useQuery({
    queryKey: ['referred-users', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('users')
        .select('handle, created_at, role')
        .eq('referred_by', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const applyReferralCode = useMutation({
    mutationFn: async (referralCode: string) => {
      if (!user) throw new Error('Not authenticated');

      // Check if user already has a referrer
      const { data: currentUser } = await supabase
        .from('users')
        .select('referred_by')
        .eq('id', user.id)
        .single();

      if (currentUser?.referred_by) {
        throw new Error('You have already used a referral code');
      }

      // Find the referrer by code
      const { data: referrer, error: referrerError } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', referralCode.toUpperCase())
        .single();

      if (referrerError || !referrer) {
        throw new Error('Invalid referral code');
      }

      if (referrer.id === user.id) {
        throw new Error('You cannot refer yourself');
      }

      // Update user's referrer
      const { error } = await supabase
        .from('users')
        .update({ referred_by: referrer.id })
        .eq('id', user.id);

      if (error) throw error;

      return referrer;
    },
    onSuccess: () => {
      toast.success('Referral code applied! You and your referrer will earn credits when you make your first booking.');
      queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const copyReferralLink = () => {
    if (!userStats?.referral_code) return;
    
    const referralUrl = `${window.location.origin}/?ref=${userStats.referral_code}`;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success('Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnSocial = (platform: string) => {
    if (!userStats?.referral_code) return;

    const referralUrl = `${window.location.origin}/?ref=${userStats.referral_code}`;
    const message = "Check out this amazing crypto creator marketplace! Join using my link and we both earn credits.";
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(referralUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(message)}`
    };

    window.open(urls[platform as keyof typeof urls], '_blank');
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Available Credits</span>
            </div>
            <p className="text-2xl font-bold">${userStats?.referral_credits || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">People Referred</span>
            </div>
            <p className="text-2xl font-bold">{userStats?.referred_count || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Your Referral Code</span>
            </div>
            <p className="text-2xl font-bold">{userStats?.referral_code}</p>
          </CardContent>
        </Card>
      </div>

      {/* Share Your Link */}
      <Card>
        <CardHeader>
          <CardTitle>Share Your Referral Link</CardTitle>
          <CardDescription>
            Earn $1 in credits for each friend who signs up and makes their first booking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              readOnly
              value={userStats?.referral_code ? `${window.location.origin}/?ref=${userStats.referral_code}` : ''}
              className="flex-1"
            />
            <Button onClick={copyReferralLink} variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => shareOnSocial('twitter')}
              className="flex-1"
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => shareOnSocial('facebook')}
              className="flex-1"
            >
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => shareOnSocial('linkedin')}
              className="flex-1"
            >
              <Linkedin className="h-4 w-4 mr-2" />
              LinkedIn
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => shareOnSocial('telegram')}
              className="flex-1"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Telegram
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Apply Referral Code */}
      {!userStats?.referral_credits && (
        <Card>
          <CardHeader>
            <CardTitle>Have a Referral Code?</CardTitle>
            <CardDescription>
              Enter a friend's referral code to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const code = formData.get('referralCode') as string;
                if (code?.trim()) {
                  applyReferralCode.mutate(code.trim());
                }
              }}
              className="flex gap-2"
            >
              <Input
                name="referralCode"
                placeholder="Enter referral code"
                className="flex-1"
                disabled={applyReferralCode.isPending}
              />
              <Button type="submit" disabled={applyReferralCode.isPending}>
                Apply Code
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Recent Referrals */}
      {referredUsers && referredUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Referrals</CardTitle>
            <CardDescription>
              People who joined using your referral link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {referredUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">@{user.handle}</p>
                      <p className="text-sm text-muted-foreground">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={user.role === 'creator' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
