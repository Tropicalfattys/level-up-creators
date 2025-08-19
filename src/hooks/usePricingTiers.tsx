
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export const usePricingTiers = () => {
  return useQuery({
    queryKey: ['pricing-tiers'],
    queryFn: async (): Promise<PricingTier[]> => {
      const { data, error } = await supabase
        .from('pricing_tiers')
        .select('*')
        .eq('active', true)
        .order('price_usdc', { ascending: true });

      if (error) throw error;
      return data || [];
    }
  });
};

export const useDynamicCreatorTiers = () => {
  const { data: pricingTiers, ...queryResult } = usePricingTiers();

  // Convert to the format expected by the existing CREATOR_TIERS constant
  const creatorTiers = pricingTiers?.reduce((acc, tier) => {
    acc[tier.tier_name as 'basic' | 'premium' | 'enterprise'] = {
      price: tier.price_usdc,
      displayName: tier.display_name,
      features: tier.features
    };
    return acc;
  }, {} as Record<'basic' | 'premium' | 'enterprise', { price: number; displayName: string; features: string[] }>);

  return {
    ...queryResult,
    data: creatorTiers
  };
};
