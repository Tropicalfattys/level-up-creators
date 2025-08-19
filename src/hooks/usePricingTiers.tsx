
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
      
      // Convert the Json features to string[] safely with better error handling
      const convertedData = (data || []).map(tier => {
        let features: string[] = [];
        
        if (Array.isArray(tier.features)) {
          features = tier.features as string[];
        } else if (typeof tier.features === 'string') {
          try {
            const parsed = JSON.parse(tier.features);
            features = Array.isArray(parsed) ? parsed : [tier.features];
          } catch {
            features = [tier.features];
          }
        } else if (tier.features && typeof tier.features === 'object') {
          // Handle case where features might be stored as object
          features = Object.values(tier.features).filter(f => typeof f === 'string') as string[];
        }
        
        return {
          ...tier,
          features
        };
      });
      
      console.log('usePricingTiers: Converted data:', convertedData);
      return convertedData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Reduce unnecessary refetches
    refetchInterval: false, // Don't auto-refetch unless needed
  });
};

export const useDynamicCreatorTiers = () => {
  const { data: pricingTiers, ...queryResult } = usePricingTiers();

  console.log('useDynamicCreatorTiers: Processing pricing tiers:', pricingTiers);

  // Convert to the format expected by the frontend components
  const creatorTiers = pricingTiers?.reduce((acc, tier) => {
    const tierName = tier.tier_name as 'basic' | 'mid' | 'pro';
    
    // Only process the expected tier names
    if (['basic', 'mid', 'pro'].includes(tierName)) {
      acc[tierName] = {
        price: tier.price_usdc,
        displayName: tier.display_name,
        features: tier.features
      };
      console.log(`useDynamicCreatorTiers: Added tier ${tierName}:`, acc[tierName]);
    } else {
      console.warn(`useDynamicCreatorTiers: Unexpected tier_name found: ${tier.tier_name} - skipping`);
    }
    
    return acc;
  }, {} as Record<'basic' | 'mid' | 'pro', { price: number; displayName: string; features: string[] }>);

  console.log('useDynamicCreatorTiers: Final creator tiers object:', creatorTiers);
  
  // Validate that we have all expected tiers
  if (creatorTiers) {
    const expectedTiers: ('basic' | 'mid' | 'pro')[] = ['basic', 'mid', 'pro'];
    const foundTiers = Object.keys(creatorTiers) as ('basic' | 'mid' | 'pro')[];
    const missingTiers = expectedTiers.filter(tier => !foundTiers.includes(tier));
    
    if (missingTiers.length > 0) {
      console.error('useDynamicCreatorTiers: Missing expected tiers:', missingTiers);
    } else {
      console.log('useDynamicCreatorTiers: ✅ All expected tiers found successfully!');
    }
  }

  return {
    ...queryResult,
    data: creatorTiers
  };
};
