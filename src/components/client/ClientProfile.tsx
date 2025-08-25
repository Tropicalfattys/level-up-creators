
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Star, Globe, Youtube, Twitter, Facebook, Instagram, MessageCircle, BookOpen, Linkedin, Briefcase, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

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

export const ClientProfile = () => {
  const { handle } = useParams();
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  // Fetch client data by handle
  const { data: client, isLoading } = useQuery({
    queryKey: ['client-profile', handle],
    queryFn: async () => {
      console.log('Fetching client profile for handle:', handle);
      
      if (!handle || handle === 'unknown') {
        throw new Error('No valid handle provided');
      }
      
      // Get the user by handle
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('handle', handle)
        .maybeSingle();

      if (userError || !user) {
        throw new Error('User not found');
      }

      return user;
    },
    enabled: !!handle && handle !== 'unknown'
  });

  // Fetch reviews for this client
  const { data: reviews } = useQuery({
    queryKey: ['client-reviews', client?.id],
    queryFn: async (): Promise<Review[]> => {
      if (!client?.id) return [];

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:users!reviews_reviewer_id_fkey (handle, avatar_url)
        `)
        .eq('reviewee_id', client.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!client?.id
  });

  // Calculate average rating
  const averageRating = reviews && reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  // Social media icons mapping
  const socialIcons = {
    twitter: Twitter,
    facebook: Facebook,
    instagram: Instagram,
    telegram: MessageCircle,
    discord: MessageCircle,
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

  const nextReview = () => {
    if (reviews && currentReviewIndex < reviews.length - 1) {
      setCurrentReviewIndex(currentReviewIndex + 1);
    }
  };

  const previousReview = () => {
    if (currentReviewIndex > 0) {
      setCurrentReviewIndex(currentReviewIndex - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Client not found</h2>
          <p className="text-muted-foreground">The client profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Client Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <Avatar className="h-24 w-24 mx-auto">
                  <AvatarImage src={client.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {client.handle?.[0]?.toUpperCase() || 'C'}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h1 className="text-2xl font-bold">@{client.handle}</h1>
                </div>

                <div className="flex justify-center items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{averageRating.toFixed(1)}</span>
                  </div>
                  <span className="text-muted-foreground">
                    ({reviews?.length || 0} reviews)
                  </span>
                </div>

                <Badge variant="secondary">
                  Client
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
              {(client.social_links || client.website_url || client.portfolio_url || client.youtube_url) && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Links</h4>
                  <div className="space-y-2">
                    {/* Professional Links */}
                    {client.website_url && (
                      <a 
                        href={formatUrl(client.website_url)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                        Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    
                    {client.portfolio_url && (
                      <a 
                        href={formatUrl(client.portfolio_url)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                      >
                        <Briefcase className="h-4 w-4" />
                        Portfolio
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    
                    {client.youtube_url && (
                      <a 
                        href={formatUrl(client.youtube_url)} 
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
                    {client.social_links && Object.entries(client.social_links).map(([platform, url]) => {
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
              {client.bio && (
                <div>
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{client.bio}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-1 gap-4 text-center">
                <div>
                  <div className="font-semibold">{reviews?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">Reviews Received</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Reviews */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Reviews ({reviews?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {/* Single Review Display with Navigation */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Review {currentReviewIndex + 1} of {reviews.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={previousReview}
                          disabled={currentReviewIndex === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={nextReview}
                          disabled={currentReviewIndex >= reviews.length - 1}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {reviews[currentReviewIndex] && (
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={reviews[currentReviewIndex].reviewer?.avatar_url} />
                          <AvatarFallback>
                            {reviews[currentReviewIndex].reviewer?.handle?.slice(0, 2).toUpperCase() || '??'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">@{reviews[currentReviewIndex].reviewer?.handle}</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= reviews[currentReviewIndex].rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {new Date(reviews[currentReviewIndex].created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          {reviews[currentReviewIndex].comment && (
                            <p className="text-sm">{reviews[currentReviewIndex].comment}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No reviews yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
