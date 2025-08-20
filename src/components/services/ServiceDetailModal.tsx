
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, DollarSign, User, Star } from 'lucide-react';
import { BookingModal } from './BookingModal';

interface Service {
  id: string;
  title: string;
  description: string;
  price_usdc: number;
  delivery_days: number;
  category: string;
  creator_id: string;
}

interface Creator {
  id: string;
  user_id: string;
  users: {
    handle: string;
    avatar_url: string;
  };
  rating: number;
  review_count: number;
}

interface ServiceDetailModalProps {
  serviceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceDetailModal = ({ serviceId, isOpen, onClose }: ServiceDetailModalProps) => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  const { data: serviceData, isLoading } = useQuery({
    queryKey: ['service-detail', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          creators!inner(
            id,
            user_id,
            rating,
            review_count,
            users!inner(
              handle,
              avatar_url
            )
          )
        `)
        .eq('id', serviceId)
        .eq('active', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!serviceId && isOpen
  });

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">Loading service details...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!serviceData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">Service not found</div>
        </DialogContent>
      </Dialog>
    );
  }

  const service = serviceData as Service;
  const creator = serviceData.creators as Creator;

  return (
    <>
      <Dialog open={isOpen && !showBookingModal} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{service.title}</DialogTitle>
            <DialogDescription>
              Service details and creator information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Creator Info */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {creator.users.avatar_url ? (
                  <img
                    src={creator.users.avatar_url}
                    alt={creator.users.handle}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">@{creator.users.handle}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{creator.rating.toFixed(1)}</span>
                  </div>
                  <span>•</span>
                  <span>{creator.review_count} reviews</span>
                </div>
              </div>
              <Badge variant="outline">{service.category}</Badge>
            </div>

            <Separator />

            {/* Service Details */}
            <div>
              <h4 className="font-semibold mb-3">About This Service</h4>
              <p className="text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </div>

            <Separator />

            {/* Service Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="font-semibold">${service.price_usdc} USDC</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Delivery</p>
                  <p className="font-semibold">{service.delivery_days} days</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              <Button 
                onClick={() => setShowBookingModal(true)} 
                className="flex-1"
              >
                Book This Service
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          service={service}
          creator={creator}
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            onClose();
          }}
        />
      )}
    </>
  );
};
