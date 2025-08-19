
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { TrendingUp, Code, Palette, Gamepad2, Megaphone, Users } from 'lucide-react';

export default function Categories() {
  const categories = [
    {
      id: 'trading',
      name: 'Trading & Analysis',
      description: 'Get expert trading insights, portfolio reviews, and market analysis',
      icon: TrendingUp,
      creatorCount: 45,
      avgPrice: 89
    },
    {
      id: 'development',
      name: 'Development',
      description: 'Smart contract development, dApp building, and code reviews',
      icon: Code,
      creatorCount: 32,
      avgPrice: 149
    },
    {
      id: 'nft',
      name: 'NFT & Digital Art',
      description: 'NFT creation, collection curation, and digital art services',
      icon: Palette,
      creatorCount: 28,
      avgPrice: 79
    },
    {
      id: 'gaming',
      name: 'Gaming & Metaverse',
      description: 'GameFi strategies, metaverse consulting, and gaming content',
      icon: Gamepad2,
      creatorCount: 19,
      avgPrice: 99
    },
    {
      id: 'marketing',
      name: 'Marketing & Content',
      description: 'Crypto marketing, content creation, and social media strategy',
      icon: Megaphone,
      creatorCount: 38,
      avgPrice: 129
    },
    {
      id: 'community',
      name: 'Community & Events',
      description: 'Community building, event hosting, and networking services',
      icon: Users,
      creatorCount: 22,
      avgPrice: 69
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Categories</h1>
        <p className="text-xl text-muted-foreground">
          Explore different categories of crypto creator services
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="secondary">
                    {category.creatorCount} creators
                  </Badge>
                </div>
                <CardTitle className="text-xl">{category.name}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-muted-foreground">
                    Avg. starting at
                  </span>
                  <span className="font-semibold">
                    ${category.avgPrice} USDC
                  </span>
                </div>
                <Button asChild className="w-full">
                  <Link to={`/browse?category=${category.id}`}>
                    Browse {category.name}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
