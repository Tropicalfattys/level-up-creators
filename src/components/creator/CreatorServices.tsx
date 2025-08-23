
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, DollarSign, Clock, Eye } from 'lucide-react';
import { ServiceForm } from './ServiceForm';
import { toast } from 'sonner';

interface Service {
  id: string;
  title: string;
  description: string;
  price_usdc: number;
  delivery_days: number;
  category: string;
  active: boolean;
  created_at: string;
  _count?: {
    bookings: number;
  };
}

export const CreatorServices = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | undefined>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery({
    queryKey: ['creator-services', user?.id],
    queryFn: async (): Promise<Service[]> => {
      if (!user?.id) return [];

      // Use user.id directly as creator_id since creators table uses user_id
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          bookings(id)
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching services:', error);
        return [];
      }

      // Transform the data to include booking counts
      return (data || []).map(service => ({
        ...service,
        _count: {
          bookings: service.bookings?.length || 0
        }
      }));
    },
    enabled: !!user?.id
  });

  const toggleServiceMutation = useMutation({
    mutationFn: async ({ serviceId, active }: { serviceId: string; active: boolean }) => {
      const { error } = await supabase
        .from('services')
        .update({ active })
        .eq('id', serviceId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-services'] });
      toast.success('Service updated successfully');
    },
    onError: (error) => {
      console.error('Error updating service:', error);
      toast.error('Failed to update service');
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-services'] });
      toast.success('Service deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    }
  });

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingService(undefined);
  };

  const handleDelete = (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      deleteServiceMutation.mutate(serviceId);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading services...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold mb-2">My Services</h3>
          <p className="text-muted-foreground">
            Manage your services and track performance
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      {services && services.length > 0 ? (
        <div className="grid gap-4">
          {services.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {service.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={service.active ? 'default' : 'secondary'}>
                      {service.active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">{service.category}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">${service.price_usdc} USDC</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{service.delivery_days} days</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{service._count?.bookings || 0} bookings</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Active</span>
                      <Switch
                        checked={service.active}
                        onCheckedChange={(active) => 
                          toggleServiceMutation.mutate({ serviceId: service.id, active })
                        }
                        disabled={toggleServiceMutation.isPending}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(service)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                      disabled={deleteServiceMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <h4 className="text-lg font-medium mb-2">No services yet</h4>
            <p className="text-muted-foreground mb-4">
              Create your first service to start receiving bookings
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Service
            </Button>
          </CardContent>
        </Card>
      )}

      <ServiceForm
        service={editingService}
        isOpen={isFormOpen}
        onClose={handleFormClose}
      />
    </div>
  );
};
