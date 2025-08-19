
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, MoreVertical, Eye, EyeOff } from 'lucide-react';
import { ServiceForm } from '@/components/creator/ServiceForm';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
}

export default function Services() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | undefined>();
  const { user } = useAuth();

  const { data: services, isLoading, refetch } = useQuery({
    queryKey: ['creator-services', user?.id],
    queryFn: async (): Promise<Service[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const toggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('services')
      .update({ active: !currentStatus })
      .eq('id', serviceId);

    if (error) {
      toast.error('Failed to update service status');
    } else {
      toast.success(`Service ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      refetch();
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingService(undefined);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manage Services</h1>
        <p className="text-muted-foreground">
          Create and manage your service offerings
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Your Services</CardTitle>
              <CardDescription>
                Services you offer to clients on the platform
              </CardDescription>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading services...</div>
          ) : services && services.length > 0 ? (
            <div className="grid gap-4">
              {services.map((service) => (
                <Card key={service.id} className="border">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{service.title}</CardTitle>
                          <Badge variant={service.active ? 'default' : 'secondary'}>
                            {service.active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">{service.category}</Badge>
                        </div>
                        <CardDescription className="mb-3">
                          {service.description}
                        </CardDescription>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-semibold">${service.price_usdc} USDC</span>
                          <span className="text-muted-foreground">
                            {service.delivery_days} days delivery
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(service)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Service
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => toggleServiceStatus(service.id, service.active)}
                          >
                            {service.active ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                You haven't created any services yet
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Service
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ServiceForm
        service={editingService}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
      />
    </div>
  );
}
