import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
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
  const isMobile = useIsMobile();

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
      console.log('Starting review submission validation...');
      
      // Basic validation
      if (!user?.id) {
        console.error('No user ID found');
        throw new Error('User not authenticated');
      }

      if (!rating || rating < 1 || rating > 5) {
        console.error('Invalid rating:', rating);
        throw new Error('Please select a rating between 1-5 stars');
      }

      if (!bookingId) {
        console.error('No booking ID');
        throw new Error('Booking ID is required');
      }

      if (!revieweeId) {
        console.error('No reviewee ID');
        throw new Error('Reviewee ID is required');
      }

      // Check booking status
      if (!bookingStatus) {
        console.error('No booking status data');
        throw new Error('Unable to verify booking status');
      }

      console.log('Booking status check:', bookingStatus);

      // Verify booking is completed (including refunded from disputes)
      if (!['accepted', 'released', 'refunded'].includes(bookingStatus.status)) {
        console.error('Booking not completed:', bookingStatus.status);
        throw new Error('Reviews can only be submitted for completed bookings');
      }

      // Verify user is part of this booking
      const isClient = user.id === bookingStatus.client_id;
      const isCreator = user.id === bookingStatus.creator_id;
      
      if (!isClient && !isCreator) {
        console.error('User not part of booking:', { userId: user.id, booking: bookingStatus });
        throw new Error('You are not authorized to review this booking');
      }

      // Check for existing review
      if (existingReview) {
        console.error('Review already exists:', existingReview);
        throw new Error('You have already reviewed this booking');
      }

      // Prepare the review data
      const reviewData = {
        booking_id: bookingId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating: Number(rating),
        comment: comment.trim() || null
      };

      console.log('Submitting review with data:', reviewData);

      // Submit the review
      const { data, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error during review submission:', error);
        throw new Error(`Failed to submit review: ${error.message}`);
      }

      console.log('Review submitted successfully:', data);
      return data;
    },
    onSuccess: () => {
      console.log('Review submission completed successfully');
      toast.success('Review submitted successfully!');
      setRating(0);
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['booking-reviews', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', bookingId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['creator-reviews', revieweeId] });
    },
    onError: (error: Error) => {
      console.error('Review submission failed:', error);
      toast.error(error.message || 'Failed to submit review');
    }
  });

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReview.mutate();
  };

  // Don't show review form if user already reviewed or can't review
  const showReviewForm = canReview && 
    !existingReview && 
    bookingStatus && 
    ['accepted', 'released', 'refunded'].includes(bookingStatus.status) && 
    user?.id &&
    (user.id === bookingStatus.client_id || user.id === bookingStatus.creator_id);

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
                        className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'} ${
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

              <Button 
                type="submit" 
                disabled={submitReview.isPending || rating === 0}
                className={isMobile ? "w-full text-xs px-4 py-3 text-white" : "text-white"}
              >
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

      {/* Show message if booking not completed */}
      {canReview && bookingStatus && !['accepted', 'released', 'refunded'].includes(bookingStatus.status) && (
        <Card>
          <CardHeader>
            <CardTitle>Review Not Available</CardTitle>
            <CardDescription>Reviews can only be submitted after the booking is completed</CardDescription>
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
                  <div className={isMobile ? "flex flex-col items-center text-center space-y-2" : "flex items-start gap-3"}>
                    <Avatar className={isMobile ? "h-12 w-12" : "h-8 w-8"}>
                      <AvatarImage src={review.reviewer?.avatar_url} />
                      <AvatarFallback>
                        {review.reviewer?.handle?.slice(0, 2).toUpperCase() || '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={isMobile ? "w-full" : "flex-1"}>
                      <div className={isMobile ? "flex flex-col space-y-2" : "flex items-center gap-2 mb-1"}>
                        {review.reviewer?.handle ? (
                          <Link 
                            to={`/profile/${review.reviewer.handle}`}
                            className="font-medium text-primary hover:underline"
                          >
                            @{review.reviewer.handle}
                          </Link>
                        ) : (
                          <span className="font-medium">@Unknown</span>
                        )}
                        <div className={isMobile ? "flex justify-center" : "flex"}>
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
                        {isMobile ? (
                          <>
                            {review.comment && (
                              <p className="text-sm text-muted-foreground">{review.comment}</p>
                            )}
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(review.created_at), 'MMM d, yyyy')}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(review.created_at), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                      {!isMobile && review.comment && (
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
