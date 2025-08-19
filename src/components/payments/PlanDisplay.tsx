
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';
import { useDynamicCreatorTiers } from '@/hooks/usePricingTiers';
import { STATIC_CREATOR_TIERS } from '@/lib/contracts';

interface PlanDisplayProps {
  tier: 'basic' | 'premium' | 'enterprise';
  amount: number;
}

export const PlanDisplay = ({ tier, amount }: PlanDisplayProps) => {
  const { data: dynamicTiers } = useDynamicCreatorTiers();
  
  // Use dynamic tiers if available, fallback to static
  const tiers = dynamicTiers || STATIC_CREATOR_TIERS;
  const tierInfo = tiers[tier];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="capitalize">{tierInfo?.displayName || tier}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          {amount === 0 ? 'FREE' : `${amount} USDC`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {tierInfo?.features?.map((feature, index) => (
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
