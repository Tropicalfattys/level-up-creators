import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Globe, Briefcase, Youtube, Twitter, Facebook, Instagram, MessageCircle, Users, BookOpen, Linkedin, Wallet, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { NETWORK_CONFIG } from '@/lib/contracts';


export default function Settings() {
  const { userProfile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    handle: '',
    bio: '',
    avatar_url: '',
    website_url: '',
    portfolio_url: '',
    youtube_url: '',
    social_links: {},
    payout_address_eth: '',
    payout_address_sol: '',
    payout_address_cardano: '',
    payout_address_bsc: '',
    payout_address_sui: ''
  });

  // Initialize profile data when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setProfileData({
        handle: userProfile.handle || '',
        bio: userProfile.bio || '',
        avatar_url: userProfile.avatar_url || '',
        website_url: userProfile.website_url || '',
        portfolio_url: userProfile.portfolio_url || '',
        youtube_url: userProfile.youtube_url || '',
        social_links: userProfile.social_links || {},
        payout_address_eth: (userProfile as any).payout_address_eth || '',
        payout_address_sol: (userProfile as any).payout_address_sol || '',
        payout_address_cardano: (userProfile as any).payout_address_cardano || '',
        payout_address_bsc: (userProfile as any).payout_address_bsc || '',
        payout_address_sui: (userProfile as any).payout_address_sui || ''
      });
    }
  }, [userProfile]);

  const updateProfile = useMutation({
    mutationFn: async (data: any) => {
      if (!userProfile?.id) throw new Error('No user profile');
      
      const { error } = await supabase
        .from('users')
        .update({
          handle: data.handle,
          bio: data.bio,
          avatar_url: data.avatar_url,
          website_url: data.website_url,
          portfolio_url: data.portfolio_url,
          youtube_url: data.youtube_url,
          social_links: data.social_links,
          payout_address_eth: data.payout_address_eth,
          payout_address_sol: data.payout_address_sol,
          payout_address_cardano: data.payout_address_cardano,
          payout_address_bsc: data.payout_address_bsc,
          payout_address_sui: data.payout_address_sui,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      refreshProfile();
    },
    onError: (error: any) => {
      toast.error('Failed to update profile: ' + error.message);
    }
  });

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      
      // Create a data URL for the image
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setProfileData(prev => ({ ...prev, avatar_url: dataUrl }));
        toast.success('Profile picture updated! Click Save Changes to apply.');
      };
      reader.readAsDataURL(file);
      
    } catch (error: any) {
      toast.error('Error uploading avatar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = () => {
    updateProfile.mutate(profileData);
  };

  const updateSocialLink = (platform: string, url: string) => {
    setProfileData(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: url
      }
    }));
  };

  // Wallet validation functions
  const validateWalletAddress = (address: string, network: string): boolean => {
    if (!address) return true; // Empty addresses are allowed
    switch (network) {
      case 'ethereum':
      case 'bsc':
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      case 'solana':
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
      case 'sui':
        return /^0x[a-fA-F0-9]{64}$/.test(address);
      case 'cardano':
        return /^addr1[a-z0-9]{98,}$/.test(address);
      default:
        return false;
    }
  };

  const getWalletValidationError = (address: string, network: string): string | null => {
    if (!address) return null;
    if (!validateWalletAddress(address, network)) {
      switch (network) {
        case 'ethereum':
        case 'bsc':
          return 'Invalid Ethereum/BSC address format (must start with 0x)';
        case 'solana':
          return 'Invalid Solana address format';
        case 'sui':
          return 'Invalid SUI address format (must be 0x followed by 64 hex characters)';
        case 'cardano':
          return 'Invalid Cardano address format (must start with addr1)';
        default:
          return 'Invalid address format';
      }
    }
    return null;
  };

  const tabOptions = [
    { value: 'profile', label: 'Profile' },
    { value: 'social', label: 'Social & Links' },
    { value: 'payments', label: 'Payments' },
    { value: 'notifications', label: 'Notifications' },
    { value: 'security', label: 'Security' }
  ];

  return (
    <div className={isMobile ? "px-4 py-8" : "container mx-auto px-4 py-8"}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {isMobile ? (
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a section" />
            </SelectTrigger>
            <SelectContent>
              {tabOptions.map((tab) => (
                <SelectItem key={tab.value} value={tab.value}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="social">Social & Links</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription className="flex flex-col gap-1">
                Update your public profile information
{isMobile ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:underline">
                        How It Works
                      </span>
                    </PopoverTrigger>
                    <PopoverContent className="w-[90vw] max-h-[75vh] p-0 fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[60]" side="bottom" align="center">
                      <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between p-4 border-b">
                          <h4 className="font-semibold text-lg">Profile & Settings Information</h4>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <X className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                        </div>
                        <ScrollArea className="flex-1 px-4">
                          <div className="text-sm space-y-4 py-4">
                            <p>Your account settings are organized into five tabs: Profile, Social Links, Payments, Notifications, and Security. Please review the following carefully to ensure your account is properly configured:</p>
                            
                            <div>
                              <h5 className="font-semibold mb-2">1. Profile</h5>
                              <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Upload a profile photo to personalize your account.</li>
                                <li>Update your handle (your public name on the platform).</li>
                                <li>Add or edit your bio information.</li>
                                <li>Note: Your registered email address cannot be changed.</li>
                              </ul>
                            </div>

                            <div>
                              <h5 className="font-semibold mb-2">2. Social Links</h5>
                              <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Add links to your website, portfolio, and supported social platforms: YouTube, Twitter (X), Facebook, Telegram, Instagram, Discord, Medium, and LinkedIn.</li>
                                <li>These links appear on your public profile.</li>
                                <li><strong>Verification Requirement:</strong></li>
                                <li>To apply for verification, you must maintain at least two active social media accounts (e.g., Twitter + YouTube).</li>
                                <li>You must also post your unique referral link (found in your dashboard's referral section) on each social media account you submit.</li>
                                <li>During verification, our team will check your profile links and confirm ownership by verifying the posted referral link on your external accounts.</li>
                                <li>Verification is part of the "PRO Creator" plan and unlocks additional trust & benefits.</li>
                              </ul>
                            </div>

                            <div>
                              <h5 className="font-semibold mb-2">3. Payments</h5>
                              <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Add up to five cryptocurrency wallets.</li>
                                <li>These wallets are used for:</li>
                                <li className="ml-4">• Payouts (for creators providing services).</li>
                                <li className="ml-4">• Refunds (if issued through dispute resolution).</li>
                                <li>It is your responsibility to keep wallet addresses accurate and up-to-date.</li>
                              </ul>
                            </div>

                            <div>
                              <h5 className="font-semibold mb-2">4. Notifications</h5>
                              <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Manage your email, push, and in-app notification preferences.</li>
                                <li>Ensure you remain informed about bookings, payments, and updates.</li>
                              </ul>
                            </div>

                            <div>
                              <h5 className="font-semibold mb-2">5. Security</h5>
                              <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Review and update your security settings, such as two-factor authentication (2FA).</li>
                                <li>Keeping your account secure helps protect both you and your clients/creators.</li>
                              </ul>
                            </div>

                            <div>
                              <h5 className="font-semibold mb-2">Verified Pro Creator Features</h5>
                              <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Once your account achieves Verified Pro Creator status, you may upload a profile video to your account.</li>
                                <li>This feature is available only to verified pro creators and will appear in your public profile settings that clients see when booking services.</li>
                              </ul>
                            </div>

                            <div className="border-t pt-4">
                              <p className="font-semibold text-amber-600">⚠️ Important:</p>
                              <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                                <li>Keep all profile details, wallet addresses, and social links accurate.</li>
                                <li>Failure to maintain correct information may delay payouts, refunds, or verification status.</li>
                                <li>Verification is contingent on active, up-to-date social accounts and posted referral links.</li>
                              </ul>
                            </div>
                          </div>
                        </ScrollArea>
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:underline">
                        How It Works
                      </span>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-96 p-0 fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50" side="top" align="center">
                      <div className="p-4">
                        <h4 className="font-semibold text-lg mb-3">Profile & Settings Information</h4>
                        <ScrollArea className="h-96">
                          <div className="text-sm space-y-4 pr-4">
                            <p>Your account settings are organized into five tabs: Profile, Social Links, Payments, Notifications, and Security. Please review the following carefully to ensure your account is properly configured:</p>
                            
                            <div>
                              <h5 className="font-semibold mb-2">1. Profile</h5>
                              <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Upload a profile photo to personalize your account.</li>
                                <li>Update your handle (your public name on the platform).</li>
                                <li>Add or edit your bio information.</li>
                                <li>Note: Your registered email address cannot be changed.</li>
                              </ul>
                            </div>

                            <div>
                              <h5 className="font-semibold mb-2">2. Social Links</h5>
                              <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Add links to your website, portfolio, and supported social platforms: YouTube, Twitter (X), Facebook, Telegram, Instagram, Discord, Medium, and LinkedIn.</li>
                                <li>These links appear on your public profile.</li>
                                <li><strong>Verification Requirement:</strong></li>
                                <li>To apply for verification, you must maintain at least two active social media accounts (e.g., Twitter + YouTube).</li>
                                <li>You must also post your unique referral link (found in your dashboard's referral section) on each social media account you submit.</li>
                                <li>During verification, our team will check your profile links and confirm ownership by verifying the posted referral link on your external accounts.</li>
                                <li>Verification is part of the "PRO Creator" plan and unlocks additional trust & benefits.</li>
                              </ul>
                            </div>

                            <div>
                              <h5 className="font-semibold mb-2">3. Payments</h5>
                              <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Add up to five cryptocurrency wallets.</li>
                                <li>These wallets are used for:</li>
                                <li className="ml-4">• Payouts (for creators providing services).</li>
                                <li className="ml-4">• Refunds (if issued through dispute resolution).</li>
                                <li>It is your responsibility to keep wallet addresses accurate and up-to-date.</li>
                              </ul>
                            </div>

                            <div>
                              <h5 className="font-semibold mb-2">4. Notifications</h5>
                              <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Manage your email, push, and in-app notification preferences.</li>
                                <li>Ensure you remain informed about bookings, payments, and updates.</li>
                              </ul>
                            </div>

                            <div>
                              <h5 className="font-semibold mb-2">5. Security</h5>
                              <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Review and update your security settings, such as two-factor authentication (2FA).</li>
                                <li>Keeping your account secure helps protect both you and your clients/creators.</li>
                              </ul>
                            </div>

                            <div>
                              <h5 className="font-semibold mb-2">Verified Pro Creator Features</h5>
                              <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Once your account achieves Verified Pro Creator status, you may upload a profile video to your account.</li>
                                <li>This feature is available only to verified pro creators and will appear in your public profile settings that clients see when booking services.</li>
                              </ul>
                            </div>

                            <div className="border-t pt-4">
                              <p className="font-semibold text-amber-600">⚠️ Important:</p>
                              <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                                <li>Keep all profile details, wallet addresses, and social links accurate.</li>
                                <li>Failure to maintain correct information may delay payouts, refunds, or verification status.</li>
                                <li>Verification is contingent on active, up-to-date social accounts and posted referral links.</li>
                              </ul>
                            </div>
                          </div>
                        </ScrollArea>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isMobile ? (
                <>
                  {/* Profile Picture Upload */}
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profileData.avatar_url} alt="Profile" />
                      <AvatarFallback className="text-lg">
                        {profileData.handle?.[0]?.toUpperCase() || userProfile?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <Label htmlFor="avatar-upload" className="cursor-pointer">
                        <Button variant="outline" size="sm" asChild>
                          <div>
                            <Upload className="h-4 w-4 mr-2" />
                            {uploading ? 'Uploading...' : 'Upload Photo'}
                          </div>
                        </Button>
                      </Label>
                      <Input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={uploadAvatar}
                        disabled={uploading}
                        className="hidden"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        JPG, PNG or GIF. Max size 5MB.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="handle">Handle</Label>
                      <Input
                        id="handle"
                        value={profileData.handle}
                        onChange={(e) => setProfileData(prev => ({ ...prev, handle: e.target.value }))}
                        placeholder="@username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userProfile?.email || ''}
                        disabled
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself..."
                        className="min-h-20"
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={updateProfile.isPending} className="w-full">
                    {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <>
                  {/* Profile Picture Upload */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profileData.avatar_url} alt="Profile" />
                      <AvatarFallback className="text-lg">
                        {profileData.handle?.[0]?.toUpperCase() || userProfile?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Label htmlFor="avatar-upload" className="cursor-pointer">
                        <Button variant="outline" size="sm" asChild>
                          <div>
                            <Upload className="h-4 w-4 mr-2" />
                            {uploading ? 'Uploading...' : 'Upload Photo'}
                          </div>
                        </Button>
                      </Label>
                      <Input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={uploadAvatar}
                        disabled={uploading}
                        className="hidden"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        JPG, PNG or GIF. Max size 5MB.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="handle">Handle</Label>
                      <Input
                        id="handle"
                        value={profileData.handle}
                        onChange={(e) => setProfileData(prev => ({ ...prev, handle: e.target.value }))}
                        placeholder="@username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userProfile?.email || ''}
                        disabled
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      className="min-h-20"
                    />
                  </div>

                  <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Media & Links</CardTitle>
              <CardDescription className="flex flex-col gap-1">
                Add your social media profiles and website links to appear on your creator profile
{isMobile ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:underline">
                        Important Disclaimer
                      </span>
                    </PopoverTrigger>
                    <PopoverContent className="w-[90vw] max-h-[75vh] p-0 fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[60]" side="bottom" align="center">
                      <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between p-4 border-b">
                          <h4 className="font-semibold text-lg">Social Media Links Disclaimer</h4>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <X className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                        </div>
                        <ScrollArea className="flex-1 px-4">
                          <div className="text-sm space-y-4 py-4">
                            <ul className="list-disc list-inside space-y-2">
                              <li>All social media links you add here will be publicly visible on your profile.</li>
                              <li>If you are applying to become a Pro Creator (verified status), your social links will be reviewed as part of the verification process.</li>
                            </ul>
                            
                            <div>
                              <h5 className="font-semibold mb-2">Verification Requirements:</h5>
                              <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>You must connect at least two active social media accounts (e.g., Twitter + YouTube, Instagram + LinkedIn).</li>
                                <li>On each of these accounts, you are required to post your unique referral link (found in your dashboard's referral section).</li>
                                <li>Our team will verify that the referral link is live and visible on your accounts before your application can be approved.</li>
                              </ul>
                            </div>

                            <div className="border-t pt-4">
                              <p className="font-semibold text-amber-600">⚠️ Important:</p>
                              <p className="mt-2">If your referral links are not posted and visible on at least two connected social accounts, your Pro Creator application will be denied.</p>
                            </div>
                          </div>
                        </ScrollArea>
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:underline">
                        Important Disclaimer
                      </span>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-96 p-0 fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50" side="top" align="center">
                      <div className="p-4">
                        <h4 className="font-semibold text-lg mb-3">Social Media Links Disclaimer</h4>
                        <ScrollArea className="h-96">
                          <div className="text-sm space-y-4 pr-4">
                            <ul className="list-disc list-inside space-y-2">
                              <li>All social media links you add here will be publicly visible on your profile.</li>
                              <li>If you are applying to become a Pro Creator (verified status), your social links will be reviewed as part of the verification process.</li>
                            </ul>
                            
                            <div>
                              <h5 className="font-semibold mb-2">Verification Requirements:</h5>
                              <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>You must connect at least two active social media accounts (e.g., Twitter + YouTube, Instagram + LinkedIn).</li>
                                <li>On each of these accounts, you are required to post your unique referral link (found in your dashboard's referral section).</li>
                                <li>Our team will verify that the referral link is live and visible on your accounts before your application can be approved.</li>
                              </ul>
                            </div>

                            <div className="border-t pt-4">
                              <p className="font-semibold text-amber-600">⚠️ Important:</p>
                              <p className="mt-2">If your referral links are not posted and visible on at least two connected social accounts, your Pro Creator application will be denied.</p>
                            </div>
                          </div>
                        </ScrollArea>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Website and Portfolio Links */}
              <div className="space-y-4">
                <h4 className="font-medium">Professional Links</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="website">
                      <Globe className="h-4 w-4 inline mr-2" />
                      Website URL
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      value={profileData.website_url}
                      onChange={(e) => setProfileData(prev => ({ ...prev, website_url: e.target.value }))}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="portfolio">
                      <Briefcase className="h-4 w-4 inline mr-2" />
                      Portfolio URL
                    </Label>
                    <Input
                      id="portfolio"
                      type="url"
                      value={profileData.portfolio_url}
                      onChange={(e) => setProfileData(prev => ({ ...prev, portfolio_url: e.target.value }))}
                      placeholder="https://portfolio.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="youtube">
                    <Youtube className="h-4 w-4 inline mr-2" />
                    YouTube Channel
                  </Label>
                  <Input
                    id="youtube"
                    type="url"
                    value={profileData.youtube_url}
                    onChange={(e) => setProfileData(prev => ({ ...prev, youtube_url: e.target.value }))}
                    placeholder="https://youtube.com/@username"
                  />
                </div>
              </div>

              {/* Social Media Links */}
              <div className="space-y-4">
                <h4 className="font-medium">Social Media</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="twitter">
                      <Twitter className="h-4 w-4 inline mr-2" />
                      Twitter/X
                    </Label>
                    <Input
                      id="twitter"
                      type="url"
                      value={(profileData.social_links as any)?.twitter || ''}
                      onChange={(e) => updateSocialLink('twitter', e.target.value)}
                      placeholder="https://twitter.com/username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="facebook">
                      <Facebook className="h-4 w-4 inline mr-2" />
                      Facebook
                    </Label>
                    <Input
                      id="facebook"
                      type="url"
                      value={(profileData.social_links as any)?.facebook || ''}
                      onChange={(e) => updateSocialLink('facebook', e.target.value)}
                      placeholder="https://facebook.com/username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram">
                      <Instagram className="h-4 w-4 inline mr-2" />
                      Instagram
                    </Label>
                    <Input
                      id="instagram"
                      type="url"
                      value={(profileData.social_links as any)?.instagram || ''}
                      onChange={(e) => updateSocialLink('instagram', e.target.value)}
                      placeholder="https://instagram.com/username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telegram">
                      <MessageCircle className="h-4 w-4 inline mr-2" />
                      Telegram
                    </Label>
                    <Input
                      id="telegram"
                      type="url"
                      value={(profileData.social_links as any)?.telegram || ''}
                      onChange={(e) => updateSocialLink('telegram', e.target.value)}
                      placeholder="https://t.me/username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="discord">
                      <Users className="h-4 w-4 inline mr-2" />
                      Discord
                    </Label>
                    <Input
                      id="discord"
                      type="text"
                      value={(profileData.social_links as any)?.discord || ''}
                      onChange={(e) => updateSocialLink('discord', e.target.value)}
                      placeholder="username#1234"
                    />
                  </div>
                  <div>
                    <Label htmlFor="medium">
                      <BookOpen className="h-4 w-4 inline mr-2" />
                      Medium
                    </Label>
                    <Input
                      id="medium"
                      type="url"
                      value={(profileData.social_links as any)?.medium || ''}
                      onChange={(e) => updateSocialLink('medium', e.target.value)}
                      placeholder="https://medium.com/@username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">
                      <Linkedin className="h-4 w-4 inline mr-2" />
                      LinkedIn
                    </Label>
                    <Input
                      id="linkedin"
                      type="url"
                      value={(profileData.social_links as any)?.linkedin || ''}
                      onChange={(e) => updateSocialLink('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? 'Saving...' : 'Save Social Links'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about bookings and messages
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about important updates in real-time
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about new features and promotions
                  </p>
                </div>
                <Switch />
              </div>

              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Payout Wallet Addresses
              </CardTitle>
              <CardDescription>
                Configure your wallet addresses for receiving payouts after services are completed.
                These addresses will be used by admins to send your earnings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ethereum Wallet */}
              <div className="space-y-2">
                 <Label htmlFor="eth-wallet" className="flex items-center gap-2">
                   <img 
                     src={NETWORK_CONFIG.ethereum.icon} 
                     alt="Ethereum" 
                     className="w-6 h-6"
                   />
                   Ethereum Wallet Address
                 </Label>
                <Input
                  id="eth-wallet"
                  placeholder="0x..."
                  value={profileData.payout_address_eth}
                  onChange={(e) => setProfileData(prev => ({ ...prev, payout_address_eth: e.target.value }))}
                  className={getWalletValidationError(profileData.payout_address_eth, 'ethereum') ? 'border-red-500' : ''}
                />
                {getWalletValidationError(profileData.payout_address_eth, 'ethereum') && (
                  <p className="text-sm text-red-500">
                    {getWalletValidationError(profileData.payout_address_eth, 'ethereum')}
                  </p>
                )}
              </div>

              {/* Solana Wallet */}
              <div className="space-y-2">
                 <Label htmlFor="sol-wallet" className="flex items-center gap-2">
                   <img 
                     src={NETWORK_CONFIG.solana.icon} 
                     alt="Solana" 
                     className="w-6 h-6"
                   />
                   Solana Wallet Address
                 </Label>
                <Input
                  id="sol-wallet"
                  placeholder="Enter Solana address..."
                  value={profileData.payout_address_sol}
                  onChange={(e) => setProfileData(prev => ({ ...prev, payout_address_sol: e.target.value }))}
                  className={getWalletValidationError(profileData.payout_address_sol, 'solana') ? 'border-red-500' : ''}
                />
                {getWalletValidationError(profileData.payout_address_sol, 'solana') && (
                  <p className="text-sm text-red-500">
                    {getWalletValidationError(profileData.payout_address_sol, 'solana')}
                  </p>
                )}
              </div>

              {/* BSC Wallet */}
              <div className="space-y-2">
                 <Label htmlFor="bsc-wallet" className="flex items-center gap-2">
                   <img 
                     src={NETWORK_CONFIG.bsc.icon} 
                     alt="BSC" 
                     className="w-6 h-6"
                   />
                   BSC Wallet Address
                 </Label>
                <Input
                  id="bsc-wallet"
                  placeholder="0x..."
                  value={profileData.payout_address_bsc}
                  onChange={(e) => setProfileData(prev => ({ ...prev, payout_address_bsc: e.target.value }))}
                  className={getWalletValidationError(profileData.payout_address_bsc, 'bsc') ? 'border-red-500' : ''}
                />
                {getWalletValidationError(profileData.payout_address_bsc, 'bsc') && (
                  <p className="text-sm text-red-500">
                    {getWalletValidationError(profileData.payout_address_bsc, 'bsc')}
                  </p>
                )}
              </div>

              {/* Sui Wallet */}
              <div className="space-y-2">
                 <Label htmlFor="sui-wallet" className="flex items-center gap-2">
                   <img 
                     src={NETWORK_CONFIG.sui.icon} 
                     alt="Sui" 
                     className="w-6 h-6"
                   />
                   Sui Wallet Address
                 </Label>
                <Input
                  id="sui-wallet"
                  placeholder="0x..."
                  value={profileData.payout_address_sui}
                  onChange={(e) => setProfileData(prev => ({ ...prev, payout_address_sui: e.target.value }))}
                  className={getWalletValidationError(profileData.payout_address_sui, 'sui') ? 'border-red-500' : ''}
                />
                {getWalletValidationError(profileData.payout_address_sui, 'sui') && (
                  <p className="text-sm text-red-500">
                    {getWalletValidationError(profileData.payout_address_sui, 'sui')}
                  </p>
                )}
              </div>

              {/* Cardano Wallet */}
              <div className="space-y-2">
                 <Label htmlFor="cardano-wallet" className="flex items-center gap-2">
                   <img 
                     src={NETWORK_CONFIG.cardano.icon} 
                     alt="Cardano" 
                     className="w-6 h-6"
                   />
                   Cardano Wallet Address
                 </Label>
                <Input
                  id="cardano-wallet"
                  placeholder="addr1..."
                  value={profileData.payout_address_cardano}
                  onChange={(e) => setProfileData(prev => ({ ...prev, payout_address_cardano: e.target.value }))}
                  className={getWalletValidationError(profileData.payout_address_cardano, 'cardano') ? 'border-red-500' : ''}
                />
                {getWalletValidationError(profileData.payout_address_cardano, 'cardano') && (
                  <p className="text-sm text-red-500">
                    {getWalletValidationError(profileData.payout_address_cardano, 'cardano')}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Important Notes:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• These addresses are used for receiving payouts after completing services</li>
                  <li>• Make sure you control these wallet addresses</li>
                  <li>• Double-check addresses before saving - incorrect addresses may result in lost funds</li>
                  <li>• You only need to provide addresses for networks you plan to accept payments on</li>
                </ul>
              </div>

              <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? 'Saving...' : 'Save Wallet Addresses'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and privacy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Add an extra layer of security to your account
                </p>
                <Button variant="outline">Enable 2FA</Button>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    Coming Soon
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
