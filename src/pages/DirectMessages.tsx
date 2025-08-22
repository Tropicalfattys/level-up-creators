
import { useParams } from 'react-router-dom';
import { DirectMessageInterface } from '@/components/messaging/DirectMessageInterface';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DirectMessages() {
  const { userId } = useParams<{ userId: string }>();

  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Message Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested conversation could not be found.</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link to="/browse">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Button>
        </Link>
      </div>
      
      <DirectMessageInterface otherUserId={userId} />
    </div>
  );
}
