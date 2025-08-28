
import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
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
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();

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
      onClose();
    },
    onError: (error) => {
      console.error('Service form error:', error);
      toast.error('Failed to save service. Please try again.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || formData.price_usdc < 10) {
      toast.error('Please fill in all required fields and ensure price is at least $10 USDC');
      return;
    }
    mutation.mutate(formData);
  };

  const handleChange = (field: keyof Service, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{service?.id ? 'Edit Service' : 'Create New Service'}</DialogTitle>
          <DialogDescription>
            {service?.id ? 'Update your service details' : 'Add a new service to your profile'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Service Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Trading Strategy Review"
              className="mt-1"
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
            />
          </div>

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
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
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
            <Select value={formData.payment_method} onValueChange={(value) => handleChange('payment_method', value)}>
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
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : (service?.id ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
