
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Clock, DollarSign } from 'lucide-react';
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
    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelect(service)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{service.title}</CardTitle>
            <CardDescription className="mt-1 text-sm">
              by @{service.creator.users.handle}
            </CardDescription>
          </div>
          {service.creator.rating && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{service.creator.rating}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {service.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {service.category}
            </Badge>
            {networkConfig && (
              <Badge variant="outline" className="text-xs">
                <span className="mr-1">{networkConfig.icon}</span>
                {networkConfig.name}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{service.delivery_days}d</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span>{service.price_usdc} USDC</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
