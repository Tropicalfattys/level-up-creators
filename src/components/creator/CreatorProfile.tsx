import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Clock, DollarSign, ArrowLeft, Calendar, Heart, MessageSquare, Share2, Play, ChevronDown } from 'lucide-react';
import { BookingModal } from '@/components/services/BookingModal';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CreatorProfileData {
  id: string;
  user_id: string;
  handle: string;
  avatar_url?: string;
  headline?: string;
  bio?: string;
  category?: string;
  rating: number;
  review_count: number;
  created_at: string;
  tier: string;
}

interface ServiceData {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  price_usdc: number;
  delivery_days: number;
  category?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface ReviewData {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  reviewer: {
    handle: string;
    avatar_url?: string;
  };
}

export const CreatorProfile = () => {
  const { handle } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const { data: creator, isLoading } = useQuery({
    queryKey: ['creator-profile', handle],
    queryFn: async (): Promise<CreatorProfileData | null> => {
      if (!handle) return null;

      // First get the user by handle
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, handle, avatar_url, bio')
        .eq('handle', handle)
        .maybeSingle();

      if (userError || !userData) {
        console.error('Error fetching user:', userError);
        return null;
      }

      // Then get the creator profile for this user
      const { data: creatorData, error: creatorError } = await supabase
        .from('creators')
        .select('id, user_id, headline, category, rating, review_count, tier, created_at')
        .eq('user_id', userData.id)
        .eq('approved', true)
        .maybeSingle();

      if (creatorError || !creatorData) {
        console.error('Error fetching creator:', creatorError);
        return null;
      }

      return {
        id: creatorData.id,
        user_id: creatorData.user_id,
        handle: userData.handle,
        avatar_url: userData.avatar_url,
        headline: creatorData.headline,
        bio: userData.bio,
        category: creatorData.category,
        rating: Number(creatorData.rating) || 0,
        review_count: creatorData.review_count || 0,
        created_at: creatorData.created_at,
        tier: creatorData.tier
      };
    },
    enabled: !!handle
  });

  const { data: services } = useQuery({
    queryKey: ['creator-services', creator?.user_id],
    queryFn: async (): Promise<ServiceData[]> => {
      if (!creator?.user_id) return [];

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('creator_id', creator.user_id)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching services:', error);
        return [];
      }

      // Transform the data to ensure description is not null
      return (data || []).map(service => ({
        ...service,
        description: service.description || ''
      }));
    },
    enabled: !!creator?.user_id
  });

  const { data: reviews } = useQuery({
    queryKey: ['creator-reviews', creator?.user_id],
    queryFn: async (): Promise<ReviewData[]> => {
      if (!creator?.user_id) return [];

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          reviewer:users!reviews_reviewer_id_fkey (
            handle,
            avatar_url
          )
        `)
        .eq('reviewee_id', creator.user_id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching reviews:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!creator?.user_id
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      // For now, just toggle the local state. Later you can implement actual following in the database
      setIsFollowing(!isFollowing);
    },
    onSuccess: () => {
      toast.success(isFollowing ? 'Unfollowed creator' : 'Following creator');
    }
  });

  const shareCreator = (platform: string) => {
    const url = window.location.href;
    const text = `Check out @${creator?.handle} on our platform!`;
    
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const handleContactCreator = () => {
    if (!user) {
      toast.error('Please log in to message creators');
      navigate('/auth');
      return;
    }
    // Navigate to direct messaging (we'll implement this)
    navigate(`/messages/${creator?.user_id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div>Loading creator profile...</div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Creator not found</h2>
          <Button onClick={() => navigate('/browse')}>Back to Browse</Button>
        </div>
      </div>
    );
  }

  // Sample reasons/tags for hiring (creator can edit these later)
  const sampleReasons = [
    'Expert in crypto trading',
    'Quick turnaround time',
    'Personalized advice',
    'Proven track record',
    'Great communication',
    'Educational content'
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 p-6">
        <div className="container mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/browse')}
            className="mb-4 text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Creator Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <div className="text-center">
                  <Avatar className="h-32 w-32 mx-auto mb-4">
                    <AvatarImage src={creator.avatar_url} alt={creator.handle} />
                    <AvatarFallback className="bg-zinc-800 text-white text-2xl">
                      {creator.handle[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h1 className="text-2xl font-bold mb-2">@{creator.handle}</h1>
                  
                  {creator.headline && (
                    <p className="text-zinc-400 mb-4">{creator.headline}</p>
                  )}

                  {creator.category && (
                    <Badge className="mb-4" variant="outline">
                      {creator.category}
                    </Badge>
                  )}

                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{creator.rating.toFixed(1)}</span>
                      <span className="text-zinc-400">({creator.review_count})</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-1 text-sm text-zinc-400 mb-6">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {format(new Date(creator.created_at), 'MMMM yyyy')}</span>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={`flex-1 ${isFollowing ? 'bg-red-600 border-red-600' : ''}`}
                      onClick={() => followMutation.mutate()}
                    >
                      <Heart className={`h-4 w-4 mr-1 ${isFollowing ? 'fill-white' : ''}`} />
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => shareCreator('twitter')}>
                          Share on Twitter
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareCreator('facebook')}>
                          Share on Facebook
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareCreator('telegram')}>
                          Share on Telegram
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareCreator('copy')}>
                          Copy Link
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleContactCreator}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Creator
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* About Section */}
            {creator.bio && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">About</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{creator.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Intro Video Section */}
            {creator.tier === 'pro' && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">Intro Video</h3>
                  <div className="relative bg-zinc-800 rounded-lg aspect-video flex items-center justify-center">
                    <Play className="h-12 w-12 text-zinc-400" />
                    <div className="absolute bottom-2 right-2 bg-black/50 rounded px-2 py-1 text-xs">
                      1:30
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reasons to Hire Section */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Reasons to Hire This Creator</h3>
                <div className="flex flex-wrap gap-2">
                  {sampleReasons.map((reason, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {reason}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Services and Reviews */}
          <div className="lg:col-span-2 space-y-6">
            {/* Services Section */}
            <div>
              <h2 className="text-xl font-bold mb-4">Available Services</h2>
              {services && services.length > 0 ? (
                <div className="grid gap-4">
                  {services.map((service) => (
                    <Card key={service.id} className="bg-zinc-900 border-zinc-800">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{service.title}</h3>
                            {service.description && (
                              <p className="text-zinc-400 mb-4">{service.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                <span className="font-semibold">${service.price_usdc} USDC</span>
                              </div>
                              <div className="flex items-center gap-1 text-zinc-400">
                                <Clock className="h-4 w-4" />
                                <span>{service.delivery_days} days delivery</span>
                              </div>
                              {service.category && (
                                <Badge variant="outline">{service.category}</Badge>
                              )}
                            </div>
                          </div>
                          
                          <Button 
                            onClick={() => {
                              setSelectedService(service);
                              setShowBookingModal(true);
                            }}
                            className="ml-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700"
                          >
                            Book Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="text-center py-8">
                    <p className="text-zinc-400">No services available at the moment</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Reviews Section */}
            <div>
              <h2 className="text-xl font-bold mb-4">Recent Reviews</h2>
              {reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id} className="bg-zinc-900 border-zinc-800">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={review.reviewer?.avatar_url} alt={review.reviewer?.handle} />
                            <AvatarFallback className="bg-zinc-800 text-white">
                              {review.reviewer?.handle?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">@{review.reviewer?.handle}</span>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < review.rating 
                                        ? 'fill-yellow-400 text-yellow-400' 
                                        : 'text-zinc-600'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-zinc-400">
                                {format(new Date(review.created_at), 'MMM d, yyyy')}
                              </span>
                            </div>
                            {review.comment && (
                              <p className="text-zinc-400 text-sm">{review.comment}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="text-center py-8">
                    <p className="text-zinc-400">No reviews yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedService && showBookingModal && (
        <BookingModal
          service={selectedService}
          creator={{
            id: creator.id,
            user_id: creator.user_id,
            users: {
              handle: creator.handle,
              avatar_url: creator.avatar_url || ''
            }
          }}
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedService(null);
          }}
        />
      )}
    </div>
  );
};
