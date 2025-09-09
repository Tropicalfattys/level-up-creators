
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Edit, Trash2, Pause, Play } from 'lucide-react';
import { ServiceForm } from './ServiceForm';

interface Service {
  id: string;
  title: string;
  description: string;
  price_usdc: number;
  delivery_days: number;
  category: string;
  payment_method: string;
  active: boolean;
  availability_type: string;
  target_username?: string;
}

export const CreatorServices = () => {
  const [open, setOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const { user, userProfile } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Check if creator is banned - prevent service management
  const isUserBanned = userProfile?.banned === true;

  const { data: services, isLoading, isError } = useQuery({
    queryKey: ['creator-services'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('creator_id', user.id);

      if (error) {
        console.error('Error fetching services:', error);
        throw error;
      }
      return data as Service[];
    },
  });

  const snoozeMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { data, error } = await supabase
        .from('services')
        .update({ active: !active })
        .eq('id', id);

      if (error) {
        console.error('Error toggling service status:', error);
        throw error;
      }
      return data;
    },
    onSuccess: (_, { active }) => {
      toast.success(active ? 'Service paused successfully!' : 'Service reactivated successfully!');
      queryClient.invalidateQueries({ queryKey: ['creator-services'] });
    },
    onError: (error) => {
      console.error('Service toggle error:', error);
      toast.error('Failed to update service status. Please try again.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting service:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Service deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['creator-services'] });
    },
    onError: (error) => {
      console.error('Service delete error:', error);
      toast.error('Failed to delete service. Please try again.');
    }
  });

  const handleClose = () => {
    setOpen(false);
    setSelectedService(null);
  };

  const handleEdit = (service: Service) => {
    if (isUserBanned) {
      toast.error('Your account access has been restricted. You cannot edit services at this time.');
      return;
    }
    setSelectedService(service);
    setOpen(true);
  };

  const handleSnooze = (service: Service) => {
    if (isUserBanned) {
      toast.error('Your account access has been restricted. You cannot modify services at this time.');
      return;
    }
    snoozeMutation.mutate({ id: service.id, active: service.active });
  };

  const handleDelete = (id: string) => {
    if (isUserBanned) {
      toast.error('Your account access has been restricted. You cannot delete services at this time.');
      return;
    }
    deleteMutation.mutate(id);
  };

  const handleCopy = (service: Service) => {
    if (isUserBanned) {
      toast.error('Your account access has been restricted. You cannot create services at this time.');
      return;
    }
    setSelectedService({ ...service, id: undefined, title: `${service.title} (Copy)` });
    setOpen(true);
  };

  const handleOpen = () => {
    if (isUserBanned) {
      toast.error('Your account access has been restricted. You cannot create services at this time.');
      return;
    }
    setOpen(true);
  };

  if (isLoading) return <div>Loading services...</div>;
  if (isError) return <div>Error fetching services.</div>;

  return (
    <div className="space-y-6">
      <div className={isMobile ? 'space-y-3' : 'flex items-center justify-between'}>
        <div>
          <h2 className="text-2xl font-bold text-white">My Services</h2>
          <p className="text-zinc-400">Manage the services you offer to clients</p>
        </div>
        <Button onClick={handleOpen} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
          Add Service
        </Button>
      </div>

      {services && services.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-500 hover:border-cyan-400 transition-colors flex flex-col h-full">
              <CardHeader className="border-4 border-black rounded-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-black">{service.title}</CardTitle>
                  <Badge 
                    variant={service.active ? "default" : "secondary"}
                    className={service.active ? "bg-green-600 text-white" : "bg-red-600 text-white"}
                  >
                    {service.active ? "Active" : "Paused"}
                  </Badge>
                </div>
                <CardDescription className="text-black line-clamp-2">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 mt-auto">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-black">Price:</span>
                    <span className="text-black font-semibold">${service.price_usdc}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-black">Delivery:</span>
                    <span className="text-black">{service.delivery_days} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-black">Category:</span>
                    <span className="text-black capitalize">{service.category}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(service)}
                    className="bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white border-0"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(service)}
                    className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white border-0"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSnooze(service)}
                    className="bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white border-0"
                  >
                    {service.active ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                    {service.active ? "Snooze" : "Reactivate"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(service.id)}
                    className="bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white border-0"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-500">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="text-black text-lg">No services created yet</div>
              <p className="text-black text-sm">
                Create your first service to start offering your expertise to clients
              </p>
              <Button onClick={handleOpen} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                Create Your First Service
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ServiceForm isOpen={open} onClose={handleClose} service={selectedService || undefined} />
    </div>
  );
};
