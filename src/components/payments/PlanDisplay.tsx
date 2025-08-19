
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
  
  console.log('PlanDisplay: Rendering for tier:', tier, 'with amount:', amount);
  console.log('PlanDisplay: Dynamic tiers data:', dynamicTiers);
  console.log('PlanDisplay: Loading state:', isLoading, 'Error:', error);

  // Use dynamic tiers data
  const tierInfo = dynamicTiers?.[tier];
  console.log('PlanDisplay: Tier info for', tier, ':', tierInfo);

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
    console.error('PlanDisplay: Error loading pricing data:', error);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="capitalize text-red-600">Error Loading Plan</CardTitle>
          <CardDescription>
            Unable to load pricing information for {tier} plan.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!tierInfo) {
    console.warn('PlanDisplay: No tier info found for:', tier, 'Available tiers:', Object.keys(dynamicTiers || {}));
    return (
      <Card>
        <CardHeader>
          <CardTitle className="capitalize text-red-600">Plan Not Found</CardTitle>
          <CardDescription>
            The {tier} plan is not currently available.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Use the price from tierInfo, but override with amount if different (for consistency)
  const displayAmount = amount !== undefined ? amount : tierInfo.price;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="capitalize">{tierInfo.displayName}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          {displayAmount === 0 ? 'FREE' : `${displayAmount} USDC`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {tierInfo.features?.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
