
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

interface PlanDisplayProps {
  onPlanSelect: (tier: string) => void;
}

export const PlanDisplay = ({ onPlanSelect }: PlanDisplayProps) => {
  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 0,
      description: 'Get started with basic features',
      features: [
        'Basic creator profile',
        'Up to 3 active services',
        'Standard support',
        'Basic analytics'
      ],
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 25,
      description: 'Enhanced features for growing creators',
      features: [
        'Enhanced creator profile',
        'Up to 10 active services',
        'Priority support',
        'Advanced analytics',
        'Featured listing',
        'Custom branding'
      ],
      popular: true
    },
    {
      id: 'elite',
      name: 'Elite',
      price: 50,
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
      ],
      popular: false
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-primary' : ''}`}>
          {plan.popular && (
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              Most Popular
            </Badge>
          )}
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {plan.name}
              <span className="text-2xl font-bold">${plan.price}</span>
            </CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              onClick={() => onPlanSelect(plan.id)}
              className="w-full"
              variant={plan.popular ? 'default' : 'outline'}
            >
              {plan.price === 0 ? 'Get Started Free' : `Choose ${plan.name}`}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
