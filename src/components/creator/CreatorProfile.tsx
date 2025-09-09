
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star, MapPin, Calendar, Users, Award, ExternalLink, Globe, Youtube, Twitter, Facebook, Instagram, MessageCircle, BookOpen, Linkedin, Briefcase, Heart, Play, Crown } from 'lucide-react';
import { BookingModal } from '@/components/services/BookingModal';
import { useUserFollows } from '@/hooks/useUserFollows';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { UserHandle } from '@/components/ui/user-handle';
import { NETWORK_CONFIG } from '@/lib/contracts';
import { toast } from 'sonner';

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
  const navigate = useNavigate();
  const { user: currentUser, userProfile } = useAuth();
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAllReviewsModalOpen, setIsAllReviewsModalOpen] = useState(false);
  const { addFollow, removeFollow, isFollowing } = useUserFollows();

  // Check if current user is banned
  const isUserBanned = userProfile?.banned === true;

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
        // Get current user's handle for availability filtering
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        let currentUserHandle = null;
        if (currentUser) {
          const { data: currentUserData } = await supabase
            .from('users')
            .select('handle')
            .eq('id', currentUser.id)
            .single();
          currentUserHandle = currentUserData?.handle;
        }

        let servicesQuery = supabase
          .from('services')
          .select('*')
          .eq('creator_id', user.id)
          .eq('active', true);

        // Apply availability filter for public view
        if (currentUserHandle) {
          servicesQuery = servicesQuery.or(`availability_type.eq.everyone,and(availability_type.eq.select_user,target_username.eq.${currentUserHandle})`);
        } else {
          servicesQuery = servicesQuery.eq('availability_type', 'everyone');
        }

        const { data: servicesData, error: servicesError } = await servicesQuery;

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

  // Fetch signed URL for video intro if it exists
  const { data: videoUrl } = useQuery({
    queryKey: ['profile-video-intro-url', profile?.user?.id, profile?.creator?.intro_video_url],
    queryFn: async () => {
      if (!profile?.creator?.intro_video_url || !profile?.user?.id) return null;
      
      try {
        const fileName = `intro-videos/${profile.user.id}/intro.${profile.creator.intro_video_url.split('.').pop()}`;
        
        const { data, error } = await supabase.storage
          .from('deliverables')
          .createSignedUrl(fileName, 3600); // 1 hour expiry

        if (error) {
          console.error('Error creating signed URL:', error);
          return null;
        }

        return data.signedUrl;
      } catch (error) {
        console.error('Error getting video URL:', error);
        return null;
      }
    },
    enabled: !!profile?.creator?.intro_video_url && !!profile?.user?.id
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
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    
    // Check if user is banned - prevent booking
    if (isUserBanned) {
      toast.error('Your account access has been restricted. You cannot book services at this time.');
      return;
    }
    
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
        avatar_url: profile.user.avatar_url, // Now included since database functions return avatar_url
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
      avatar_url: user.avatar_url // Now included since database functions return avatar_url
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
                  <AvatarImage 
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.handle || 'User')}&background=3b82f6&color=ffffff&size=256`} 
                  />
                  <AvatarFallback className="text-2xl">
                    {user.handle?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                 <div>
                   <div className="flex items-center justify-center gap-3 mb-2">
                     <h1 className="text-2xl font-bold">
                       <UserHandle handle={user.handle} showAt={false} />
                     </h1>
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
                  <div className="text-center space-y-2">
                     <div className="flex justify-center items-center gap-1">
                       <div className="flex items-center">
                         {Array.from({ length: 5 }, (_, i) => {
                           const rating = creator?.rating ? creator.rating : 
                             reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : 0;
                           return (
                             <Star 
                               key={i} 
                               className={`h-4 w-4 ${
                                 i < Math.floor(rating) 
                                   ? 'fill-yellow-400 text-yellow-400' 
                                   : 'text-gray-300'
                               }`} 
                             />
                           );
                         })}
                       </div>
                       <span className="font-medium">
                         {creator?.rating ? creator.rating.toFixed(1) : 
                          reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}
                       </span>
                     </div>
                    <div className="text-muted-foreground">
                      ({reviews.length} reviews)
                    </div>
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
                          <AvatarImage 
                            src={review.reviewer?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.reviewer?.handle || 'User')}&background=6b7280&color=ffffff&size=64`} 
                          />
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAllReviewsModalOpen(true)}
                      className="w-full text-sm text-muted-foreground hover:text-foreground"
                    >
                      +{reviews.length - 3} more reviews
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Video Intro + Services (only for approved creators) */}
        <div className="lg:col-span-2">
          {isCreator && services ? (
            <div className="space-y-6">
              {/* Video Intro Section - Only for Pro creators with video */}
              {creator?.tier === 'pro' && creator?.intro_video_url && videoUrl && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Video Introduction
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <Crown className="h-3 w-3 mr-1" />
                        Pro
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        controls
                        className="w-full h-full object-contain"
                        preload="metadata"
                        poster="/placeholder.svg"
                      >
                        <source src={videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Services Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Services</CardTitle>
                </CardHeader>
                <CardContent>
                  {services.length > 0 ? (
                    <div className="grid gap-4">
                      {services.map((service: any) => (
                        <div key={service.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 mb-2">
                            <h3 className="font-semibold break-words">{service.title}</h3>
                            <div className="flex flex-col items-center gap-2 mt-4 md:mt-0 flex-shrink-0">
                              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                ${service.price_usdc}
                              </Badge>
                              {(() => {
                                // Extract network from payment_method (e.g., 'ethereum_usdc' -> 'ethereum')
                                const network = service.payment_method?.split('_')[0];
                                const networkConfig = network ? NETWORK_CONFIG[network as keyof typeof NETWORK_CONFIG] : null;
                                
                                return networkConfig ? (
                                  <Badge variant="outline" className="text-xs">
                                    <img src={networkConfig.icon} alt={networkConfig.name} className="h-3 w-3 mr-1" />
                                    {networkConfig.name}
                                  </Badge>
                                ) : null;
                              })()}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 text-left break-all line-clamp-3 overflow-hidden" dir="ltr">
                            {service.description}
                          </p>
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                            <span className="text-sm text-muted-foreground text-center md:text-left">
                              Delivery: {service.delivery_days} days
                            </span>
                            <Button 
                              size="sm" 
                              onClick={() => handleBookService(service)} 
                              className="mx-auto md:mx-0"
                              disabled={isUserBanned}
                            >
                              {!currentUser ? 'Sign In to Book' : 
                               isUserBanned ? 'Access Restricted' : 'Book Now'}
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
                        <p className="text-lg font-medium mb-2">Based Client</p>
                        <p className="text-muted-foreground">
                          This user is straight-up ballin'—booking the coolest creators and stacking legendary projects
                        </p>
                      </div>
                      {reviews && reviews.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          This user books epic services from top creators and keeps the marketplace buzzing
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

      {/* All Reviews Modal */}
      <Dialog open={isAllReviewsModalOpen} onOpenChange={setIsAllReviewsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>All Reviews ({reviews?.length || 0})</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-96">
            <div className="space-y-4 pr-4">
              {reviews?.map((review) => (
                <div key={review.id} className="space-y-2 pb-4 border-b border-border last:border-b-0">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={review.reviewer?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.reviewer?.handle || 'User')}&background=6b7280&color=ffffff&size=64`} 
                      />
                      <AvatarFallback>
                        {review.reviewer?.handle?.slice(0, 2).toUpperCase() || '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Link 
                          to={`/profile/${review.reviewer?.handle}`}
                          className="font-medium text-sm hover:text-primary transition-colors"
                          onClick={() => setIsAllReviewsModalOpen(false)}
                        >
                          @{review.reviewer?.handle}
                        </Link>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {review.comment}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};
