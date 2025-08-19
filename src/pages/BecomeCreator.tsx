
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap } from 'lucide-react';

export default function BecomeCreator() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const tiers = [
    {
      id: 'free',
      name: 'Starter',
      price: 'Free',
      description: 'Get started with basic features',
      features: [
        'Create up to 3 services',
        'Basic profile listing',
        'Standard support',
        'Community access'
      ],
      icon: Star,
      popular: false
    },
    {
      id: 'mid',
      name: 'Plus',
      price: '$25 USDC',
      description: 'Enhanced features for growing creators',
      features: [
        'Unlimited services',
        'Priority listing',
        'Analytics dashboard',
        'Lower platform fees (12%)',
        'Priority support'
      ],
      icon: Zap,
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$50 USDC',
      description: 'Premium features for top creators',
      features: [
        'Everything in Plus',
        'Video intro uploads',
        'Featured homepage placement',
        'Custom branding',
        'Lowest platform fees (10%)',
        'Dedicated support'
      ],
      icon: Crown,
      popular: false
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Become a Creator</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join our marketplace and start earning by offering your expertise to the crypto community
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          return (
            <Card 
              key={tier.id}
              className={`relative cursor-pointer transition-all ${
                selectedTier === tier.id 
                  ? 'ring-2 ring-primary shadow-lg' 
                  : 'hover:shadow-md'
              } ${tier.popular ? 'border-primary' : ''}`}
              onClick={() => setSelectedTier(tier.id)}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <div className="text-3xl font-bold text-primary">{tier.price}</div>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full mt-6"
                  variant={selectedTier === tier.id ? 'default' : 'outline'}
                >
                  {tier.price === 'Free' ? 'Get Started' : 'Choose Plan'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedTier && (
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <Card>
            <CardHeader>
              <CardTitle>Ready to get started?</CardTitle>
              <CardDescription>
                Complete your creator profile and start offering services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" className="px-8">
                Continue with Application
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
