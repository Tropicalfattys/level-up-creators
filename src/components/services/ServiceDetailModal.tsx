import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Clock, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BookingModal } from './BookingModal';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface Service {
  id: string;
  title: string;
  description: string;
  price_usdc: number;
  delivery_days: number;
  category: string;
  payment_method?: string;
  creator_id?: string;
  creator?: {
    id: string;
    user_id: string;
    users: {
      handle: string;
      avatar_url?: string;
    };
    rating: number;
    review_count: number;
  };
}

interface ServiceDetailModalProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceDetailModal = ({ service, isOpen, onClose }: ServiceDetailModalProps) => {
  const { user } = useAuth();
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  if (!service) return null;

  const handleBookNow = () => {
    if (!user) {
      // Redirect to auth page or show login modal
      return;
    }
    setShowBookingModal(true);
  };

  // Create creator object for BookingModal
  const creator = service.creator ? {
    id: service.creator.id,
    user_id: service.creator.user_id,
    users: {
      handle: service.creator.users.handle,
      avatar_url: service.creator.users.avatar_url || ''
    }
  } : {
    id: '',
    user_id: service.creator_id || '',
    users: {
      handle: 'Unknown Creator',
      avatar_url: ''
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={service.creator?.users.avatar_url} />
                <AvatarFallback>
                  {service.creator?.users.handle[0]?.toUpperCase() || 'C'}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl">{service.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <span>by </span>
                  {service.creator?.users.handle ? (
                    <Link 
                      to={`/profile/${service.creator.users.handle}`}
                      className="text-primary hover:underline"
                    >
                      @{service.creator.users.handle}
                    </Link>
                  ) : (
                    <span>@Unknown</span>
                  )}
                  {service.creator && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">
                        {service.creator.rating.toFixed(1)} ({service.creator.review_count} reviews)
                      </span>
                    </div>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div className="font-semibold">${service.price_usdc}</div>
                <div className="text-sm text-muted-foreground">USD</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className="font-semibold">{service.delivery_days} days</div>
                <div className="text-sm text-muted-foreground">Delivery</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Badge variant="outline" className="mb-2">
                  {service.category}
                </Badge>
                <div className="text-sm text-muted-foreground">Category</div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              {user ? (
              <Button 
                onClick={handleBookNow}
                className="flex-1"
              >
                Continue Booking Service
              </Button>
              ) : (
                <Button asChild className="flex-1">
                  <a href="/auth">Sign In to Book</a>
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showBookingModal && service && (
        <BookingModal
          service={{
            ...service,
            payment_method: service.payment_method || 'ethereum_usdc'
          }}
          creator={creator}
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </>
  );
};
