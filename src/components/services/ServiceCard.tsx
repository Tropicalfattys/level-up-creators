
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Star, Clock, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NETWORK_CONFIG } from '@/lib/contracts';

interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    description: string;
    price_usdc: number;
    delivery_days: number;
    category: string;
    payment_method: string;
    creator: {
      users: {
        handle: string;
        avatar_url?: string;
      };
      rating?: number;
    };
  };
  onSelect: (service: any) => void;
}

export const ServiceCard = ({ service, onSelect }: ServiceCardProps) => {
  const networkConfig = NETWORK_CONFIG[service.payment_method.split('_')[0] as keyof typeof NETWORK_CONFIG];

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="text-center space-y-3">
          <CardTitle className="text-lg line-clamp-2">{service.title}</CardTitle>
          
          <div className="flex justify-center">
            <Link 
              to={`/profile/${service.creator.users.handle}`}
            >
              <Avatar className="h-15 w-15">
                <AvatarImage src={service.creator.users.avatar_url} alt={service.creator.users.handle} />
                <AvatarFallback>
                  {service.creator.users.handle.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
          
          <CardDescription className="text-sm flex items-center justify-center gap-2">
            <span>by </span>
            <Link 
              to={`/profile/${service.creator.users.handle}`}
              className="text-primary hover:underline"
            >
              @{service.creator.users.handle}
            </Link>
            {service.creator.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{service.creator.rating}</span>
              </div>
            )}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex flex-col h-full">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {service.description}
        </p>
        
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            {service.category}
          </Badge>
          {networkConfig && (
            <Badge variant="outline" className="text-xs">
              <img src={networkConfig.icon} alt={networkConfig.name} className="h-4 w-4 mr-1" />
              {networkConfig.name}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-sm font-bold">
            <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">Turn Around</span>
            <Clock className="h-3 w-3" />
            <span>{service.delivery_days}d</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-bold text-green-600">
            <DollarSign className="h-3 w-3" />
            <span>{service.price_usdc} USD</span>
          </div>
        </div>

        <div className="mt-auto pt-4">
          <Button 
            onClick={() => onSelect(service)}
            className="w-full"
            size="sm"
          >
            Book Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
