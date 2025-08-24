import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { PlanDisplay } from '@/components/pricing/PlanDisplay';
import { CreatorPayment } from '@/components/payments/CreatorPayment';

export default function BecomeCreator() {
  const { user, userProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    headline: '',
    category: '',
    tier: 'basic'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const createCreatorProfile = useMutation({
    mutationFn: async (data: any) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('creators')
        .insert([{
          user_id: user.id,
          headline: data.headline,
          category: data.category,
          tier: data.tier,
          approved: false
        }]);
        
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Creator profile submitted for review!');
      queryClient.invalidateQueries({ queryKey: ['creator-profile'] });
      setStep(3);
    },
    onError: (error: any) => {
      toast.error('Failed to create profile: ' + error.message);
    }
  });

  const handleTierPayment = (paymentId: string) => {
    toast.success('Payment submitted! Your application will be reviewed once payment is verified.');
    setStep(3);
  };

  const handleSubmit = () => {
    if (!formData.headline || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    createCreatorProfile.mutate(formData);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p>Please sign in to become a creator</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Become a Creator</h1>
          <p className="text-muted-foreground">
            Join our platform and start offering your services to clients
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  i <= step
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Profile Setup</span>
            <span>Choose Tier</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Step 1: Profile Setup */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Create Your Profile</CardTitle>
              <CardDescription>
                Tell us about yourself and what services you'll offer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={userProfile?.avatar_url} alt="Profile" />
                  <AvatarFallback>
                    {userProfile?.handle?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">@{userProfile?.handle || 'No handle set'}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="headline">Headline *</Label>
                <Input
                  id="headline"
                  value={formData.headline}
                  onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                  placeholder="e.g., Expert Crypto Trader & DeFi Strategist"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your main category" />
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

              <Button 
                onClick={() => setStep(2)} 
                className="w-full"
                disabled={!formData.headline || !formData.category}
              >
                Continue to Tier Selection
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Tier Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Tier</CardTitle>
                <CardDescription>
                  Select a membership tier to unlock different features and benefits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PlanDisplay 
                  onPlanSelect={(tier) => {
                    setFormData(prev => ({ ...prev, tier }));
                    if (tier === 'basic') {
                      handleSubmit();
                    }
                  }}
                />
              </CardContent>
            </Card>

            {formData.tier !== 'basic' && (
              <Card>
                <CardHeader>
                  <CardTitle>Complete Payment</CardTitle>
                  <CardDescription>
                    Pay for your {formData.tier} tier to unlock premium features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CreatorPayment 
                    tier={formData.tier}
                    onPaymentSubmitted={handleTierPayment}
                    creatorId={user.id}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 3 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
              <p className="text-muted-foreground mb-6">
                Your creator application has been submitted for review. You'll receive an email notification once it's approved.
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" asChild>
                  <a href="/">Return Home</a>
                </Button>
                <Button asChild>
                  <a href="/settings">Complete Profile</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
