
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { PAYMENT_METHODS } from '@/lib/contracts';

interface Service {
  id?: string;
  title: string;
  description: string;
  price_usdc: number;
  delivery_days: number;
  category: string;
  payment_method: string;
  active: boolean;
  availability_type: string;
  target_username?: string;
}

interface ServiceFormProps {
  service?: Service;
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceForm = ({ service, isOpen, onClose }: ServiceFormProps) => {
  const [formData, setFormData] = useState<Service>({
    title: service?.title || '',
    description: service?.description || '',
    price_usdc: service?.price_usdc || 10,
    delivery_days: service?.delivery_days || 3,
    category: service?.category || 'ama',
    payment_method: service?.payment_method || 'ethereum_usdc',
    active: service?.active ?? true,
    availability_type: service?.availability_type || 'everyone',
    target_username: service?.target_username || '',
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Update form data when service prop changes (for edit/copy functionality)
  useEffect(() => {
    setFormData({
      title: service?.title || '',
      description: service?.description || '',
      price_usdc: service?.price_usdc || 10,
      delivery_days: service?.delivery_days || 3,
      category: service?.category || 'ama',
      payment_method: service?.payment_method || 'ethereum_usdc',
      active: service?.active ?? true,
      availability_type: service?.availability_type || 'everyone',
      target_username: service?.target_username || '',
    });
  }, [service]);

  // Fetch categories from database
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('sort_order');

      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
      return data;
    },
  });

  // Check service limits for new services
  const { data: serviceLimitCheck } = useQuery({
    queryKey: ['service-limit-check', user?.id],
    queryFn: async () => {
      if (!user?.id || service?.id) return { canCreate: true }; // Skip check for existing services

      // Get creator info and tier
      const { data: creator, error: creatorError } = await supabase
        .from('creators')
        .select('tier')
        .eq('user_id', user.id)
        .single();

      if (creatorError || !creator) {
        console.error('Error fetching creator:', creatorError);
        return { canCreate: false, error: 'Creator profile not found' };
      }

      // Get pricing tier limits
      const { data: pricingTier, error: pricingError } = await supabase
        .from('pricing_tiers')
        .select('service_limit')
        .eq('tier_name', creator.tier)
        .single();

      if (pricingError) {
        console.error('Error fetching pricing tier:', pricingError);
        return { canCreate: false, error: 'Failed to check service limits' };
      }

      // If service_limit is null, unlimited services allowed
      if (pricingTier.service_limit === null) {
        return { canCreate: true };
      }

      // Count existing active services
      const { count, error: countError } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .eq('active', true);

      if (countError) {
        console.error('Error counting services:', countError);
        return { canCreate: false, error: 'Failed to count existing services' };
      }

      const canCreate = (count || 0) < pricingTier.service_limit;
      return { 
        canCreate, 
        currentCount: count || 0, 
        limit: pricingTier.service_limit,
        tier: creator.tier
      };
    },
    enabled: !!user?.id && !service?.id,
  });

  const mutation = useMutation({
    mutationFn: async (data: Service) => {
      if (!user) throw new Error('User not authenticated');

      if (service?.id) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update(data)
          .eq('id', service.id);
        if (error) throw error;
      } else {
        // Check service limits before creating new service
        if (serviceLimitCheck && !serviceLimitCheck.canCreate) {
          throw new Error(serviceLimitCheck.error || 'Service limit exceeded');
        }

        // Create new service
        const { error } = await supabase
          .from('services')
          .insert([{ ...data, creator_id: user.id }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(service?.id ? 'Service updated successfully!' : 'Service created successfully!');
      queryClient.invalidateQueries({ queryKey: ['creator-services'] });
      queryClient.invalidateQueries({ queryKey: ['service-limit-check'] });
      onClose();
    },
    onError: (error) => {
      console.error('Service form error:', error);
      toast.error(error.message || 'Failed to save service. Please try again.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || formData.price_usdc < 10) {
      toast.error('Please fill in all required fields and ensure price is at least $10 USDC');
      return;
    }

    // Validate target username when select_user is chosen
    if (formData.availability_type === 'select_user' && !formData.target_username?.trim()) {
      toast.error('Please specify a username when creating a service for a specific user');
      return;
    }

    // Additional check for service limits on new services
    if (!service?.id && serviceLimitCheck && !serviceLimitCheck.canCreate) {
      toast.error(`Service limit reached. Your ${serviceLimitCheck.tier} tier allows up to ${serviceLimitCheck.limit} services.`);
      return;
    }

    mutation.mutate(formData);
  };

  const handleChange = (field: keyof Service, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Show service limit warning for new services
  const showLimitWarning = !service?.id && serviceLimitCheck && !serviceLimitCheck.canCreate;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{service?.id ? 'Edit Service' : 'Create New Service'}</DialogTitle>
          <DialogDescription>
            {service?.id ? 'Update your service details' : 'Add a new service to your profile'}
          </DialogDescription>
        </DialogHeader>

        {showLimitWarning && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Service Limit Reached:</strong> Your {serviceLimitCheck?.tier} tier allows up to {serviceLimitCheck?.limit} services. 
              You currently have {serviceLimitCheck?.currentCount} active services.
              {serviceLimitCheck?.limit !== null && (
                <>
                  {' '}
                  <Link 
                    to="/become-creator" 
                    className="font-semibold underline hover:no-underline"
                    onClick={onClose}
                  >
                    Upgrade now to create more services
                  </Link>
                  .
                </>
              )}
            </p>
          </div>
        )}

        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Service Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Trading Strategy Review"
                className="mt-1"
                disabled={showLimitWarning}
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe what you'll deliver to clients..."
                rows={3}
                className="mt-1"
                disabled={showLimitWarning}
              />
            </div>

            <div>
              <Label htmlFor="availability">Availability *</Label>
              <Select 
                value={formData.availability_type} 
                onValueChange={(value) => handleChange('availability_type', value)}
                disabled={showLimitWarning}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="select_user">Select User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.availability_type === 'select_user' && (
              <div>
                <Label htmlFor="target-username">Target Username *</Label>
                <Input
                  id="target-username"
                  value={formData.target_username}
                  onChange={(e) => handleChange('target_username', e.target.value)}
                  placeholder="Enter username of specific client"
                  className="mt-1"
                  disabled={showLimitWarning}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Only this user will be able to see and book this service
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (USDC) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="10"
                  step="0.01"
                  value={formData.price_usdc}
                  onChange={(e) => handleChange('price_usdc', parseFloat(e.target.value) || 10)}
                  className="mt-1"
                  disabled={showLimitWarning}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum $10 USDC
                </p>
              </div>
              <div>
                <Label htmlFor="delivery">Delivery (Days)</Label>
                <Input
                  id="delivery"
                  type="number"
                  min="1"
                  max="30"
                  value={formData.delivery_days}
                  onChange={(e) => handleChange('delivery_days', parseInt(e.target.value) || 3)}
                  className="mt-1"
                  disabled={showLimitWarning}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleChange('category', value)}
                disabled={showLimitWarning}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment-method">Payment Method *</Label>
              <Select 
                value={formData.payment_method} 
                onValueChange={(value) => handleChange('payment_method', value)}
                disabled={showLimitWarning}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                    <SelectItem key={key} value={key}>
                      {method.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Choose which network/token you want to receive for this service
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" type="button" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={mutation.isPending || showLimitWarning}
              >
                {mutation.isPending ? 'Saving...' : (service?.id ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
