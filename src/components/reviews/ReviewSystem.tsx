
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
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

interface ReviewSystemProps {
  bookingId: string;
  revieweeId: string;
  canReview: boolean;
}

export const ReviewSystem = ({ bookingId, revieweeId, canReview }: ReviewSystemProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch existing reviews for this booking
  const { data: reviews } = useQuery({
    queryKey: ['booking-reviews', bookingId],
    queryFn: async (): Promise<Review[]> => {
      console.log('Fetching reviews for booking:', bookingId);
      
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
        .eq('booking_id', bookingId);

      if (error) {
        console.error('Error fetching reviews:', error);
        throw error;
      }
      
      console.log('Fetched reviews:', data);
      return data || [];
    }
  });

  // Check if current user already left a review
  const { data: existingReview } = useQuery({
    queryKey: ['user-review', bookingId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('Checking existing review for user:', user.id, 'booking:', bookingId);
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('reviewer_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking existing review:', error);
        throw error;
      }
      
      console.log('Existing review:', data);
      return data;
    },
    enabled: !!user?.id && canReview
  });

  // Check booking status to ensure it's completed
  const { data: bookingStatus } = useQuery({
    queryKey: ['booking-status', bookingId],
    queryFn: async () => {
      console.log('Checking booking status for:', bookingId);
      
      const { data, error } = await supabase
        .from('bookings')
        .select('status, client_id, creator_id')
        .eq('id', bookingId)
        .single();

      if (error) {
        console.error('Error fetching booking status:', error);
        throw error;
      }
      
      console.log('Booking status:', data);
      return data;
    },
    enabled: !!bookingId
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user?.id || rating === 0) {
        throw new Error('User ID or rating missing');
      }

      // Verify booking is in correct status
      if (!bookingStatus || !['accepted', 'released'].includes(bookingStatus.status)) {
        throw new Error('Booking must be completed before reviewing');
      }

      // Verify user is part of this booking
      if (user.id !== bookingStatus.client_id && user.id !== bookingStatus.creator_id) {
        throw new Error('User not authorized to review this booking');
      }

      console.log('Submitting review:', {
        booking_id: bookingId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating,
        comment: comment.trim() || null
      });

      const { error } = await supabase
        .from('reviews')
        .insert({
          booking_id: bookingId,
          reviewer_id: user.id,
          reviewee_id: revieweeId,
          rating,
          comment: comment.trim() || null
        });

      if (error) {
        console.error('Review submission error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Review submitted successfully');
      toast.success('Review submitted successfully!');
      setRating(0);
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['booking-reviews', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', bookingId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['creator-reviews', revieweeId] });
    },
    onError: (error: Error) => {
      console.error('Review submission failed:', error);
      toast.error(`Failed to submit review: ${error.message}`);
    }
  });

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!bookingStatus) {
      toast.error('Unable to verify booking status');
      return;
    }

    if (!['accepted', 'released'].includes(bookingStatus.status)) {
      toast.error('Reviews can only be submitted for completed bookings');
      return;
    }

    if (existingReview) {
      toast.error('You have already reviewed this booking');
      return;
    }

    submitReview.mutate();
  };

  // Don't show review form if user already reviewed or can't review
  const showReviewForm = canReview && !existingReview && bookingStatus && ['accepted', 'released'].includes(bookingStatus.status);

  return (
    <div className="space-y-6">
      {/* Review Form */}
      {showReviewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Leave a Review</CardTitle>
            <CardDescription>Rate your experience with this service</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="focus:outline-none"
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => handleStarClick(star)}
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= (hoveredStar || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium mb-2">Comment (Optional)</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={submitReview.isPending || rating === 0}>
                {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Show message if already reviewed */}
      {existingReview && (
        <Card>
          <CardHeader>
            <CardTitle>Review Submitted</CardTitle>
            <CardDescription>You have already reviewed this booking</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Existing Reviews */}
      {reviews && reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reviews ({reviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={review.reviewer?.avatar_url} />
                      <AvatarFallback>
                        {review.reviewer?.handle?.slice(0, 2).toUpperCase() || '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">@{review.reviewer?.handle}</span>
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
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(review.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
