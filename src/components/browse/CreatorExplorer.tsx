import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Clock, DollarSign, Package, Filter, Search, Heart, MessageCircle, User } from 'lucide-react';
import { useUserFollows } from '@/hooks/useUserFollows';
import { useIsMobile } from '@/hooks/use-mobile';

interface CreatorData {
  id: string;
  user_id: string;
  handle: string;
  avatar_url?: string;
  headline?: string;
  category?: string;
  tier?: string;
  rating: number;
  review_count: number;
  avg_delivery_days: number;
  min_price: number;
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
  const isMobile = useIsMobile();
  
  // Embla carousel for category icons
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
    skipSnaps: false
  });

  // Handle URL parameter changes
  useEffect(() => {
    if (selectedCategory && selectedCategory !== categoryFilter) {
      setCategoryFilter(selectedCategory);
    }
  }, [selectedCategory]);

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
      console.log('Fetched categories from database:', data);
      return data;
    },
  });

  const { data: creators, isLoading } = useQuery({
    queryKey: ['creators-explore', searchQuery, categoryFilter, priceRange],
    queryFn: async (): Promise<CreatorData[]> => {
      console.log('Fetching creators with filters:', { searchQuery, categoryFilter, priceRange });
      
      // Build the query for approved creators with their user data and tier
      let query = supabase
        .from('creators')
        .select(`
          id,
          user_id,
          headline,
          category,
          tier,
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
          // Get current user's handle for availability filtering
          const { data: { user } } = await supabase.auth.getUser();
          let userHandle = null;
          if (user) {
            const { data: userData } = await supabase
              .from('users')
              .select('handle')
              .eq('id', user.id)
              .single();
            userHandle = userData?.handle;
          }

          let servicesQuery = supabase
            .from('services')
            .select('price_usdc, delivery_days, title, description, category')
            .eq('creator_id', creator.user_id)
            .eq('active', true);

          // Apply availability filter
          if (userHandle) {
            servicesQuery = servicesQuery.or(`availability_type.eq.everyone,and(availability_type.eq.select_user,target_username.eq.${userHandle})`);
          } else {
            servicesQuery = servicesQuery.eq('availability_type', 'everyone');
          }

          const { data: services, error: servicesError } = await servicesQuery;

          if (servicesError) {
            console.error('Error fetching services for creator:', creator.user_id, servicesError);
            return null;
          }

          // Calculate minimum price and average delivery
          const prices = services?.map(s => Number(s.price_usdc)).filter(p => p > 0) || [];
          const deliveryDays = services?.map(s => s.delivery_days).filter(d => d > 0) || [];
          
          const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
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
          const priceMatch = minPrice === 0 || (minPrice >= priceRange[0] && minPrice <= priceRange[1]);

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
            tier: creator.tier,
            rating: Number(creator.rating) || 0,
            review_count: creator.review_count || 0,
            avg_delivery_days: avgDelivery,
            min_price: Math.round(minPrice),
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
    
    if (isFollowing(creator.user_id)) {
      removeFollow(creator.user_id);
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

  // Helper function to get tier display name
  const getTierDisplayName = (tier: string | undefined): string => {
    if (!tier) return 'Basic Creator';
    
    switch (tier) {
      case 'basic':
        return 'Basic Creator';
      case 'mid':
        return 'Creator Plus';
      case 'pro':
        return 'Pro Creator';
      default:
        return 'Basic Creator';
    }
  };

  // Create category icons with meaningful emojis and SHORT display names
  const getCategoryData = (categoryValue: string): { icon?: string; image?: string; displayName: string } => {
    const categoryMap: Record<string, { icon?: string; image?: string; displayName: string }> = {
      // Updated to use Supabase storage URLs
      'ama': { image: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/AMA.png', displayName: 'AMA' },
      'AMA': { image: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/AMA.png', displayName: 'AMA' },
      'twitter': { image: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/twitter.png', displayName: 'Twitter' },
      'Twitter': { image: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/twitter.png', displayName: 'Twitter' },
      'video': { image: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/video.png', displayName: 'Videos' },
      'videos': { image: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/video.png', displayName: 'Videos' },
      'Videos': { image: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/video.png', displayName: 'Videos' },
      'tutorial': { image: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/tutorial.png', displayName: 'Tutorials' },
      'tutorials': { image: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/tutorial.png', displayName: 'Tutorials' },
      'Tutorials': { image: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/tutorial.png', displayName: 'Tutorials' },
      'reviews': { icon: '⭐', displayName: 'Reviews' },
      'Reviews': { icon: '⭐', displayName: 'Reviews' },
      'spaces': { icon: '🎙️', displayName: 'Spaces' },
      'Spaces': { icon: '🎙️', displayName: 'Spaces' },
      'instagram': { image: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/instagram.png', displayName: 'Instagram' },
      'Instagram': { image: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/instagram.png', displayName: 'Instagram' },
      'facebook': { image: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/facebook.png', displayName: 'Facebook' },
      'Facebook': { image: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/facebook.png', displayName: 'Facebook' },
      // Other categories (emojis)
      'defi': { icon: '🏦', displayName: 'DeFi' },
      'nft': { icon: '🎨', displayName: 'NFT' },
      'trading': { icon: '📈', displayName: 'Trading' },
      'development': { icon: '💻', displayName: 'Dev' },
      'marketing': { image: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/Marketing-removebg-preview.png', displayName: 'Marketing' },
      'branding': { image: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/Branding-removebg-preview.png', displayName: 'Branding' },
      'content': { icon: '✍️', displayName: 'Content' },
      'education': { icon: '🎓', displayName: 'Education' },
      'consulting': { icon: '💼', displayName: 'Consulting' },
      'gaming': { icon: '🎮', displayName: 'Gaming' },
      'social': { icon: '👥', displayName: 'Social' },
      'yield-farming': { icon: '🌾', displayName: 'Yield' },
      'analysis': { icon: '📊', displayName: 'Analysis' },
      'design': { icon: '🎨', displayName: 'Design' },
      'writing': { icon: '📝', displayName: 'Writing' },
      'community': { icon: '🤝', displayName: 'Community' },
      'memes': { icon: '😂', displayName: 'Memes' },
      'reddit': { image: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/Reddit-removebg-preview.png', displayName: 'Reddit' },
      'research': { icon: '🔬', displayName: 'Research' },
      'youtube': { icon: '📺', displayName: 'YouTube' },
      'telegram': { icon: '📱', displayName: 'Telegram' },
      'discord': { image: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/Discord-removebg-preview.png', displayName: 'Discord' },
      'tiktok': { image: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/Tiktok-removebg-preview.png', displayName: 'TikTok' },
      'linkedin': { icon: '💼', displayName: 'LinkedIn' },
      'reels': { icon: '🎬', displayName: 'Reels' },
      'contest': { icon: '🏆', displayName: 'Contest' },
      // Missing categories that exist in database
      'other': { icon: '📁', displayName: 'Other Services' },
      'music': { image: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/Music-removebg-preview.png', displayName: 'Music' }
    };
    const result = categoryMap[categoryValue] || { icon: '📁', displayName: categoryValue };
    console.log('Category mapping result:', { categoryValue, result });
    return result;
  };

  const categoryIcons = categories?.slice(0, 18).filter(category => 
    !['blogs', 'memes', 'reddit', 'other', 'linkedin'].includes(category.value)
  ).map(category => {
    const categoryData = getCategoryData(category.value);
    return {
      name: categoryData.displayName,
      category: category.value,
      icon: categoryData.icon,
      image: categoryData.image
    };
  }) || [];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Search Header */}
      <div className="p-6">
        <div className="container mx-auto">
          {/* Browse Popular Categories Title */}
          <h2 className="text-xl font-semibold mb-4 text-white">Browse Popular Categories</h2>

          {/* Category Icons */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4 pb-4">
              {categoryIcons.map((cat) => (
                <div key={cat.category} className="flex-none">
                  <Button
                    variant="ghost"
                    onClick={() => setCategoryFilter(cat.category === categoryFilter ? 'all' : cat.category)}
                    className={`flex flex-col items-center justify-center p-4 rounded-full w-20 h-20 ${
                      categoryFilter === cat.category 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {cat.image ? (
                      <img 
                        src={cat.image} 
                        alt={cat.name}
                        className="w-8 h-8 mb-1 object-contain"
                        onError={(e) => {
                          console.log('Image failed to load:', cat.image);
                          e.currentTarget.style.display = 'none';
                          const span = document.createElement('span');
                          span.className = 'text-2xl mb-1';
                          span.textContent = '📁';
                          e.currentTarget.parentNode?.appendChild(span);
                        }}
                      />
                    ) : (
                      <span className="text-2xl mb-1">{cat.icon}</span>
                    )}
                    <span className="text-xs text-center font-medium leading-tight">{cat.name}</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="container mx-auto px-6 pb-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* First Row: Search Bar and Price Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Search Bar */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Search Creators</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      placeholder="Search by name, skills, or services..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400"
                    />
                  </div>
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
              </div>

              {/* Second Row: Category Filter and Clear Button */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Filter by Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700 z-50">
                      <SelectItem value="all" className="text-white">All Categories</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.value} className="text-white">
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear All Filters Button */}
                <div>
                  <Label className="text-sm font-medium mb-2 block opacity-0">Clear Filters</Label>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setCategoryFilter('all');
                      setPriceRange([0, 1000]);
                      setSearchQuery('');
                    }}
                    className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6">
        {/* Creators Section - Full Width */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            {categoryFilter !== 'all' ? `${categoryFilter.toUpperCase()} Creators` : 'All Creators'}
            {creators && <span className="text-zinc-400 text-lg ml-2">({creators.length})</span>}
          </h2>

          {isLoading ? (
            <div className="text-center py-8">Loading creators...</div>
          ) : creators && creators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map((creator) => (
                  <Card key={creator.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer" onClick={() => handleViewProfile(creator.handle)}>
                    <div className="p-6 text-center">
                      <div className="flex flex-col items-center mb-4">
                        <Avatar className="h-15 w-15 mb-3">
                          <AvatarImage src={creator.avatar_url} alt={creator.handle} />
                          <AvatarFallback className="bg-zinc-800 text-white text-lg">
                            {creator.handle[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <h3 className="font-semibold text-lg mb-1">@{creator.handle}</h3>
                        <Badge variant="outline" className="border-blue-500 text-blue-400 mb-2">
                          {getTierDisplayName(creator.tier)}
                        </Badge>
                        
                        {isMobile ? (
                          /* Mobile Layout - Stack vertically */
                          <div className="space-y-2 mb-2">
                            <div className="flex items-center justify-center gap-1">
                              <div className="flex items-center">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${
                                      i < Math.floor(creator.rating) 
                                        ? 'fill-yellow-400 text-yellow-400' 
                                        : 'text-gray-300'
                                    }`} 
                                  />
                                ))}
                              </div>
                              <span className="text-white font-medium">{creator.rating.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-zinc-400">({creator.review_count} Reviews)</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleFollowToggle(creator, e)}
                                className={`p-1 h-auto ${
                                  isFollowing(creator.user_id) 
                                    ? 'text-red-500 hover:text-red-400' 
                                    : 'text-zinc-400 hover:text-white'
                                }`}
                              >
                                <Heart className={`h-4 w-4 ${isFollowing(creator.user_id) ? 'fill-current' : ''}`} />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* Desktop Layout - Keep horizontal */
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <div className="flex items-center">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${
                                      i < Math.floor(creator.rating) 
                                        ? 'fill-yellow-400 text-yellow-400' 
                                        : 'text-gray-300'
                                    }`} 
                                  />
                                ))}
                              </div>
                              <span className="text-white font-medium">{creator.rating.toFixed(1)}</span>
                              <span className="text-zinc-400">({creator.review_count} Reviews)</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleFollowToggle(creator, e)}
                              className={`p-1 h-auto ${
                                isFollowing(creator.user_id) 
                                  ? 'text-red-500 hover:text-red-400' 
                                  : 'text-zinc-400 hover:text-white'
                              }`}
                            >
                              <Heart className={`h-4 w-4 ${isFollowing(creator.user_id) ? 'fill-current' : ''}`} />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center">
                          <DollarSign className="h-4 w-4 text-green-400 mx-auto mb-1" />
                          <div className="text-xs text-zinc-400">From</div>
                          <div className="text-sm font-medium text-white">${creator.min_price}</div>
                        </div>
                        <div className="text-center">
                          <Clock className="h-4 w-4 text-blue-400 mx-auto mb-1" />
                          <div className="text-xs text-zinc-400">Delivery</div>
                          <div className="text-sm font-medium text-white">{creator.avg_delivery_days}d</div>
                        </div>
                        <div className="text-center">
                          <Package className="h-4 w-4 text-purple-400 mx-auto mb-1" />
                          <div className="text-xs text-zinc-400">Services</div>
                          <div className="text-sm font-medium text-white">{creator.service_count}</div>
                        </div>
                      </div>
                      
                      <div className={isMobile ? "flex flex-col space-y-2" : "flex gap-2"}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={`${isMobile ? "w-full" : "flex-1"} border-zinc-700 text-zinc-300 hover:bg-zinc-800`}
                          onClick={(e) => handleSendMessage(creator, e)}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                        <Button 
                          size="sm" 
                          className={`${isMobile ? "w-full" : "flex-1"} bg-blue-600 hover:bg-blue-700 text-white`}
                          onClick={() => handleViewProfile(creator.handle)}
                        >
                          <User className="h-4 w-4 mr-1" />
                          View Profile
                        </Button>
                      </div>
                    </div>
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
      </div>
    </div>
  );
};
