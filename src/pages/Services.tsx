
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ServiceCard } from '@/components/services/ServiceCard';
import { CategoryFilter } from '@/components/services/CategoryFilter';
import { SortBy } from '@/components/services/SortBy';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Service {
  id: string;
  title: string;
  description: string | null;
  price_usdc: number | null;
  delivery_days: number | null;
  category: string | null;
  payment_method: string | null;
  active: boolean | null;
  creator_id: string | null;
  created_at: string | null;
  creators: {
    id: string;
    user_id: string | null;
    headline: string | null;
    tier: string | null;
    rating: number | null;
    review_count: number | null;
    users: {
      handle: string | null;
      avatar_url: string | null;
    };
  } | null;
}

export default function Services() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services', searchQuery, selectedCategory, sortBy],
    queryFn: async (): Promise<Service[]> => {
      let query = supabase
        .from('services')
        .select(`
          *,
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

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case 'price-low':
          query = query.order('price_usdc', { ascending: true });
          break;
        case 'price-high':
          query = query.order('price_usdc', { ascending: false });
          break;
        case 'delivery':
          query = query.order('delivery_days', { ascending: true });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false, foreignTable: 'creators' });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Services</h1>
        <p className="text-muted-foreground">
          Discover amazing services from crypto creators
        </p>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
        <SortBy
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="text-center py-8">Loading services...</div>
      ) : services.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No services found matching your criteria
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}
