
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Crown, Star, Zap, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { WalletConnect } from '@/components/payments/WalletConnect';

export default function BecomeCreator() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [step, setStep] = useState<'selection' | 'application' | 'payment'>('selection');
  const [applicationData, setApplicationData] = useState({
    headline: '',
    category: '',
    introVideo: null as File | null
  });

  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const tiers = [
    {
      id: 'basic',
      name: 'Starter',
      price: 'Free',
      priceAmount: 0,
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
      priceAmount: 25,
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
      priceAmount: 50,
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

  const submitApplication = useMutation({
    mutationFn: async (data: typeof applicationData) => {
      if (!user) throw new Error('User not authenticated');

      const creatorData = {
        user_id: user.id,
        headline: data.headline,
        category: data.category,
        tier: selectedTier,
        approved: false
      };

      const { error } = await supabase
        .from('creators')
        .insert([creatorData]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Application submitted successfully! We\'ll review it within 3 business days.');
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['creator-profile'] });
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Application error:', error);
      toast.error('Failed to submit application. Please try again.');
    }
  });

  const handleApplicationSubmit = () => {
    if (!applicationData.headline || !applicationData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    const selectedTierData = tiers.find(t => t.id === selectedTier);
    
    if (selectedTierData && selectedTierData.priceAmount > 0) {
      // Paid tier - go to payment
      setStep('payment');
    } else {
      // Free tier - submit directly
      submitApplication.mutate(applicationData);
    }
  };

  const handlePaymentSuccess = (txHash: string, chain: string) => {
    toast.success('Payment confirmed! Submitting your application...');
    // Here you would typically verify the transaction
    // For now, we'll proceed with the application
    submitApplication.mutate(applicationData);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to apply as a creator
          </p>
          <Button onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'selection') {
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
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full"
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
            <Button 
              size="lg" 
              className="px-8"
              onClick={() => setStep('application')}
            >
              Continue with Application
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (step === 'application') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Creator Application</h1>
          <p className="text-muted-foreground">
            Complete your profile to start offering services
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Tell us about yourself and your expertise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="headline">Professional Headline *</Label>
              <Input
                id="headline"
                value={applicationData.headline}
                onChange={(e) => setApplicationData(prev => ({ ...prev, headline: e.target.value }))}
                placeholder="e.g., NFT Trading Expert & Community Builder"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category">Expertise Category *</Label>
              <Select 
                value={applicationData.category} 
                onValueChange={(value) => setApplicationData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your expertise category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trading">Trading</SelectItem>
                  <SelectItem value="nft">NFT</SelectItem>
                  <SelectItem value="defi">DeFi</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedTier === 'pro' && (
              <div>
                <Label htmlFor="introVideo">Intro Video (Pro Tier Only)</Label>
                <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Upload intro video
                        </span>
                      </label>
                      <input id="file-upload" name="file-upload" type="file" accept="video/*" className="sr-only" />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">MP4, MOV up to 50MB</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Payout addresses can be configured later in your profile settings after approval.
              </p>
            </div>

            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => setStep('selection')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleApplicationSubmit}
                className="flex-1"
                disabled={submitApplication.isPending}
              >
                {submitApplication.isPending ? 'Submitting...' : 'Continue'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'payment') {
    const selectedTierData = tiers.find(t => t.id === selectedTier);
    
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Payment</h1>
          <p className="text-muted-foreground">
            Pay {selectedTierData?.price} to activate your {selectedTierData?.name} tier
          </p>
        </div>

        <WalletConnect
          amount={selectedTierData?.priceAmount || 0}
          currency="USDC"
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={() => setStep('application')}
        />
      </div>
    );
  }

  return null;
}
