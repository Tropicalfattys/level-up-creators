
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export const CategoryFilter = ({ value, onChange }: CategoryFilterProps) => {
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'ama', label: 'Host an AMA' },
    { value: 'twitter', label: 'Tweet Campaigns & Threads' },
    { value: 'video', label: 'Promo Videos' },
    { value: 'tutorials', label: 'Product Tutorials' },
    { value: 'reviews', label: 'Product Reviews' },
    { value: 'spaces', label: 'Host Twitter Spaces' },
    { value: 'instagram', label: 'Instagram Posts' },
    { value: 'facebook', label: 'Facebook Posts' },
    { value: 'marketing', label: 'General Marketing' },
    { value: 'branding', label: 'Project Branding' },
    { value: 'discord', label: 'Discord Contests' },
    { value: 'blogs', label: 'Blogs & Articles' },
    { value: 'reddit', label: 'Reddit Posts' },
    { value: 'memes', label: 'Meme Creation' },
    { value: 'music', label: 'Music Production' },
    { value: 'other', label: 'Other Services' }
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
