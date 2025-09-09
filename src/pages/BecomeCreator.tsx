import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Crown, RefreshCw } from 'lucide-react';
import { CreatorPayment } from '@/components/creator/CreatorPayment';
import { useAuth } from '@/hooks/useAuth';
import { useDynamicCreatorTiers } from '@/hooks/usePricingTiers';
import { toast } from 'sonner';

// Fallback tiers in case database fetch fails
const fallbackTiers = [
  {
    id: 'basic' as const,
    name: 'Basic',
    price: 0,
    description: 'Perfect for getting started',
    icon: <CheckCircle className="h-8 w-8" />,
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
    description: 'Enhanced features for growth',
    icon: <Star className="h-8 w-8" />,
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
    description: 'Premium features for professionals',
    icon: <Crown className="h-8 w-8" />,
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
  const queryClient = useQueryClient();
  const { data: dynamicTiers, isLoading, error } = useDynamicCreatorTiers();
  const isMobile = useIsMobile();

  const createCreatorApplication = useMutation({
    mutationFn: async (tier: 'basic' | 'mid' | 'pro') => {
      if (!user?.id) throw new Error('User not authenticated');

      // Check if creator record already exists
      const { data: existingCreator } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingCreator) {
        // If user is already a creator, update their tier (tier upgrade)
        const { data, error } = await supabase
          .from('creators')
          .update({
            tier: tier,
            approved: false, // Reset approval status for tier upgrade review
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // Create new creator record for users who aren't creators yet
      const { data, error } = await supabase
        .from('creators')
        .insert({
          user_id: user.id,
          tier: tier,
          approved: false, // Requires admin approval
          category: 'general',
          headline: `${tier} Creator Application`
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, tier) => {
      const isExistingCreator = data.updated_at !== data.created_at;
      if (isExistingCreator) {
        toast.success('Tier upgrade request submitted successfully! Please wait for admin approval.');
      } else {
        toast.success('Creator application submitted successfully! Please wait for admin approval.');
      }
      setShowPayment(false);
      setSelectedTier(null);
      queryClient.invalidateQueries({ queryKey: ['admin-creators'] });
    },
    onError: (error: any) => {
      toast.error('Failed to submit creator application: ' + error.message);
    }
  });

  const handleTierSelect = (tier: 'basic' | 'mid' | 'pro') => {
    setSelectedTier(tier);
    const tierPrice = getTierPrice(tier);
    if (tierPrice === 0) {
      // For free tier, create application immediately
      createCreatorApplication.mutate(tier);
    } else {
      // For paid tiers, show payment modal
      setShowPayment(true);
    }
  };

  const handlePaymentSuccess = (tier: 'basic' | 'mid' | 'pro') => {
    // Create creator application after successful payment
    createCreatorApplication.mutate(tier);
  };

  const getTierPrice = (tierName: 'basic' | 'mid' | 'pro'): number => {
    if (dynamicTiers && dynamicTiers[tierName]) {
      return dynamicTiers[tierName].price;
    }
    const fallbackTier = fallbackTiers.find(t => t.id === tierName);
    return fallbackTier?.price || 0;
  };

  const getTierDisplayName = (tierName: 'basic' | 'mid' | 'pro'): string => {
    if (dynamicTiers && dynamicTiers[tierName]) {
      return dynamicTiers[tierName].displayName;
    }
    const fallbackTier = fallbackTiers.find(t => t.id === tierName);
    return fallbackTier?.name || tierName;
  };

  const getTierDescription = (tierName: 'basic' | 'mid' | 'pro'): string => {
    if (dynamicTiers && dynamicTiers[tierName]) {
      return dynamicTiers[tierName].description;
    }
    const fallbackTier = fallbackTiers.find(t => t.id === tierName);
    return fallbackTier?.description || 'Perfect for getting started';
  };

  const getTierFeatures = (tierName: 'basic' | 'mid' | 'pro'): string[] => {
    if (dynamicTiers && dynamicTiers[tierName]) {
      return dynamicTiers[tierName].features;
    }
    const fallbackTier = fallbackTiers.find(t => t.id === tierName);
    return fallbackTier?.features || [];
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Become a Creator</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join our marketplace and start offering your services to clients worldwide.
            Choose the tier that best fits your needs.
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2">Loading pricing information...</span>
        </div>
      </div>
    );
  }

  // Use dynamic tiers if available, otherwise use fallback
  const displayTiers = fallbackTiers.map(tier => ({
    ...tier,
    name: getTierDisplayName(tier.id),
    price: getTierPrice(tier.id),
    description: getTierDescription(tier.id),
    features: getTierFeatures(tier.id)
  }));

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
        {displayTiers.map((tier) => (
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
                {tier.price > 0 && <span className="text-lg font-normal text-muted-foreground">/Annual</span>}
              </div>
              <CardDescription className="text-base">
                {tier.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className={`${isMobile ? 'space-y-5' : 'space-y-3'} mb-8`}>
                {tier.features.map((feature, index) => (
                  <li key={index} className={`${isMobile ? 'flex items-start gap-3 text-left' : 'flex items-center gap-3'}`}>
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
          onPaymentSuccess={() => handlePaymentSuccess(selectedTier)}
          tier={selectedTier}
        />
      )}
    </div>
  );
}
