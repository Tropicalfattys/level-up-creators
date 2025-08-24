
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export const CategoryFilter = ({ value, onChange }: CategoryFilterProps) => {
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'trading', label: 'Trading' },
    { value: 'nft', label: 'NFT' },
    { value: 'defi', label: 'DeFi' },
    { value: 'education', label: 'Education' },
    { value: 'development', label: 'Development' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'music', label: 'Music' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Filter by category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category.value} value={category.value}>
            {category.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
