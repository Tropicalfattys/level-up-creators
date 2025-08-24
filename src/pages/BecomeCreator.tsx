
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CreatorPayment } from '@/components/creator/CreatorPayment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { pricingTiers } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const profileFormSchema = z.object({
  handle: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  headline: z.string().min(10, {
    message: "Headline must be at least 10 characters.",
  }),
  bio: z.string().min(20, {
    message: "Bio must be at least 20 characters.",
  }),
  category: z.string().min(3, {
    message: "Category must be at least 3 characters.",
  }),
});

export default function BecomeCreator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'basic' | 'mid' | 'pro'>('basic');
  const { user, session } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      handle: user?.handle || "",
      headline: "",
      bio: "",
      category: "",
    },
    mode: "onChange",
  });

  const updateProfile = useMutation({
    mutationFn: async (data: z.infer<typeof profileFormSchema>) => {
      const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', user?.id);

      if (error) throw error;

      // Also create creator row
      const { error: creatorError } = await supabase
        .from('creators')
        .insert({
          user_id: user?.id,
          tier: selectedTier,
        });

      if (creatorError) throw creatorError;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error('Failed to update profile: ' + error.message);
    }
  });

  const onSubmit = (data: z.infer<typeof profileFormSchema>) => {
    setCurrentStep(3);
    updateProfile.mutate(data);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    console.log('Payment successful:', paymentId);
    setShowPaymentModal(false);
    setCurrentStep(4);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-center mb-8">Become a Creator</h1>

      {currentStep === 1 && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Step 1: Choose Your Tier</CardTitle>
            <CardDescription>Select the tier that best suits your needs.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.tier}
                  className={`p-4 rounded-md border cursor-pointer hover:shadow-md transition-shadow ${selectedTier === tier.tier ? 'border-primary shadow-sm' : 'border-muted'}`}
                  onClick={() => setSelectedTier(tier.tier)}
                >
                  <h3 className="text-xl font-semibold">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                  <ul className="mt-2 space-y-1">
                    {tier.features.map((feature) => (
                      <li key={feature} className="text-sm">
                        - {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <Button onClick={() => setCurrentStep(2)}>Next: Update Profile</Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Step 2: Update Your Profile</CardTitle>
            <CardDescription>Tell us about yourself to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="handle">Username</Label>
                <Input
                  id="handle"
                  placeholder="Enter your username"
                  defaultValue={user?.handle || ""}
                  {...register("handle")}
                />
                {errors.handle && (
                  <p className="text-sm text-red-500">{errors.handle.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  placeholder="Enter your headline"
                  {...register("headline")}
                />
                {errors.headline && (
                  <p className="text-sm text-red-500">{errors.headline.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Enter your bio"
                  {...register("bio")}
                />
                {errors.bio && (
                  <p className="text-sm text-red-500">{errors.bio.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="Enter your category"
                  {...register("category")}
                />
                {errors.category && (
                  <p className="text-sm text-red-500">{errors.category.message}</p>
                )}
              </div>
              <Button type="submit">
                {updateProfile.isPending ? 'Submitting...' : 'Next: Confirm & Pay'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Step 3: Confirm & Pay</CardTitle>
            <CardDescription>
              Confirm your profile details and complete your payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Avatar className="h-24 w-24 mx-auto mb-4">
              <AvatarImage src={user?.avatar_url || ''} alt={user?.handle || ''} />
              <AvatarFallback>{user?.handle?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-semibold">{user?.handle || user?.email}</h3>
            <p className="text-muted-foreground">
              {pricingTiers.find(t => t.tier === selectedTier)?.name}
            </p>
            <Button onClick={() => setShowPaymentModal(true)}>
              {updateProfile.isSuccess ? 'Open Payment Modal' : 'Submit Profile'}
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Step 4: Application Submitted</CardTitle>
            <CardDescription>
              Your application has been submitted and is under review.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <h3 className="text-xl font-semibold">Thank you!</h3>
            <p className="text-muted-foreground">
              Your application is under review. We will notify you when your
              account is approved.
            </p>
          </CardContent>
        </Card>
      )}

      <CreatorPayment
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
        tier={selectedTier}
      />
    </div>
  );
}
