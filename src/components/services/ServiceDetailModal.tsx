
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, DollarSign, User, Star } from 'lucide-react';
import { BookingModal } from './BookingModal';

interface ServiceDetailModalProps {
  serviceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceDetailModal = ({ serviceId, isOpen, onClose }: ServiceDetailModalProps) => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  const { data: serviceData, isLoading, error } = useQuery({
    queryKey: ['service-detail', serviceId],
    queryFn: async () => {
      console.log('Fetching service detail for:', serviceId);
      
      // First fetch the service
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .eq('active', true)
        .single();

      if (serviceError) {
        console.error('Error fetching service:', serviceError);
        throw new Error(`Service not found: ${serviceError.message}`);
      }

      if (!service) {
        throw new Error('Service not found');
      }

      console.log('Service found:', service);

      // Then fetch the creator info using the creator_id (which now properly references creators table)
      const { data: creator, error: creatorError } = await supabase
        .from('creators')
        .select('id, user_id, rating, review_count')
        .eq('id', service.creator_id)
        .single();

      if (creatorError) {
        console.error('Error fetching creator:', creatorError);
        throw new Error(`Creator not found: ${creatorError.message}`);
      }

      console.log('Creator found:', creator);

      // Finally fetch the user info for the creator
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, handle, avatar_url')
        .eq('id', creator.user_id)
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
        throw new Error(`User not found: ${userError.message}`);
      }

      console.log('User found:', user);

      return {
        service,
        creator: {
          ...creator,
          users: user
        }
      };
    },
    enabled: !!serviceId && isOpen,
    retry: (failureCount, error) => {
      // Don't retry if it's a "not found" error
      if (error?.message?.includes('not found')) {
        return false;
      }
      return failureCount < 3;
    }
  });

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
            <DialogDescription>Loading service details...</DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading service details...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !serviceData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Service Not Found</DialogTitle>
            <DialogDescription>The requested service could not be found.</DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              {error?.message || 'Service not found or may have been removed.'}
            </p>
            <Button onClick={onClose} variant="outline">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { service, creator } = serviceData;

  return (
    <>
      <Dialog open={isOpen && !showBookingModal} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                {creator.users?.avatar_url ? (
                  <img
                    src={creator.users.avatar_url}
                    alt={creator.users.handle}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">@{creator.users?.handle || 'Creator'}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{creator.rating?.toFixed(1) || '0.0'}</span>
                  </div>
                  <span>•</span>
                  <span>{creator.review_count || 0} reviews</span>
                </div>
              </div>
              {service.category && (
                <Badge variant="outline">{service.category}</Badge>
              )}
            </div>

            <Separator />

            {/* Service Details */}
            <div>
              <h4 className="font-semibold mb-3">About This Service</h4>
              <p className="text-muted-foreground leading-relaxed">
                {service.description || 'No description provided for this service.'}
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
                  <p className="font-semibold">{service.delivery_days || 3} days</p>
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
