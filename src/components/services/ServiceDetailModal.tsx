
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, DollarSign, User, Star } from 'lucide-react';
import { BookingModal } from './BookingModal';

interface ServiceDetailModalProps {
  service: {
    id: string;
    title: string;
    description: string;
    category: string;
    price_usdc: number;
    delivery_days: number;
    creator: {
      handle: string;
      avatar_url?: string;
    };
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceDetailModal = ({ service, isOpen, onClose }: ServiceDetailModalProps) => {
  const [showBookingModal, setShowBookingModal] = useState(false);

  if (!service) return null;

  const handleBookNow = () => {
    setShowBookingModal(true);
  };

  const handleBookingClose = () => {
    setShowBookingModal(false);
  };

  // Mock creator data structure for BookingModal
  const creatorData = {
    id: service.creator.handle, // Using handle as fallback ID
    user_id: service.creator.handle,
    users: {
      handle: service.creator.handle,
      avatar_url: service.creator.avatar_url || ''
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{service.title}</DialogTitle>
            <DialogDescription>Service Details</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Creator Info */}
            <div className="flex items-center gap-3">
              {service.creator.avatar_url && (
                <img
                  src={service.creator.avatar_url}
                  alt={service.creator.handle}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">@{service.creator.handle}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-3 w-3 fill-current" />
                  <span>Creator</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Service Details */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{service.description}</p>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-semibold">${service.price_usdc} USDC</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{service.delivery_days} days delivery</span>
                </div>
                <Badge variant="outline">{service.category}</Badge>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleBookNow} className="flex-1">
                Book Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          service={service}
          creator={creatorData}
          isOpen={showBookingModal}
          onClose={handleBookingClose}
        />
      )}
    </>
  );
};
