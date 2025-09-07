
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, ExternalLink } from 'lucide-react';
import { useUserFollows } from '@/hooks/useUserFollows';
import { Link } from 'react-router-dom';

export const CreatorsFollowedCard = () => {
  const { followedCreators } = useUserFollows();

  return (
    <div className="p-[2px] bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg h-full">
      <Card className="bg-card border-0 h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Creators Followed
          </CardTitle>
          <CardDescription className="text-center">
            Creators you're following
          </CardDescription>
        </CardHeader>
        <CardContent>
          {followedCreators.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {followedCreators.map((creator) => (
                <div key={creator.user_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={creator.avatar_url} alt={creator.handle} />
                      <AvatarFallback className="bg-zinc-800 text-white text-xs">
                        {creator.handle[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-sm font-medium truncate text-left">@{creator.handle}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/creator/${creator.handle}`}>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">
              No creators followed yet. Visit creator profiles and click the heart button to follow them.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
