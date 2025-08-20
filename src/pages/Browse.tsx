
import { AdvancedSearch } from '@/components/search/AdvancedSearch';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Browse = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
          </div>
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
