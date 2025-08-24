
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ServiceCard } from '@/components/services/ServiceCard';
import { CategoryFilter } from '@/components/services/CategoryFilter';
import { SortBy } from '@/components/services/SortBy';
import { ServiceDetailModal } from '@/components/services/ServiceDetailModal';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Search } from 'lucide-react';

export default function Services() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedService, setSelectedService] = useState<any>(null);

  const { data: services, isLoading, error } = useQuery({
    queryKey: ['services', selectedCategory, sortBy, searchQuery, priceRange],
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select(`
          id,
          title,
          description,
          price_usdc,
          delivery_days,
          category,
          payment_method,
          active,
          created_at,
          creator_id,
          creators!services_creator_id_fkey (
            id,
            user_id,
            headline,
            tier,
            rating,
            review_count,
            users!creators_user_id_fkey (
              handle,
              avatar_url
            )
          )
        `)
        .eq('active', true);

      // Apply category filter
      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      // Apply search query
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%, description.ilike.%${searchQuery}%`);
      }

      // Apply price range filter
      query = query.gte('price_usdc', priceRange[0]).lte('price_usdc', priceRange[1]);

      // Apply sorting
      switch (sortBy) {
        case 'price-low':
          query = query.order('price_usdc', { ascending: true });
          break;
        case 'price-high':
          query = query.order('price_usdc', { ascending: false });
          break;
        case 'rating':
          query = query.order('creators(rating)', { ascending: false });
          break;
        case 'delivery':
          query = query.order('delivery_days', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) {
        console.error('Services query error:', error);
        throw error;
      }
      
      return data;
    }
  });

  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600">Error loading services: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Browse Services</h1>
        <p className="text-muted-foreground mb-6">
          Discover amazing services from verified creators
        </p>
        
        <div className="bg-card rounded-lg border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Services</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Price Range: ${priceRange[0]} - ${priceRange[1]}</label>
              <Slider
                value={priceRange}
                onValueChange={(value) => setPriceRange([value[0], value[1]])}
                max={1000}
                min={0}
                step={10}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 space-y-4">
          <CategoryFilter
            value={selectedCategory}
            onChange={setSelectedCategory}
          />
          <SortBy
            value={sortBy}
            onChange={setSortBy}
          />
        </div>

        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-48 w-full mb-4" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : services && services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={{
                    id: service.id,
                    title: service.title,
                    description: service.description,
                    price_usdc: service.price_usdc,
                    delivery_days: service.delivery_days,
                    category: service.category,
                    payment_method: service.payment_method,
                    creator: {
                      handle: service.creators?.users?.handle || 'Unknown',
                      avatar_url: service.creators?.users?.avatar_url || '',
                      rating: service.creators?.rating || 0,
                    }
                  }}
                  onSelect={handleServiceSelect}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  No services found matching your criteria.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {selectedService && (
        <ServiceDetailModal
          service={selectedService}
          isOpen={!!selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  );
}
