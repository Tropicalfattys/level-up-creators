
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Edit, Trash2 } from 'lucide-react';
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
}

export const CreatorServices = () => {
  const [open, setOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSelectedService(null);
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleCopy = (service: Service) => {
    setSelectedService({ ...service, id: undefined, title: `${service.title} (Copy)` });
    setOpen(true);
  };

  if (isLoading) return <div>Loading services...</div>;
  if (isError) return <div>Error fetching services.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
            <Card key={service.id} className="bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-500 hover:border-cyan-400 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-white">{service.title}</CardTitle>
                  <Badge 
                    variant={service.active ? "default" : "secondary"}
                    className={service.active ? "bg-green-600 text-white" : "bg-zinc-700 text-zinc-300"}
                  >
                    {service.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription className="text-zinc-400 line-clamp-2">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Price:</span>
                    <span className="text-white font-semibold">${service.price_usdc}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Delivery:</span>
                    <span className="text-white">{service.delivery_days} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Category:</span>
                    <span className="text-white capitalize">{service.category}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(service)}
                    className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(service)}
                    className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(service.id)}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
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
              <div className="text-zinc-400 text-lg">No services created yet</div>
              <p className="text-zinc-500 text-sm">
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
