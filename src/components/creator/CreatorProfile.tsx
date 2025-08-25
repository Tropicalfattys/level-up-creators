import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Star, MapPin, Calendar, Users, Award, ExternalLink, Globe, Youtube, Twitter, Facebook, Instagram, MessageCircle, BookOpen, Linkedin, Briefcase } from 'lucide-react';
import { BookingModal } from '@/components/services/BookingModal';
import { format } from 'date-fns';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: {
    handle: string;
    avatar_url?: string;
  };
}

export const CreatorProfile = () => {
  const { handle } = useParams();
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Fetch creator data by handle
  const { data: creator, isLoading } = useQuery({
    queryKey: ['creator-profile', handle],
    queryFn: async () => {
      console.log('Fetching creator profile for handle:', handle);
      
      if (!handle || handle === 'unknown') {
        throw new Error('No valid handle provided');
      }
      
      // First get the user by handle
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('handle', handle)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user:', userError);
        throw new Error('Error fetching user: ' + userError.message);
      }
      
      if (!user) {
        console.error('User not found for handle:', handle);
        throw new Error('User not found');
      }

      // Then get the creator profile
      const { data: creatorData, error: creatorError } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (creatorError) {
        console.error('Error fetching creator:', creatorError);
        throw new Error('Creator profile error: ' + creatorError.message);
      }
      
      if (!creatorData) {
        console.error('Creator profile not found for user:', user.id);
        throw new Error('Creator profile not found');
      }

      // Get creator's services
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('creator_id', user.id)
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
    enabled: !!handle && handle !== 'unknown'
  });

  // Fetch creator reviews
  const { data: reviews } = useQuery({
    queryKey: ['creator-reviews', creator?.user_id],
    queryFn: async (): Promise<Review[]> => {
      if (!creator?.user_id) return [];
      
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:users!reviews_reviewer_id_fkey (handle, avatar_url)
        `)
        .eq('reviewee_id', creator.user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!creator?.user_id
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

  // Helper function to format URLs properly
  const formatUrl = (url: string) => {
    if (!url) return '';
    // If URL doesn't start with http:// or https://, add https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  const handleBookService = (service: any) => {
    setSelectedService(service);
    setIsBookingModalOpen(true);
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
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Creator not found</h2>
          <p className="text-muted-foreground">The creator profile you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  // Transform creator data to match BookingModal expectations
  const creatorForModal = {
    id: creator.id,
    user_id: creator.user_id,
    users: {
      handle: creator.user?.handle,
      avatar_url: creator.user?.avatar_url
    }
  };

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
                    <span className="font-medium">{creator.rating ? creator.rating.toFixed(1) : '0.0'}</span>
                  </div>
                  <span className="text-muted-foreground">
                    ({creator.review_count || 0} reviews)
                  </span>
                </div>

                <Badge variant={creator.tier === 'pro' ? 'default' : 'secondary'}>
                  {creator.tier ? creator.tier.charAt(0).toUpperCase() + creator.tier.slice(1) : 'Basic'} Creator
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
                        href={formatUrl(creator.user.website_url)} 
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
                        href={formatUrl(creator.user.portfolio_url)} 
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
                        href={formatUrl(creator.user.youtube_url)} 
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
                          href={formatUrl(url as string)} 
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
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{creator.user.bio}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="font-semibold">{creator.services?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">Services</div>
                </div>
                <div>
                  <div className="font-semibold">{creator.review_count || 0}</div>
                  <div className="text-xs text-muted-foreground">Reviews</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Summary Card */}
          {reviews && reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Reviews ({reviews.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="space-y-2">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={review.reviewer?.avatar_url} />
                          <AvatarFallback>
                            {review.reviewer?.handle?.slice(0, 2).toUpperCase() || '??'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">@{review.reviewer?.handle}</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${
                                    star <= review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {review.comment}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(review.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {reviews.length > 3 && (
                    <p className="text-sm text-muted-foreground text-center">
                      +{reviews.length - 3} more reviews
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
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
                        <Button size="sm" onClick={() => handleBookService(service)}>
                          Book Now
                        </Button>
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

      {/* Booking Modal */}
      {selectedService && (
        <BookingModal
          service={selectedService}
          creator={creatorForModal}
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setSelectedService(null);
          }}
        />
      )}
    </div>
  );
};
