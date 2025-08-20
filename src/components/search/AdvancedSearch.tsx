import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Filter, DollarSign, Clock, Star } from 'lucide-react';
import { ServiceDetailModal } from '@/components/services/ServiceDetailModal';

interface SearchFilters {
  query: string;
  category: string;
  priceRange: [number, number];
  deliveryTime: number;
  minRating: number;
  sortBy: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price_usdc: number;
  delivery_days: number;
  creator: {
    handle: string;
    avatar_url?: string;
  };
}

export const AdvancedSearch = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    priceRange: [1, 10000],
    deliveryTime: 365,
    minRating: 0,
    sortBy: 'relevance'
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const { data: services, isLoading } = useQuery({
    queryKey: ['advanced-search', filters],
    queryFn: async (): Promise<Service[]> => {
      let query = supabase
        .from('services')
        .select(`
          id,
          title,
          description,
          category,
          price_usdc,
          delivery_days,
          creator:users!creator_id (
            handle,
            avatar_url
          )
        `)
        .eq('active', true);

      // Apply text search
      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      // Apply category filter
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      // Apply price range
      query = query
        .gte('price_usdc', filters.priceRange[0])
        .lte('price_usdc', filters.priceRange[1]);

      // Apply delivery time filter
      query = query.lte('delivery_days', filters.deliveryTime);

      // Apply sorting
      switch (filters.sortBy) {
        case 'price_asc':
          query = query.order('price_usdc', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price_usdc', { ascending: false });
          break;
        case 'delivery':
          query = query.order('delivery_days', { ascending: true });
          break;
        case 'popularity':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
    enabled: true
  });

  const { data: categories } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('category')
        .eq('active', true);
      
      if (error) throw error;
      
      const uniqueCategories = [...new Set(data?.map(s => s.category))];
      return uniqueCategories.filter(Boolean);
    }
  });

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      category: '',
      priceRange: [1, 10000],
      deliveryTime: 365,
      minRating: 0,
      sortBy: 'relevance'
    });
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'query') return value !== '';
    if (key === 'category') return value !== '';
    if (key === 'priceRange') return value[0] !== 1 || value[1] !== 10000;
    if (key === 'deliveryTime') return value !== 365;
    if (key === 'minRating') return value !== 0;
    if (key === 'sortBy') return value !== 'relevance';
    return false;
  }).length;

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search
          </CardTitle>
          <CardDescription>
            Find the perfect service with advanced filtering options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services, skills, or descriptions..."
              value={filters.query}
              onChange={(e) => updateFilter('query', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="sort-select" className="text-sm">Sort by:</Label>
              <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                <SelectTrigger id="sort-select" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="delivery">Fastest Delivery</SelectItem>
                  <SelectItem value="popularity">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Advanced Filters</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories?.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <Label>Price Range (USDC)</Label>
                  <div className="px-2">
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
                      max={10000}
                      min={1}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>${filters.priceRange[0]}</span>
                      <span>${filters.priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Time */}
                <div className="space-y-2">
                  <Label>Max Delivery Time</Label>
                  <div className="px-2">
                    <Slider
                      value={[filters.deliveryTime]}
                      onValueChange={(value) => updateFilter('deliveryTime', value[0])}
                      max={365}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {filters.deliveryTime} {filters.deliveryTime === 1 ? 'day' : 'days'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {services ? `${services.length} services found` : 'Loading...'}
          </h3>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading services...</div>
        ) : services && services.length > 0 ? (
          <div className="grid gap-4">
            {services.map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-2">{service.title}</h4>
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {service.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${service.price_usdc} USDC
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {service.delivery_days} days
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline">{service.category}</Badge>
                      <div className="text-sm text-muted-foreground">
                        by @{service.creator.handle}
                      </div>
                    </div>
                  </div>
                  <Separator className="mb-4" />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {service.creator.avatar_url && (
                        <img
                          src={service.creator.avatar_url}
                          alt={service.creator.handle}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span className="text-sm font-medium">@{service.creator.handle}</span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => setSelectedServiceId(service.id)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No services found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Service Detail Modal */}
      {selectedServiceId && (
        <ServiceDetailModal
          serviceId={selectedServiceId}
          isOpen={!!selectedServiceId}
          onClose={() => setSelectedServiceId(null)}
        />
      )}
    </div>
  );
};
