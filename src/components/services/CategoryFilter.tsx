
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export const CategoryFilter = ({ value, onChange }: CategoryFilterProps) => {
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

  // Add "All Categories" option
  const allCategories = [
    { value: 'all', label: 'All Categories' },
    ...(categories || []).map(cat => ({ value: cat.value, label: cat.label }))
  ];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Filter by category" />
      </SelectTrigger>
      <SelectContent className="max-h-[40vh]">
        {allCategories.map((category) => (
          <SelectItem key={category.value} value={category.value}>
            {category.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
