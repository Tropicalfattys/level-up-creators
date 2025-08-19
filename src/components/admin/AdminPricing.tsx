
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface PricingTier {
  id: string;
  tier_name: string;
  price_usdc: number;
  display_name: string;
  features: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const AdminPricing = () => {
  const [editingTiers, setEditingTiers] = useState<Record<string, Partial<PricingTier>>>({});
  const queryClient = useQueryClient();

  const { data: pricingTiers, isLoading } = useQuery({
    queryKey: ['pricing-tiers'],
    queryFn: async (): Promise<PricingTier[]> => {
      const { data, error } = await supabase
        .from('pricing_tiers')
        .select('*')
        .order('price_usdc', { ascending: true });

      if (error) throw error;
      return data || [];
    }
  });

  const updatePricingMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PricingTier> }) => {
      const { error } = await supabase
        .from('pricing_tiers')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-tiers'] });
      toast.success('Pricing tier updated successfully');
      setEditingTiers({});
    },
    onError: (error) => {
      console.error('Error updating pricing tier:', error);
      toast.error('Failed to update pricing tier');
    }
  });

  const handleInputChange = (tierId: string, field: keyof PricingTier, value: any) => {
    setEditingTiers(prev => ({
      ...prev,
      [tierId]: {
        ...prev[tierId],
        [field]: value
      }
    }));
  };

  const handleSave = (tier: PricingTier) => {
    const updates = editingTiers[tier.id];
    if (!updates || Object.keys(updates).length === 0) {
      toast.error('No changes to save');
      return;
    }

    updatePricingMutation.mutate({ id: tier.id, updates });
  };

  const hasChanges = (tierId: string) => {
    return editingTiers[tierId] && Object.keys(editingTiers[tierId]).length > 0;
  };

  const getCurrentValue = (tier: PricingTier, field: keyof PricingTier) => {
    return editingTiers[tier.id]?.[field] !== undefined 
      ? editingTiers[tier.id][field] 
      : tier[field];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Creator Subscription Pricing
          </CardTitle>
          <CardDescription>
            Manage subscription tier pricing for creator applications. Changes will be reflected immediately on the frontend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {pricingTiers?.map((tier) => (
              <Card key={tier.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg capitalize">{tier.tier_name}</CardTitle>
                      <CardDescription>{tier.display_name}</CardDescription>
                    </div>
                    <Badge variant={tier.active ? "default" : "secondary"}>
                      {tier.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`price-${tier.id}`}>Price (USDC)</Label>
                      <Input
                        id={`price-${tier.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={getCurrentValue(tier, 'price_usdc') as number}
                        onChange={(e) => handleInputChange(tier.id, 'price_usdc', parseFloat(e.target.value) || 0)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`display-${tier.id}`}>Display Name</Label>
                      <Input
                        id={`display-${tier.id}`}
                        value={getCurrentValue(tier, 'display_name') as string}
                        onChange={(e) => handleInputChange(tier.id, 'display_name', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`active-${tier.id}`}
                        checked={getCurrentValue(tier, 'active') as boolean}
                        onCheckedChange={(checked) => handleInputChange(tier.id, 'active', checked)}
                      />
                      <Label htmlFor={`active-${tier.id}`}>Active</Label>
                    </div>

                    <Button
                      onClick={() => handleSave(tier)}
                      disabled={!hasChanges(tier.id) || updatePricingMutation.isPending}
                      size="sm"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updatePricingMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>

                  {hasChanges(tier.id) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        You have unsaved changes. Click "Save Changes" to apply them.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
