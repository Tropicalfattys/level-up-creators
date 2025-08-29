
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Clock, DollarSign, Package, Filter, Search, Heart, MessageCircle } from 'lucide-react';
import { useUserFollows } from '@/hooks/useUserFollows';

interface CreatorData {
  id: string;
  user_id: string;
  handle: string;
  avatar_url?: string;
  headline?: string;
  category?: string;
  rating: number;
  review_count: number;
  avg_delivery_days: number;
  avg_price: number;
  service_count: number;
}

interface CreatorExplorerProps {
  selectedCategory?: string;
}

export const CreatorExplorer = ({ selectedCategory }: CreatorExplorerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(selectedCategory || 'all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const navigate = useNavigate();
  const { addFollow, removeFollow, isFollowing } = useUserFollows();

  // Handle URL parameter changes
  useEffect(() => {
    if (selectedCategory && selectedCategory !== categoryFilter) {
      setCategoryFilter(selectedCategory);
    }
  }, [selectedCategory]);

  // Fetch categories from database
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('sort_order');

      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
      return data;
    },
  });

  const { data: creators, isLoading } = useQuery({
    queryKey: ['creators-explore', searchQuery, categoryFilter, priceRange],
    queryFn: async (): Promise<CreatorData[]> => {
      console.log('Fetching creators with filters:', { searchQuery, categoryFilter, priceRange });
      
      // Build the query for approved creators with their user data
      let query = supabase
        .from('creators')
        .select(`
          id,
          user_id,
          headline,
          category,
          rating,
          review_count,
          users!creators_user_id_fkey (
            handle,
            avatar_url
          )
        `)
        .eq('approved', true);

      const { data: creatorsData, error } = await query;

      if (error) {
        console.error('Error fetching creators:', error);
        throw error;
      }

      if (!creatorsData || creatorsData.length === 0) {
        console.log('No creators found');
        return [];
      }

      // For each creator, get their services data
      const creatorsWithServices = await Promise.all(
        creatorsData.map(async (creator) => {
          const { data: services, error: servicesError } = await supabase
            .from('services')
            .select('price_usdc, delivery_days, title, description, category')
            .eq('creator_id', creator.user_id)
            .eq('active', true);

          if (servicesError) {
            console.error('Error fetching services for creator:', creator.user_id, servicesError);
            return null;
          }

          // Calculate averages
          const prices = services?.map(s => Number(s.price_usdc)).filter(p => p > 0) || [];
          const deliveryDays = services?.map(s => s.delivery_days).filter(d => d > 0) || [];
          
          const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
          const avgDelivery = deliveryDays.length > 0 ? Math.round(deliveryDays.reduce((a, b) => a + b, 0) / deliveryDays.length) : 3;

          // Apply search filter
          const searchMatch = !searchQuery || (
            creator.users?.handle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            creator.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            services?.some(service => 
              service.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              service.description?.toLowerCase().includes(searchQuery.toLowerCase())
            )
          );

          // Apply category filter - match against database categories
          const categoryMatch = categoryFilter === 'all' || 
            creator.category === categoryFilter ||
            services?.some(service => service.category === categoryFilter);

          // Apply price filter
          const priceMatch = avgPrice === 0 || (avgPrice >= priceRange[0] && avgPrice <= priceRange[1]);

          if (!searchMatch || !categoryMatch || !priceMatch) {
            return null;
          }

          return {
            id: creator.id,
            user_id: creator.user_id,
            handle: creator.users?.handle || 'unknown',
            avatar_url: creator.users?.avatar_url,
            headline: creator.headline,
            category: creator.category,
            rating: Number(creator.rating) || 0,
            review_count: creator.review_count || 0,
            avg_delivery_days: avgDelivery,
            avg_price: Math.round(avgPrice),
            service_count: services?.length || 0
          };
        })
      );

      const filteredCreators = creatorsWithServices.filter(creator => creator !== null) as CreatorData[];
      console.log('Filtered creators:', filteredCreators);
      return filteredCreators;
    }
  });

  const handleViewProfile = (handle: string) => {
    navigate(`/creator/${handle}`);
  };

  const handleFollowToggle = (creator: CreatorData, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (isFollowing(creator.id)) {
      removeFollow(creator.id);
    } else {
      const creatorToFollow = {
        id: creator.id,
        user_id: creator.user_id,
        handle: creator.handle,
        avatar_url: creator.avatar_url,
        headline: creator.headline
      };
      addFollow(creatorToFollow);
    }
  };

  const handleSendMessage = (creator: CreatorData, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    navigate(`/messages/${creator.user_id}`);
  };

  // Create category icons with meaningful emojis for each category
  const getCategoryIcon = (categoryValue: string): string => {
    const iconMap: Record<string, string> = {
      'defi': '🏦',
      'nft': '🎨',
      'trading': '📈',
      'development': '💻',
      'marketing': '📢',
      'content': '✍️',
      'education': '🎓',
      'consulting': '💼',
      'gaming': '🎮',
      'social': '👥',
      'yield-farming': '🌾',
      'analysis': '📊',
      'design': '🎨',
      'video': '🎥',
      'writing': '📝',
      'community': '🤝',
      'memes': '😂',
      'research': '🔬',
      'twitter': '🐦',
      'youtube': '📺',
      'telegram': '📱',
      'discord': '💬',
      'facebook': '📘',
      'instagram': '📸',
      'tiktok': '🎵',
      'linkedin': '💼'
    };
    return iconMap[categoryValue] || '📁';
  };

  const categoryIcons = categories?.slice(0, 8).map(category => ({
    name: category.label,
    category: category.value,
    icon: getCategoryIcon(category.value)
  })) || [];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Search Header */}
      <div className="border-b border-zinc-800 p-6">
        <div className="container mx-auto">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <Input
              placeholder="Search creators by name or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-400"
            />
          </div>

          {/* Category Icons */}
          <div className="flex gap-4 overflow-x-auto pb-4">
            {categoryIcons.map((cat) => (
              <Button
                key={cat.category}
                variant="ghost"
                onClick={() => setCategoryFilter(cat.category === categoryFilter ? 'all' : cat.category)}
                className={`flex-shrink-0 flex flex-col items-center p-4 rounded-full w-20 h-20 ${
                  categoryFilter === cat.category 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className="text-xs text-center leading-tight">{cat.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        <div className="flex gap-6">
          {/* Creators List */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-6">
              {categoryFilter !== 'all' ? `${categoryFilter.toUpperCase()} Creators` : 'All Creators'}
              {creators && <span className="text-zinc-400 text-lg ml-2">({creators.length})</span>}
            </h2>

            {isLoading ? (
              <div className="text-center py-8">Loading creators...</div>
            ) : creators && creators.length > 0 ? (
              <div className="space-y-4">
                {creators.map((creator) => (
                  <Card key={creator.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={creator.avatar_url} alt={creator.handle} />
                          <AvatarFallback className="bg-zinc-800 text-white text-lg">
                            {creator.handle[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">@{creator.handle}</h3>
                            {creator.category && (
                              <Badge variant="outline" className="border-blue-500 text-blue-400">
                                {creator.category}
                              </Badge>
                            )}
                          </div>
                          <p className="text-zinc-400 mb-2">{creator.headline || 'Creator'}</p>
                          
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-white font-medium">{creator.rating.toFixed(1)}</span>
                              <span className="text-zinc-400">({creator.review_count})</span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-zinc-400">
                              <Clock className="h-4 w-4" />
                              <span>{creator.avg_delivery_days} day delivery</span>
                            </div>
                            
                            {creator.avg_price > 0 && (
                              <div className="flex items-center gap-1 text-zinc-400">
                                <DollarSign className="h-4 w-4" />
                                <span>From ${creator.avg_price} USDC</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1 text-zinc-400">
                              <Package className="h-4 w-4" />
                              <span>{creator.service_count} services</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleFollowToggle(creator, e)}
                            className="p-2 hover:bg-red-50"
                          >
                            <Heart
                              className={`h-5 w-5 transition-colors ${
                                isFollowing(creator.id)
                                  ? 'fill-red-500 text-red-500'
                                  : 'text-gray-400 hover:text-red-500'
                              }`}
                            />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleSendMessage(creator, e)}
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                          <Button 
                            onClick={() => handleViewProfile(creator.handle)}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700"
                          >
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="text-center py-12">
                  <Search className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No creators found</h3>
                  <p className="text-zinc-400">
                    Try adjusting your search or filters
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Filters Sidebar */}
          <div className="w-80 space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-5 w-5" />
                  <h3 className="font-semibold">Filters</h3>
                </div>

                <div className="space-y-6">
                  {/* Category Filter */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Category</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="all" className="text-white">All Categories</SelectItem>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.value} className="text-white">
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Price Range: ${priceRange[0]} - ${priceRange[1]} USDC
                    </Label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={1000}
                      min={0}
                      step={25}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-zinc-400 mt-1">
                      <span>$0</span>
                      <span>$1000</span>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setCategoryFilter('all');
                      setPriceRange([0, 1000]);
                      setSearchQuery('');
                    }}
                    className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
