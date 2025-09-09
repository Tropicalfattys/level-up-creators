import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VerificationBadge } from '@/components/ui/verification-badge';

interface CreatorCardProps {
  creator: {
    id: string;
    user_id: string;
    headline: string;
    tier: string;
    rating: number;
    review_count: number;
    users: {
      id: string;
      handle: string;
      avatar_url?: string;
      verified?: boolean;
    };
  };
}

export const CreatorCard = ({ creator }: CreatorCardProps) => {
  return (
    <Link to={`/profile/${creator.users.handle}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="w-16 h-16">
              <AvatarImage 
                src={creator.users.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.users.handle)}&background=3b82f6&color=ffffff&size=128`} 
              />
              <AvatarFallback>
                {creator.users.handle.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-1">
                <h3 className="font-semibold text-lg">@{creator.users.handle}</h3>
                <VerificationBadge verified={creator.users.verified} />
              </div>
              <p className="text-muted-foreground text-sm">{creator.headline}</p>
            </div>
            
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">{creator.rating.toFixed(1)}</span>
                <span className="text-muted-foreground text-sm">({creator.review_count})</span>
              </div>
              
              <Badge variant={creator.tier === 'pro' ? 'default' : 'secondary'}>
                {creator.tier}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};