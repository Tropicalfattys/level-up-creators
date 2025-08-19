
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Star, Clock, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreatorWithServices {
  id: string;
  user_id: string;
  approved: boolean;
  headline: string;
  tier: string;
  rating: number;
  review_count: number;
  category: string;
  users: {
    handle: string;
    avatar_url: string;
  };
  services: {
    id: string;
    title: string;
    description: string;
    price_usdc: number;
    delivery_days: number;
    active: boolean;
  }[];
}

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const navigate = useNavigate();

  const { data: creators, isLoading } = useQuery({
    queryKey: ['creators', categoryFilter, tierFilter, sortBy],
    queryFn: async (): Promise<CreatorWithServices[]> => {
      let query = supabase
        .from('creators')
        .select(`
          *,
          users!creators_user_id_fkey (
            handle,
            avatar_url
          ),
          services (
            id,
            title,
            description,
            price_usdc,
            delivery_days,
            active
          )
        `)
        .eq('approved', true);

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      if (tierFilter !== 'all') {
        query = query.eq('tier', tierFilter);
      }

      switch (sortBy) {
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        case 'price_low':
          query = query.order('priority_score', { ascending: false }); // We'll sort by service price in JS
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('priority_score', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  const filteredCreators = creators?.filter((creator) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      creator.users?.handle?.toLowerCase().includes(searchLower) ||
      creator.headline?.toLowerCase().includes(searchLower) ||
      creator.category?.toLowerCase().includes(searchLower) ||
      creator.services?.some(service => 
        service.title?.toLowerCase().includes(searchLower) ||
        service.description?.toLowerCase().includes(searchLower)
      )
    );
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'pro': return 'destructive';
      case 'mid': return 'default';
      default: return 'secondary';
    }
  };

  const handleCreatorClick = (creatorId: string) => {
    navigate(`/creator/${creatorId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading creators...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Browse Creators</h1>
        <p className="text-muted-foreground mb-6">
          Discover crypto creators and book personalized services
        </p>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search creators, services, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="trading">Trading</SelectItem>
              <SelectItem value="nft">NFT</SelectItem>
              <SelectItem value="defi">DeFi</SelectItem>
              <SelectItem value="education">Education</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="mid">Plus</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Featured</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Creator Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCreators?.map((creator) => (
          <Card 
            key={creator.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleCreatorClick(creator.id)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={creator.users?.avatar_url} />
                  <AvatarFallback>
                    {creator.users?.handle?.slice(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">@{creator.users?.handle}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getTierColor(creator.tier)}>
                      {creator.tier.toUpperCase()}
                    </Badge>
                    {creator.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{creator.rating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({creator.review_count})</span>
                      </div>
                    )}
                  </div>
                  {creator.headline && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {creator.headline}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {creator.services
                  ?.filter(service => service.active)
                  ?.slice(0, 2)
                  ?.map((service) => (
                  <div key={service.id} className="border rounded-lg p-3">
                    <h4 className="font-medium mb-2 line-clamp-1">{service.title}</h4>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {service.delivery_days} days
                      </div>
                      <div className="flex items-center gap-1 font-medium">
                        <DollarSign className="h-3 w-3" />
                        {service.price_usdc} USDC
                      </div>
                    </div>
                  </div>
                ))}
                {creator.services?.filter(s => s.active).length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    No active services
                  </div>
                )}
              </div>
              <Button className="w-full mt-4">
                View Profile
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!filteredCreators || filteredCreators.length === 0) && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No creators found matching your criteria
          </p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('all');
              setTierFilter('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
