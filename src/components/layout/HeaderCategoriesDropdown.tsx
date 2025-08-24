
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export const HeaderCategoriesDropdown = () => {
  const { data: categories } = useQuery({
    queryKey: ['header-categories'],
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

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="text-white hover:text-cyan-400">
        Categories
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="w-80 p-4 bg-zinc-900 border-zinc-800">
          <div className="grid gap-2">
            {categories?.map((category) => (
              <Link
                key={category.id}
                to={`/browse?category=${category.value}`}
                className="block px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
              >
                {category.label}
              </Link>
            )) || (
              <div className="text-zinc-400 text-sm">Loading categories...</div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <Link
              to="/browse"
              className="block px-3 py-2 text-sm text-cyan-400 hover:text-cyan-300 rounded-md font-medium"
            >
              Browse All Categories →
            </Link>
          </div>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};
