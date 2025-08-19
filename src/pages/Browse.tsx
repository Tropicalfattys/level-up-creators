
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Filter, Star, Clock, DollarSign } from 'lucide-react';

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - will be replaced with real Supabase data
  const mockCreators = [
    {
      id: '1',
      handle: 'crypto_trader',
      avatar_url: '',
      tier: 'pro',
      rating: 4.8,
      reviewCount: 156,
      services: [
        { title: 'Trading Strategy Video', price: 99.99, deliveryDays: 3 }
      ]
    },
    {
      id: '2', 
      handle: 'nft_expert',
      avatar_url: '',
      tier: 'mid',
      rating: 4.6,
      reviewCount: 89,
      services: [
        { title: 'NFT Collection Review', price: 49.99, deliveryDays: 1 }
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Browse Creators</h1>
        <p className="text-muted-foreground mb-6">
          Discover crypto creators and book personalized services
        </p>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search creators, services, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Creator Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCreators.map((creator) => (
          <Card key={creator.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={creator.avatar_url} />
                  <AvatarFallback>{creator.handle.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">@{creator.handle}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={creator.tier === 'pro' ? 'default' : 'secondary'}>
                      {creator.tier.toUpperCase()}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{creator.rating}</span>
                      <span className="text-xs text-muted-foreground">({creator.reviewCount})</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {creator.services.map((service, idx) => (
                  <div key={idx} className="border rounded-lg p-3">
                    <h4 className="font-medium mb-2">{service.title}</h4>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {service.deliveryDays} days
                      </div>
                      <div className="flex items-center gap-1 font-medium">
                        <DollarSign className="h-3 w-3" />
                        {service.price} USDC
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4">
                View Profile
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
