
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
      console.log('usePricingTiers: Fetching pricing tiers from database...');
      const { data, error } = await supabase
        .from('pricing_tiers')
        .select('*')
        .eq('active', true)
        .order('price_usdc', { ascending: true });

      if (error) {
        console.error('usePricingTiers: Error fetching pricing tiers:', error);
        throw error;
      }
      
      console.log('usePricingTiers: Raw data from database:', data);
      
      // Convert the Json features to string[] safely
      const convertedData = (data || []).map(tier => ({
        ...tier,
        features: Array.isArray(tier.features) ? tier.features as string[] : 
                 typeof tier.features === 'string' ? [tier.features] :
                 []
      }));
      
      console.log('usePricingTiers: Converted data:', convertedData);
      return convertedData;
    },
    staleTime: 1 * 60 * 1000, // 1 minute - shorter for faster updates
    refetchOnWindowFocus: true, 
    refetchInterval: 30 * 1000, // Refetch every 30 seconds to catch admin changes
  });
};

export const useDynamicCreatorTiers = () => {
  const { data: pricingTiers, ...queryResult } = usePricingTiers();

  console.log('useDynamicCreatorTiers: Processing pricing tiers:', pricingTiers);

  // Convert to the format expected by the existing CREATOR_TIERS constant
  const creatorTiers = pricingTiers?.reduce((acc, tier) => {
    // Ensure we're mapping to the correct tier names
    const tierName = tier.tier_name as 'basic' | 'premium' | 'enterprise';
    
    if (['basic', 'premium', 'enterprise'].includes(tierName)) {
      acc[tierName] = {
        price: tier.price_usdc,
        displayName: tier.display_name,
        features: tier.features
      };
    } else {
      console.warn(`useDynamicCreatorTiers: Unknown tier_name: ${tier.tier_name}`);
    }
    
    return acc;
  }, {} as Record<'basic' | 'premium' | 'enterprise', { price: number; displayName: string; features: string[] }>);

  console.log('useDynamicCreatorTiers: Final creator tiers object:', creatorTiers);

  return {
    ...queryResult,
    data: creatorTiers
  };
};
