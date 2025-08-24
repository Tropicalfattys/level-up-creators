import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ServiceCard } from '@/components/service/ServiceCard';
import { CategoryFilter } from '@/components/service/CategoryFilter';
import { SortBy } from '@/components/service/SortBy';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

export default function Services() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('priority');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services', categoryFilter, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select(`
          *,
          creators!inner (
            id,
            approved,
            user_id,
            headline,
            tier,
            priority_score,
            rating,
            review_count,
            users!creators_user_id_fkey (
              id,
              handle,
              avatar_url,
              bio
            )
          )
        `)
        .eq('active', true)
        .eq('creators.approved', true);

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      // Apply sorting
      switch (sortBy) {
        case 'price_low':
          query = query.order('price_usdc', { ascending: true });
          break;
        case 'price_high':
          query = query.order('price_usdc', { ascending: false });
          break;
        case 'rating':
          query = query.order('creators.rating', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('creators.priority_score', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Ensure all services have payment_method field
      return (data || []).map(service => ({
        ...service,
        payment_method: service.payment_method || 'ethereum_usdc'
      }));
    }
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredServices = searchQuery
    ? services.filter(service =>
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : services;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Explore Services</h1>

      {/* Filters and Sorting */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <CategoryFilter onCategoryChange={setCategoryFilter} />
        <SortBy onSortByChange={setSortBy} />
        <div>
          <Label htmlFor="search">Search Services</Label>
          <div className="relative">
            <Input
              id="search"
              type="search"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Services List */}
      {isLoading ? (
        <div className="text-center py-8">Loading services...</div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No services found matching your criteria
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}
