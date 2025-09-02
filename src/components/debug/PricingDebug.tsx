
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const PricingDebug = () => {
  const { data: pricingTiers, isLoading, error } = useQuery({
    queryKey: ['debug-pricing-tiers'],
    queryFn: async () => {
      console.log('DEBUG: Fetching all pricing tiers...');
      const { data, error } = await supabase
        .from('pricing_tiers')
        .select('*')
        .order('price_usdc', { ascending: true });

      if (error) {
        console.error('DEBUG: Error fetching pricing tiers:', error);
        throw error;
      }
      
      console.log('DEBUG: Raw pricing tiers from database:', data);
      return data;
    }
  });

  if (isLoading) return <div>Loading debug info...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-yellow-800">🔍 Pricing Tiers Debug Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm font-mono">
          <p><strong>Total tiers in database:</strong> {pricingTiers?.length || 0}</p>
          {pricingTiers?.map((tier, index) => (
            <div key={tier.id} className="bg-white p-2 rounded border">
              <p><strong>Tier {index + 1}:</strong></p>
              <p>• ID: {tier.id}</p>
              <p>• tier_name: "{tier.tier_name}"</p>
              <p>• display_name: "{tier.display_name}"</p>
              <p>• description: "{tier.description}"</p>
              <p>• price_usdc: {tier.price_usdc}</p>
              <p>• active: {tier.active ? 'true' : 'false'}</p>
              <p>• features: {JSON.stringify(tier.features)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
