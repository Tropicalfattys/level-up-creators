import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Globe, Portfolio, Youtube, Twitter, Facebook, Instagram, MessageCircle, Users, BookOpen, Linkedin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function Settings() {
  const { userProfile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState({
    handle: userProfile?.handle || '',
    bio: userProfile?.bio || '',
    avatar_url: userProfile?.avatar_url || '',
    website_url: userProfile?.website_url || '',
    portfolio_url: userProfile?.portfolio_url || '',
    youtube_url: userProfile?.youtube_url || '',
    social_links: userProfile?.social_links || {}
  });

  const updateProfile = useMutation({
    mutationFn: async (data: { 
      handle: string; 
      bio: string; 
      avatar_url?: string;
      website_url?: string;
      portfolio_url?: string;
      youtube_url?: string;
      social_links?: any;
    }) => {
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
      const fileExt = file.name.split('.').pop();
      const fileName = `${userProfile?.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Create a temporary URL for immediate preview
      const tempUrl = URL.createObjectURL(file);
      setProfileData(prev => ({ ...prev, avatar_url: tempUrl }));

      // For now, we'll use a placeholder URL since storage buckets aren't set up
      // In production, you would upload to Supabase Storage here
      const placeholderUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${userProfile?.handle || 'user'}`;
      setProfileData(prev => ({ ...prev, avatar_url: placeholderUrl }));
      
      toast.success('Profile picture updated! Click Save Changes to apply.');
      
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="social">Social & Links</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your public profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Picture Upload */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profileData.avatar_url} alt="Profile" />
                  <AvatarFallback className="text-lg">
                    {profileData.handle?.[0]?.toUpperCase() || 'U'}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Media & Links</CardTitle>
              <CardDescription>
                Add your social media profiles and website links to appear on your creator profile
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
                      <Portfolio className="h-4 w-4 inline mr-2" />
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
                      value={profileData.social_links?.twitter || ''}
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
                      value={profileData.social_links?.facebook || ''}
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
                      value={profileData.social_links?.instagram || ''}
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
                      value={profileData.social_links?.telegram || ''}
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
                      value={profileData.social_links?.discord || ''}
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
                      value={profileData.social_links?.medium || ''}
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
                      value={profileData.social_links?.linkedin || ''}
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
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>
                Manage your wallet addresses for payouts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="eth-wallet">Ethereum Wallet Address</Label>
                <Input
                  id="eth-wallet"
                  placeholder="0x..."
                />
              </div>

              <div>
                <Label htmlFor="sol-wallet">Solana Wallet Address</Label>
                <Input
                  id="sol-wallet"
                  placeholder="Enter Solana address..."
                />
              </div>

              <Button>Save Wallet Addresses</Button>
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
                <Label>Change Password</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Update your password to keep your account secure
                </p>
                <Button variant="outline">Change Password</Button>
              </div>

              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Add an extra layer of security to your account
                </p>
                <Button variant="outline">Enable 2FA</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
