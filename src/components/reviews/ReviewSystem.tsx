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

  const { data: reviews } = useQuery({
    queryKey: ['booking-reviews', bookingId],
    queryFn: async (): Promise<Review[]> => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:users!reviews_reviewer_id_fkey (handle, avatar_url)
        `)
        .eq('booking_id', bookingId);

      if (error) throw error;
      return data || [];
    }
  });

  const { data: existingReview } = useQuery({
    queryKey: ['user-review', bookingId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('reviewer_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && canReview
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user || rating === 0) return;

      const { error } = await supabase
        .from('reviews')
        .insert([{
          booking_id: bookingId,
          reviewer_id: user.id,
          reviewee_id: revieweeId,
          rating,
          comment: comment.trim() || null
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Review submitted successfully!');
      setRating(0);
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['booking-reviews', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', bookingId, user?.id] });
    },
    onError: () => {
      toast.error('Failed to submit review');
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
    submitReview.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Review Form */}
      {canReview && !existingReview && (
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
