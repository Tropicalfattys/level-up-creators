
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Users, Facebook, Twitter, MessageCircle, Linkedin, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { ReferralStats } from './ReferralStats';

export const ReferralSystem = () => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { user, userProfile } = useAuth();

  const copyReferralCode = () => {
    if (!userProfile?.referral_code) return;
    
    navigator.clipboard.writeText(userProfile.referral_code);
    setCopiedCode(true);
    toast.success('Referral code copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyReferralLink = () => {
    if (!userProfile?.referral_code) return;
    
    const referralUrl = `${window.location.origin}/auth?ref=${userProfile.referral_code}`;
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    toast.success('Referral link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
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
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left Column - Your Referral Program */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Your Referral Program
          </CardTitle>
          <CardDescription>
            Earn $1 credit for every successful referral that signs up and makes their first purchase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Referral Code */}
          <div>
            <label className="text-sm font-medium mb-2 block">Your referral code:</label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={userProfile?.referral_code || 'Loading...'}
                className="flex-1 bg-muted"
              />
              <Button onClick={copyReferralCode} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Referral Link */}
          <div>
            <label className="text-sm font-medium mb-2 block">Your referral link:</label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={userProfile?.referral_code ? `${window.location.origin}/auth?ref=${userProfile.referral_code}` : 'Loading...'}
                className="flex-1 bg-muted"
              />
              <Button onClick={copyReferralLink} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <ReferralStats />

          {/* Social Share */}
          <div>
            <label className="text-sm font-medium mb-3 block">Share on social media:</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnSocial('twitter')}
                className="justify-start"
              >
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnSocial('facebook')}
                className="justify-start"
              >
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnSocial('linkedin')}
                className="justify-start"
              >
                <Linkedin className="h-4 w-4 mr-2" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnSocial('telegram')}
                className="justify-start"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Telegram
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right Column - How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium">Share your code or link</h4>
                <p className="text-sm text-muted-foreground">Send your referral code or link to friends</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium">They sign up</h4>
                <p className="text-sm text-muted-foreground">Your friend creates an account using your referral</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium">Earn $1 credit</h4>
                <p className="text-sm text-muted-foreground">Get $1 credit when they make their first purchase</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h4 className="font-medium">Use your credits</h4>
                <p className="text-sm text-muted-foreground">Apply credits to any service on the platform</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
