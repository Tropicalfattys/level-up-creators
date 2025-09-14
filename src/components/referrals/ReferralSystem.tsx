
import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { getExplorerUrl } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Users, Facebook, Twitter, MessageCircle, Linkedin, Instagram, Gift, DollarSign, ExternalLink, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ReferralStats } from './ReferralStats';
import { ReferralSuccessful } from './ReferralSuccessful';
import { CashOutModal } from './CashOutModal';

export const ReferralSystem = () => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [isCashOutModalOpen, setIsCashOutModalOpen] = useState(false);
  const { user, userProfile } = useAuth();
  const isMobile = useIsMobile();

  // Fetch user's cash-out requests
  const { data: userCashOutRequests } = useQuery({
    queryKey: ['user-cashout-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('referral_cashouts')
        .select('*')
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

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
    <div className="grid lg:grid-cols-3 gap-6">
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
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnSocial('facebook')}
                className="justify-start"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnSocial('linkedin')}
                className="justify-start"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnSocial('telegram')}
                className="justify-start"
              >
                <MessageCircle className="h-4 w-4" />
                Telegram
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnSocial('instagram')}
                className="justify-start"
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnSocial('discord')}
                className="justify-start"
              >
                <Users className="h-4 w-4" />
                Discord
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Middle Column - How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-2">
            How It Works
            <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
              <DialogTrigger asChild>
                <span className="text-xs bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent cursor-pointer hover:underline">
                  Important Information
                </span>
              </DialogTrigger>
              <DialogContent className={`${isMobile ? 'max-w-[95vw] w-[95vw] max-h-[90vh]' : 'max-w-4xl max-h-[80vh]'} overflow-hidden`}>
                <DialogHeader>
                  <DialogTitle>Referral Program Disclaimer</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-96">
                  <div className="p-6">
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
              </DialogContent>
            </Dialog>
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

      {/* Right Column - Cash Out */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cash Out
          </CardTitle>
          <CardDescription>
            Convert your referral credits into real value
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="bg-muted rounded-lg p-6">
              <div className="text-2xl font-bold text-muted-foreground mb-2">
                ${userProfile?.referral_credits || 0}
              </div>
              <p className="text-sm text-muted-foreground">Available Credits</p>
            </div>
            
            <div className="space-y-3">
              <Badge variant="secondary" className="w-full justify-center py-2">
                Cash Out Available November 1, 2025
              </Badge>
              
              <div className="text-xs text-muted-foreground text-left space-y-1">
                <p>• Credits will be available for cash out after beta</p>
                <p>• Minimum cash out: $10.00</p>
                <p>• Processing time: 3-5 business days</p>
                <p>• Cash out via USDC or USDM</p>
              </div>
            </div>
            
            <Button 
              onClick={() => setIsCashOutModalOpen(true)}
              disabled={(userProfile?.referral_credits || 0) < 10}
              className="w-full" 
              variant="outline"
            >
              {(userProfile?.referral_credits || 0) >= 10 ? 'Cash Out Now' : 'Cash Out (Min $10)'}
            </Button>
          </div>

          {/* Transaction History */}
          {userCashOutRequests && userCashOutRequests.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Recent Cash-Out Requests</h4>
              <div className="space-y-2">
                {userCashOutRequests.map((request) => (
                  <div key={request.id} className="bg-muted rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={request.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                          {request.status === 'completed' ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Completed</>
                          ) : (
                            <><Clock className="h-3 w-3 mr-1" /> Pending</>
                          )}
                        </Badge>
                        <span className="text-sm font-medium">${request.credit_amount}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(request.requested_at), 'MMM dd')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{request.selected_currency} • {request.selected_network}</span>
                      {request.tx_hash && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2"
                          onClick={() => window.open(getExplorerUrl(request.selected_network, request.tx_hash!), '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cash Out Modal */}
      <CashOutModal 
        open={isCashOutModalOpen}
        onOpenChange={setIsCashOutModalOpen}
        availableCredits={userProfile?.referral_credits || 0}
      />
    </div>
  );
};
