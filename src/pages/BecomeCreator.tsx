
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Crown } from 'lucide-react';
import { CreatorPayment } from '@/components/creator/CreatorPayment';
import { useAuth } from '@/hooks/useAuth';

const tiers = [
  {
    id: 'basic' as const,
    name: 'Basic',
    price: 0,
    icon: <CheckCircle className="h-8 w-8" />,
    description: 'Perfect for getting started',
    features: [
      'Basic creator profile',
      'Up to 3 active services',
      'Standard support',
      'Basic analytics',
      'Admin approval required'
    ],
    color: 'bg-card text-card-foreground'
  },
  {
    id: 'mid' as const,
    name: 'Premium',
    price: 25,
    icon: <Star className="h-8 w-8" />,
    description: 'Enhanced features for growth',
    features: [
      'Enhanced creator profile',
      'Up to 10 active services',
      'Priority support',
      'Advanced analytics',
      'Featured listing',
      'Custom branding'
    ],
    color: 'bg-card text-card-foreground',
    popular: true
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: 50,
    icon: <Crown className="h-8 w-8" />,
    description: 'Premium features for professionals',
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
    color: 'bg-card text-card-foreground'
  }
];

export default function BecomeCreator() {
  const [selectedTier, setSelectedTier] = useState<'basic' | 'mid' | 'pro' | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const { user } = useAuth();

  const handleTierSelect = (tier: 'basic' | 'mid' | 'pro') => {
    setSelectedTier(tier);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    // Handle successful payment/application
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
            <p className="text-muted-foreground">
              You need to be signed in to apply as a creator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Become a Creator</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Join our marketplace and start offering your services to clients worldwide.
          Choose the tier that best fits your needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {tiers.map((tier) => (
          <Card 
            key={tier.id} 
            className={`relative ${tier.color} ${tier.popular ? 'ring-2 ring-primary' : ''}`}
          >
            {tier.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                Most Popular
              </Badge>
            )}
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4 text-primary">
                {tier.icon}
              </div>
              <CardTitle className="text-2xl">{tier.name}</CardTitle>
              <div className="text-4xl font-bold text-primary">
                ${tier.price}
                {tier.price > 0 && <span className="text-lg font-normal text-muted-foreground">/one-time</span>}
              </div>
              <CardDescription className="text-base">
                {tier.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                onClick={() => handleTierSelect(tier.id)}
                className="w-full"
                variant={tier.popular ? 'default' : 'outline'}
                size="lg"
              >
                {tier.price === 0 ? 'Apply Free' : `Apply for $${tier.price}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>What happens next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Apply</h3>
                <p className="text-muted-foreground">Complete your application and make payment if required</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Review</h3>
                <p className="text-muted-foreground">Our team reviews your application within 24-48 hours</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Start</h3>
                <p className="text-muted-foreground">Get approved and start listing your services</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedTier && (
        <CreatorPayment
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          onPaymentSuccess={handlePaymentSuccess}
          tier={selectedTier}
        />
      )}
    </div>
  );
}
