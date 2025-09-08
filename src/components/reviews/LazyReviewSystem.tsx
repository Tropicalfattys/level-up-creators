import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';
import { ReviewSystem } from './ReviewSystem';
import { useIsMobile } from '@/hooks/use-mobile';

interface LazyReviewSystemProps {
  bookingId: string;
  revieweeId: string;
  canReview: boolean;
}

export const LazyReviewSystem = ({ bookingId, revieweeId, canReview }: LazyReviewSystemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();

  if (isExpanded) {
    return (
      <div className="space-y-4">
        <div className={`flex items-center ${isMobile ? 'flex-col gap-2 items-start' : 'justify-between'}`}>
          <h4 className="font-medium flex items-center gap-2">
            <Star className="h-4 w-4" />
            Reviews
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronUp className="h-4 w-4" />
            Hide Reviews
          </Button>
        </div>
        <ReviewSystem
          bookingId={bookingId}
          revieweeId={revieweeId}
          canReview={canReview}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Star className="h-4 w-4" />
          Reviews & Ratings
        </CardTitle>
      </CardHeader>
      <CardContent className={isMobile ? 'px-4 py-3' : ''}>
        <Button
          variant="outline"
          onClick={() => setIsExpanded(true)}
          className={`w-full text-left ${isMobile ? 'text-xs px-3 py-3 h-auto min-h-[3rem]' : ''}`}
        >
          <ChevronDown className={`h-4 w-4 flex-shrink-0 ${isMobile ? 'mr-0.5' : 'mr-2'}`} />
          {canReview ? (
            isMobile ? (
              <span className="flex flex-col text-xs leading-tight">
                <span>Show Reviews</span>
                <span>& Leave Review</span>
              </span>
            ) : (
              'Show Reviews & Leave Review'
            )
          ) : (
            'Show Reviews'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};