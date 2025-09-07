
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Users, Facebook, Twitter, MessageCircle, Linkedin, Instagram, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { ReferralStats } from './ReferralStats';
import { ReferralSuccessful } from './ReferralSuccessful';

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
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(message)}`,
      instagram: `instagram://camera?url=${encodeURIComponent(referralUrl)}`,
      discord: `https://discord.com/channels/@me?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(message)}`
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnSocial('instagram')}
                className="justify-start"
              >
                <Instagram className="h-4 w-4 mr-2" />
                Instagram
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnSocial('discord')}
                className="justify-start"
              >
                <Users className="h-4 w-4 mr-2" />
                Discord
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right Column - How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-2">
            How It Works
            <HoverCard>
              <HoverCardTrigger asChild>
                <span className="text-xs bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent cursor-pointer hover:underline">
                  Important Information
                </span>
              </HoverCardTrigger>
              <HoverCardContent className="w-96 p-0 fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                <ScrollArea className="h-96">
                  <div className="p-6">
                    <h4 className="text-lg font-semibold mb-4">Referral Program Disclaimer</h4>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <p>By participating in the Leveled Up Referral Program, users agree to the following terms:</p>
                      <ul className="space-y-2 list-disc pl-4">
                        <li><strong>Eligibility:</strong> Referral credits are earned when a new user signs up through your referral link, successfully books, and pays for their first service.</li>
                        <li><strong>Credit Value:</strong> Each successful referral earns you $1 in referral credits. Credits have no cash value and may only be used within the Leveled Up platform.</li>
                        <li><strong>Credit Availability:</strong> While credits can be earned during the beta phase, they will not be available for use until November 1, 2025, following the conclusion of the beta phase on October 31, 2025.</li>
                        <li><strong>Usage:</strong> Starting November 1, 2025, referral credits may be applied toward eligible services on the Leveled Up platform.</li>
                        <li><strong>Limitations:</strong> Referral credits are non-transferable, non-refundable, and may not be redeemed for cash or cryptocurrency. Leveled Up reserves the right to adjust or modify the referral program at any time.</li>
                      </ul>
                    </div>
                  </div>
                </ScrollArea>
              </HoverCardContent>
            </HoverCard>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium text-left">Share your code or link</h4>
                <p className="text-sm text-muted-foreground text-left">Send your referral code or link to friends</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium text-left">They sign up</h4>
                <p className="text-sm text-muted-foreground text-left">Your friend creates an account using your referral</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium text-left">Earn $1 credit</h4>
                <p className="text-sm text-muted-foreground text-left">Get $1 credit when they make their first purchase</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h4 className="font-medium text-left">Use your credits</h4>
                <p className="text-sm text-muted-foreground text-left">Apply credits to any service on the platform</p>
              </div>
            </div>
          </div>
          
          {/* Successful Referrals Section */}
          <ReferralSuccessful />
        </CardContent>
      </Card>
    </div>
  );
};
