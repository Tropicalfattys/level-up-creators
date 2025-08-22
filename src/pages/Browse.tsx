
import { useSearchParams } from 'react-router-dom';
import { CreatorExplorer } from '@/components/browse/CreatorExplorer';

const Browse = () => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || undefined;

  return <CreatorExplorer selectedCategory={category} />;
};

export default Browse;
