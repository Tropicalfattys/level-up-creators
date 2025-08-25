
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Users, Facebook, Twitter, MessageCircle, Linkedin } from 'lucide-react';
import { toast } from 'sonner';
import { ReferralStats } from './ReferralStats';

export const ReferralSystem = () => {
  const [copied, setCopied] = useState(false);
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();

  const applyReferralCode = useMutation({
    mutationFn: async (referralCode: string) => {
      if (!user) throw new Error('Not authenticated');

      console.log('Applying referral code:', referralCode);

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
        .select('id, handle')
        .eq('referral_code', referralCode.toUpperCase())
        .single();

      if (referrerError || !referrer) {
        console.error('Referrer not found:', referrerError);
        throw new Error('Invalid referral code');
      }

      if (referrer.id === user.id) {
        throw new Error('You cannot refer yourself');
      }

      console.log('Found referrer:', referrer);

      // Update user's referrer
      const { error } = await supabase
        .from('users')
        .update({ referred_by: referrer.id })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating referrer:', error);
        throw error;
      }

      console.log('Successfully applied referral code');
      return referrer;
    },
    onSuccess: (referrer) => {
      toast.success(`Referral code applied! You were referred by @${referrer.handle}. Both of you will earn credits when you make your first booking.`);
      queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
      queryClient.invalidateQueries({ queryKey: ['referral-stats-detailed'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error: Error) => {
      console.error('Referral code application failed:', error);
      toast.error(error.message);
    }
  });

  const copyReferralLink = () => {
    if (!userProfile?.referral_code) return;
    
    const referralUrl = `${window.location.origin}/auth?ref=${userProfile.referral_code}`;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success('Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnSocial = (platform: string) => {
    if (!userProfile?.referral_code) return;

    const referralUrl = `${window.location.origin}/auth?ref=${userProfile.referral_code}`;
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
      {/* Stats Cards - Using new component with better debugging */}
      <ReferralStats />

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
              value={userProfile?.referral_code ? `${window.location.origin}/auth?ref=${userProfile.referral_code}` : 'Loading...'}
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

      {/* Apply Referral Code - Only show if user hasn't been referred */}
      {!userProfile?.referred_by && (
        <Card>
          <CardHeader>
            <CardTitle>Have a Referral Code?</CardTitle>
            <CardDescription>
              Enter a friend's referral code to get started with your first booking credit
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
                placeholder="Enter referral code (e.g., 0488B80E)"
                className="flex-1"
                disabled={applyReferralCode.isPending}
              />
              <Button type="submit" disabled={applyReferralCode.isPending}>
                {applyReferralCode.isPending ? 'Applying...' : 'Apply Code'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Debug Information (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-700">Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Referral Code:</strong> {userProfile?.referral_code || 'Not loaded'}</p>
              <p><strong>Referral Credits:</strong> {userProfile?.referral_credits || 0}</p>
              <p><strong>Referred By:</strong> {userProfile?.referred_by || 'None'}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
