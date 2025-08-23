import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Star, MapPin, Calendar, Users, Award, ExternalLink, Globe, Youtube, Twitter, Facebook, Instagram, MessageCircle, BookOpen, Linkedin, Briefcase } from 'lucide-react';

export const CreatorProfile = () => {
  const { handle } = useParams();

  // Fetch creator data by handle
  const { data: creator, isLoading } = useQuery({
    queryKey: ['creator-profile', handle],
    queryFn: async () => {
      console.log('Fetching creator profile for handle:', handle);
      
      // First get the user by handle
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('handle', handle)
        .single();

      if (userError || !user) {
        console.error('Error fetching user:', userError);
        throw new Error('User not found');
      }

      // Then get the creator profile
      const { data: creatorData, error: creatorError } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (creatorError || !creatorData) {
        console.error('Error fetching creator:', creatorError);
        throw new Error('Creator not found');
      }

      // Get creator's services
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('creator_id', creatorData.id)
        .eq('active', true);

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
      }

      return {
        ...creatorData,
        user,
        services: services || []
      };
    },
    enabled: !!handle
  });

  // Social media icons mapping
  const socialIcons = {
    twitter: Twitter,
    facebook: Facebook,
    instagram: Instagram,
    telegram: MessageCircle,
    discord: Users,
    medium: BookOpen,
    linkedin: Linkedin
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Creator not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Creator Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <Avatar className="h-24 w-24 mx-auto">
                  <AvatarImage src={creator.user?.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {creator.user?.handle?.[0]?.toUpperCase() || 'C'}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h1 className="text-2xl font-bold">{creator.user?.handle}</h1>
                  {creator.headline && (
                    <p className="text-muted-foreground">{creator.headline}</p>
                  )}
                </div>

                <div className="flex justify-center items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{creator.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-muted-foreground">
                    ({creator.review_count} reviews)
                  </span>
                </div>

                <Badge variant={creator.tier === 'pro' ? 'default' : 'secondary'}>
                  {creator.tier.charAt(0).toUpperCase() + creator.tier.slice(1)} Creator
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* About Card */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Social Links Section */}
              {(creator.user?.social_links || creator.user?.website_url || creator.user?.portfolio_url || creator.user?.youtube_url) && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Links</h4>
                  <div className="space-y-2">
                    {/* Professional Links */}
                    {creator.user?.website_url && (
                      <a 
                        href={creator.user.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                        Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    
                    {creator.user?.portfolio_url && (
                      <a 
                        href={creator.user.portfolio_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                      >
                        <Briefcase className="h-4 w-4" />
                        Portfolio
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    
                    {creator.user?.youtube_url && (
                      <a 
                        href={creator.user.youtube_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                      >
                        <Youtube className="h-4 w-4" />
                        YouTube
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    {/* Social Media Links */}
                    {creator.user?.social_links && Object.entries(creator.user.social_links).map(([platform, url]) => {
                      if (!url) return null;
                      const IconComponent = socialIcons[platform as keyof typeof socialIcons];
                      if (!IconComponent) return null;
                      
                      return (
                        <a 
                          key={platform}
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                        >
                          <IconComponent className="h-4 w-4" />
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      );
                    })}
                  </div>
                  <Separator />
                </div>
              )}

              {/* Bio Section */}
              {creator.user?.bio && (
                <div>
                  <p className="text-sm leading-relaxed">{creator.user.bio}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="font-semibold">{creator.services?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">Services</div>
                </div>
                <div>
                  <div className="font-semibold">{creator.review_count}</div>
                  <div className="text-xs text-muted-foreground">Reviews</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Services */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
            </CardHeader>
            <CardContent>
              {creator.services && creator.services.length > 0 ? (
                <div className="grid gap-4">
                  {creator.services.map((service: any) => (
                    <div key={service.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{service.title}</h3>
                        <Badge variant="outline">${service.price_usdc}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {service.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Delivery: {service.delivery_days} days
                        </span>
                        <Button size="sm">Book Now</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No services available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
