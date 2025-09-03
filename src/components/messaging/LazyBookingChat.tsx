import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { BookingChat } from './BookingChat';

interface LazyBookingChatProps {
  bookingId: string;
  otherUserId: string;
  otherUserHandle: string;
}

export const LazyBookingChat = ({ bookingId, otherUserId, otherUserHandle }: LazyBookingChatProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isExpanded) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronUp className="h-4 w-4" />
            Hide Chat
          </Button>
        </div>
        <BookingChat
          bookingId={bookingId}
          otherUserId={otherUserId}
          otherUserHandle={otherUserHandle}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4" />
          Chat with @{otherUserHandle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          onClick={() => setIsExpanded(true)}
          className="w-full"
        >
          <ChevronDown className="h-4 w-4 mr-2" />
          Show Chat
        </Button>
      </CardContent>
    </Card>
  );
};