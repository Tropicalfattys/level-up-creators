
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PricingTier {
  id: string;
  tier_name: string;
  price_usdc: number;
  display_name: string;
  description: string;
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

      if (error) {
        throw error;
      }
      
      // Convert the JSON features to string[] safely
      const convertedData = (data || []).map(tier => ({
        ...tier,
        features: Array.isArray(tier.features) ? tier.features as string[] : []
      }));
      
      return convertedData;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useDynamicCreatorTiers = () => {
  const { data: pricingTiers, ...queryResult } = usePricingTiers();

  // Convert to the format expected by the frontend components
  const creatorTiers = pricingTiers?.reduce((acc, tier) => {
    const tierName = tier.tier_name as 'basic' | 'mid' | 'pro';
    
    if (['basic', 'mid', 'pro'].includes(tierName)) {
      acc[tierName] = {
        price: tier.price_usdc,
        displayName: tier.display_name,
        description: tier.description,
        features: tier.features
      };
    }
    
    return acc;
  }, {} as Record<'basic' | 'mid' | 'pro', { price: number; displayName: string; description: string; features: string[] }>);

  return {
    ...queryResult,
    data: creatorTiers
  };
};
