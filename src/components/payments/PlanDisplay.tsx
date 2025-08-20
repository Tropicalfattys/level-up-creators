
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';
import { useDynamicCreatorTiers } from '@/hooks/usePricingTiers';

interface PlanDisplayProps {
  tier: 'basic' | 'mid' | 'pro';
  amount: number;
}

export const PlanDisplay = ({ tier, amount }: PlanDisplayProps) => {
  const { data: dynamicTiers, isLoading, error } = useDynamicCreatorTiers();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="animate-pulse h-4 bg-gray-200 rounded w-full"></div>
            <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="capitalize text-red-600">Error Loading Plan</CardTitle>
          <CardDescription>
            Unable to load pricing information. Please try refreshing the page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const tierInfo = dynamicTiers?.[tier];

  if (!tierInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="capitalize text-red-600">Plan Not Available</CardTitle>
          <CardDescription>
            The {tier} plan is temporarily unavailable. Please try again later.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const displayAmount = amount !== undefined ? amount : tierInfo.price;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="capitalize">{tierInfo.displayName}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          {displayAmount === 0 ? 'FREE' : `${displayAmount} USDC`}
          {tierInfo.price !== displayAmount && (
            <Badge variant="secondary" className="text-xs">
              Base: {tierInfo.price === 0 ? 'FREE' : `${tierInfo.price} USDC`}
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {tierInfo.features?.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
              {feature}
            </li>
          ))}
        </ul>
        {(!tierInfo.features || tierInfo.features.length === 0) && (
          <p className="text-sm text-muted-foreground italic">
            No features listed for this plan.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
