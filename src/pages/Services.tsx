
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
      console.log('Fetching services with filters:', { selectedCategory, sortBy, searchQuery, priceRange });
      
      // Use the simplified database function for better performance and reliability
      const { data: servicesData, error: servicesError } = await supabase.rpc('get_services_with_creators', {
        category_filter: selectedCategory === 'all' ? null : selectedCategory,
        search_query: searchQuery || null,
        min_price: priceRange[0],
        max_price: priceRange[1],
        sort_option: sortBy
      });
      
      if (servicesError) {
        console.error('Services query error:', servicesError);
        throw servicesError;
      }

      if (!servicesData || servicesData.length === 0) {
        return [];
      }

      // Transform the data to match the expected structure
      const servicesWithCreators = servicesData.map(service => ({
        id: service.service_id,
        title: service.title,
        description: service.description,
        price_usdc: service.price_usdc,
        delivery_days: service.delivery_days,
        category: service.category,
        payment_method: service.payment_method,
        created_at: service.created_at,
        creator_id: service.creator_id,
        creator: {
          id: service.creator_id,
          user_id: service.creator_id,
          rating: service.creator_rating || 0,
          review_count: service.creator_review_count || 0,
          users: {
            handle: service.creator_handle || 'Unknown',
            avatar_url: service.creator_avatar_url || '',
            verified: service.creator_verified || false,
          }
        }
      }));
      
      return servicesWithCreators;
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
          <div className="space-y-6">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Filter by Category</label>
                <CategoryFilter
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort by</label>
                <SortBy
                  value={sortBy}
                  onChange={setSortBy}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center md:justify-items-stretch">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="w-full max-w-sm md:max-w-none">
                  <CardContent className="p-6">
                    <Skeleton className="h-48 w-full mb-4" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : services && services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center md:justify-items-stretch">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
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
