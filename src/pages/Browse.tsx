
import { AdvancedSearch } from '@/components/search/AdvancedSearch';

const Browse = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Services</h1>
          <p className="text-muted-foreground">
            Discover talented creators and find the perfect service for your needs
          </p>
        </div>
        
        <AdvancedSearch />
      </div>
    </div>
  );
};

export default Browse;
