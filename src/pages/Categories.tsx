
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, Hash, Video, FileText, Star, Megaphone, 
  Instagram, Facebook, Target, Palette, Trophy, Zap, Music, MoreHorizontal
} from 'lucide-react';

const iconMap: Record<string, any> = {
  ama: MessageSquare,
  twitter: Hash,
  video: Video,
  tutorials: FileText,
  reviews: Star,
  spaces: Megaphone,
  instagram: Instagram,
  facebook: Facebook,
  marketing: Target,
  branding: Palette,
  discord: Trophy,
  blogs: FileText,
  reddit: Hash,
  memes: Zap,
  music: Music,
  tiktok: Music,
  linkedin: Target,
  reels: Video,
  contest: Trophy,
  other: MoreHorizontal
};

export default function Categories() {
  const { data: categories, isLoading } = useQuery({
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

  if (isLoading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  }

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
          {categories?.map((category) => {
            const Icon = iconMap[category.value] || MoreHorizontal;
            return (
              <Card key={category.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-lg">
                      <Icon className="h-6 w-6 text-cyan-400" />
                    </div>
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                      Coming Soon
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-white">{category.label}</CardTitle>
                  <CardDescription className="text-zinc-400">{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-zinc-400">
                      Avg. starting at
                    </span>
                    <span className="font-semibold text-white">
                      $120 USDC
                    </span>
                  </div>
                  <Button asChild className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700">
                    <Link to={`/browse?category=${category.value}`}>
                      Browse {category.label}
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
