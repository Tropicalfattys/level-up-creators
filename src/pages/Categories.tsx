import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, Hash, Video, FileText, Star, Megaphone, 
  Instagram, Facebook, Target, Palette, Trophy, Zap, Music, MoreHorizontal
} from 'lucide-react';

export default function Categories() {
  const categories = [
    {
      id: 'ama',
      name: 'Host an AMA',
      description: 'Live Ask Me Anything sessions on Telegram, Twitter, Discord',
      icon: MessageSquare,
      creatorCount: 'Coming Soon',
      avgPrice: 150
    },
    {
      id: 'twitter',
      name: 'Tweet Campaigns & Threads',
      description: 'Engaging Twitter content and viral thread creation',
      icon: Hash,
      creatorCount: 'Coming Soon',
      avgPrice: 100
    },
    {
      id: 'video',
      name: 'Promo Videos',
      description: 'TikTok, Reels, YouTube Shorts for maximum reach',
      icon: Video,
      creatorCount: 'Coming Soon',
      avgPrice: 200
    },
    {
      id: 'tutorials',
      name: 'Product Tutorials',
      description: 'Step-by-step walkthroughs and educational content',
      icon: FileText,
      creatorCount: 'Coming Soon',
      avgPrice: 125
    },
    {
      id: 'reviews',
      name: 'Product Reviews',
      description: 'Honest and detailed project reviews and analysis',
      icon: Star,
      creatorCount: 'Coming Soon',
      avgPrice: 175
    },
    {
      id: 'spaces',
      name: 'Host Twitter Spaces',
      description: 'Live audio engagement and community discussions',
      icon: Megaphone,
      creatorCount: 'Coming Soon',
      avgPrice: 180
    },
    {
      id: 'instagram',
      name: 'Instagram Posts',
      description: 'Visual content creation for Instagram marketing',
      icon: Instagram,
      creatorCount: 'Coming Soon',
      avgPrice: 90
    },
    {
      id: 'facebook',
      name: 'Facebook Posts',
      description: 'Social media content for Facebook reach',
      icon: Facebook,
      creatorCount: 'Coming Soon',
      avgPrice: 85
    },
    {
      id: 'marketing',
      name: 'General Marketing',
      description: 'Full marketing campaign strategies and execution',
      icon: Target,
      creatorCount: 'Coming Soon',
      avgPrice: 250
    },
    {
      id: 'branding',
      name: 'Project Branding',
      description: 'Brand identity development and visual design',
      icon: Palette,
      creatorCount: 'Coming Soon',
      avgPrice: 300
    },
    {
      id: 'discord',
      name: 'Discord Contests',
      description: 'Community engagement and contest management',
      icon: Trophy,
      creatorCount: 'Coming Soon',
      avgPrice: 120
    },
    {
      id: 'blogs',
      name: 'Blogs & Articles',
      description: 'Written content creation and thought leadership',
      icon: FileText,
      creatorCount: 'Coming Soon',
      avgPrice: 140
    },
    {
      id: 'reddit',
      name: 'Reddit Posts',
      description: 'Community discussions and Reddit engagement',
      icon: Hash,
      creatorCount: 'Coming Soon',
      avgPrice: 75
    },
    {
      id: 'memes',
      name: 'Meme Creation',
      description: 'Viral meme content and humorous marketing',
      icon: Zap,
      creatorCount: 'Coming Soon',
      avgPrice: 60
    },
    {
      id: 'music',
      name: 'Music Production',
      description: 'Custom music, beats, jingles, and audio content creation',
      icon: Music,
      creatorCount: 'Coming Soon',
      avgPrice: 180
    },
    {
      id: 'other',
      name: 'Other Services',
      description: 'Unique and specialized services not covered elsewhere',
      icon: MoreHorizontal,
      creatorCount: 'Coming Soon',
      avgPrice: 120
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
            Categories
          </h1>
          <p className="text-xl text-zinc-400">
            Explore different categories of crypto creator services
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-lg">
                      <Icon className="h-6 w-6 text-cyan-400" />
                    </div>
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                      {category.creatorCount}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-white">{category.name}</CardTitle>
                  <CardDescription className="text-zinc-400">{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-zinc-400">
                      Avg. starting at
                    </span>
                    <span className="font-semibold text-white">
                      ${category.avgPrice} USDC
                    </span>
                  </div>
                  <Button asChild className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700">
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
    </div>
  );
}
