
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';

interface PlanDisplayProps {
  tier: 'basic' | 'premium' | 'enterprise';
  amount: number;
}

const tierFeatures = {
  basic: ['Basic profile listing', 'Up to 5 services', 'Standard support'],
  premium: ['Priority listing', 'Unlimited services', 'Advanced analytics', 'Priority support'],
  enterprise: ['Featured placement', 'Custom branding', 'Dedicated account manager', 'Advanced integrations']
};

export const PlanDisplay = ({ tier, amount }: PlanDisplayProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="capitalize">{tier} Plan</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          {tier === 'basic' ? 'FREE' : `${amount} USDC`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {tierFeatures[tier].map((feature, index) => (
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
