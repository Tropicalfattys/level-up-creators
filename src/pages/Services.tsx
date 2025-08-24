
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ServiceCard } from '@/components/services/ServiceCard';
import { CategoryFilter } from '@/components/services/CategoryFilter';
import { SortBy } from '@/components/services/SortBy';
import { AdvancedSearch } from '@/components/search/AdvancedSearch';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Service } from '@/types/database';

export default function Services() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);

  const { data: services, isLoading, error } = useQuery({
    queryKey: ['services', selectedCategory, sortBy, searchQuery, priceRange],
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select(`
          *,
          creators!services_creator_id_fkey(
            id,
            user_id,
            headline,
            tier,
            rating,
            review_count,
            users!creators_user_id_fkey(handle, avatar_url)
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
      if (error) throw error;
      
      return data as Service[];
    }
  });

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
        
        <AdvancedSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 space-y-4">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
          <SortBy
            sortBy={sortBy}
            onSortChange={setSortBy}
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
                      handle: service.creators.users.handle,
                      avatar_url: service.creators.users.avatar_url,
                      rating: service.creators.rating,
                    }
                  }}
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
    </div>
  );
}
