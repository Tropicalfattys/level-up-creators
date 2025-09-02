import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Star, MapPin, Calendar, Users, Award, ExternalLink, Globe, Youtube, Twitter, Facebook, Instagram, MessageCircle, BookOpen, Linkedin, Briefcase, Heart } from 'lucide-react';
import { BookingModal } from '@/components/services/BookingModal';
import { useUserFollows } from '@/hooks/useUserFollows';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

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
  const { addFollow, removeFollow, isFollowing } = useUserFollows();

  // Helper function to get tier display name
  const getTierDisplayName = (tier: string | undefined): string => {
    if (!tier) return 'Basic Creator';
    
    switch (tier) {
      case 'basic':
        return 'Basic Creator';
      case 'mid':
        return 'Creator Plus';
      case 'pro':
        return 'Pro Creator';
      default:
        return 'Basic Creator';
    }
  };

  // Fetch user data by handle
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', handle],
    queryFn: async () => {
      console.log('Fetching profile for handle:', handle);
      
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

      // Try to get creator profile if exists
      const { data: creatorData, error: creatorError } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Don't throw error if no creator profile - user might just be a regular user
      if (creatorError && creatorError.code !== 'PGRST116') {
        console.error('Error fetching creator:', creatorError);
      }

      // Get services if user is a creator
      let services = [];
      if (creatorData && creatorData.approved) {
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('creator_id', user.id)
          .eq('active', true);

        if (servicesError) {
          console.error('Error fetching services:', servicesError);
        } else {
          services = servicesData || [];
        }
      }

      return {
        user,
        creator: creatorData,
        services,
        isCreator: creatorData?.approved || false
      };
    },
    enabled: !!handle && handle !== 'unknown'
  });

  // Fetch user reviews
  const { data: reviews } = useQuery({
    queryKey: ['user-reviews', profile?.user?.id],
    queryFn: async (): Promise<Review[]> => {
      if (!profile?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:users!reviews_reviewer_id_fkey (handle, avatar_url)
        `)
        .eq('reviewee_id', profile.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!profile?.user?.id
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
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  const handleBookService = (service: any) => {
    setSelectedService(service);
    setIsBookingModalOpen(true);
  };

  const handleFollowToggle = () => {
    if (!profile?.user) return;
    
    if (isFollowing(profile.user.id)) {
      removeFollow(profile.user.id);
    } else {
      const creatorToFollow = {
        id: profile.creator?.id || profile.user.id,
        user_id: profile.user.id,
        handle: profile.user.handle,
        avatar_url: profile.user.avatar_url,
        headline: profile.creator?.headline
      };
      addFollow(creatorToFollow);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!profile || !profile.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">User not found</h2>
          <p className="text-muted-foreground">The user profile you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const { user, creator, services, isCreator } = profile;

  // Transform data for BookingModal if user is a creator
  const creatorForModal = isCreator ? {
    id: creator?.id,
    user_id: user.id,
    users: {
      handle: user.handle,
      avatar_url: user.avatar_url
    }
  } : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <Avatar className="h-24 w-24 mx-auto">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {user.handle?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{user.handle}</h1>
                    {isCreator && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleFollowToggle}
                        className="p-2 hover:bg-red-50"
                      >
                        <Heart
                          className={`h-5 w-5 transition-colors ${
                            isFollowing(user.id)
                              ? 'fill-red-500 text-red-500'
                              : 'text-gray-400 hover:text-red-500'
                          }`}
                        />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Rating - only show if user has reviews */}
                {reviews && reviews.length > 0 && (
                  <div className="flex justify-center items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">
                        {creator?.rating ? creator.rating.toFixed(1) : 
                         reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      ({reviews.length} reviews)
                    </span>
                  </div>
                )}

                {/* Role Badge */}
                <Badge variant={isCreator ? 'default' : 'secondary'}>
                  {isCreator ? (
                    getTierDisplayName(creator?.tier)
                  ) : (
                    'Client'
                  )}
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
              {(user.social_links || user.website_url || user.portfolio_url || user.youtube_url) && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Links</h4>
                  <div className="space-y-2">
                    {/* Professional Links */}
                    {user.website_url && (
                      <a 
                        href={formatUrl(user.website_url)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                        Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    
                    {user.portfolio_url && (
                      <a 
                        href={formatUrl(user.portfolio_url)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                      >
                        <Briefcase className="h-4 w-4" />
                        Portfolio
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    
                    {user.youtube_url && (
                      <a 
                        href={formatUrl(user.youtube_url)} 
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
                    {user.social_links && Object.entries(user.social_links).map(([platform, url]) => {
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
              {user.bio && (
                <div>
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{user.bio}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="font-semibold">{services?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    {isCreator ? 'Services' : 'Projects'}
                  </div>
                </div>
                <div>
                  <div className="font-semibold">{reviews?.length || 0}</div>
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
                            <Link 
                              to={`/profile/${review.reviewer?.handle}`}
                              className="font-medium text-sm hover:text-primary transition-colors"
                            >
                              @{review.reviewer?.handle}
                            </Link>
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

        {/* Right Column - Services (only for approved creators) */}
        <div className="lg:col-span-2">
          {isCreator && services ? (
            <Card>
              <CardHeader>
                <CardTitle>Services</CardTitle>
              </CardHeader>
              <CardContent>
                {services.length > 0 ? (
                  <div className="grid gap-4">
                    {services.map((service: any) => (
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
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  {user.role === 'client' ? 'Client Profile' : 'Profile Information'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  {user.role === 'client' ? (
                    <div className="space-y-4">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-lg font-medium mb-2">Client Member</p>
                        <p className="text-muted-foreground">
                          This user books services from creators on our platform.
                        </p>
                      </div>
                      {reviews && reviews.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          View their reviews and activity in the sidebar.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Award className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-lg font-medium mb-2">Community Member</p>
                        <p className="text-muted-foreground">
                          Welcome to our creative community!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Booking Modal - only show for creators */}
      {selectedService && creatorForModal && (
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
