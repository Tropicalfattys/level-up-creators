
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

interface PlanDisplayProps {
  tier: 'basic' | 'mid' | 'pro';
  amount: number;
}

export const PlanDisplay = ({ tier, amount }: PlanDisplayProps) => {
  const planDetails = {
    basic: {
      name: 'Basic',
      description: 'Get started with basic features',
      features: [
        'Basic creator profile',
        'Up to 3 active services',
        'Standard support',
        'Basic analytics'
      ]
    },
    mid: {
      name: 'Premium',
      description: 'Enhanced features for growing creators',
      features: [
        'Enhanced creator profile',
        'Up to 10 active services',
        'Priority support',
        'Advanced analytics',
        'Featured listing',
        'Custom branding'
      ]
    },
    pro: {
      name: 'Pro',
      description: 'Premium features for top creators',
      features: [
        'Premium creator profile',
        'Unlimited active services',
        'VIP support',
        'Advanced analytics',
        'Top featured listing',
        'Custom branding',
        'Video introductions',
        'Priority placement'
      ]
    }
  };

  const plan = planDetails[tier];

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {plan.name}
          <div className="text-right">
            <div className="text-2xl font-bold">${amount}</div>
            {amount === 0 && <Badge variant="secondary">Free</Badge>}
          </div>
        </CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
