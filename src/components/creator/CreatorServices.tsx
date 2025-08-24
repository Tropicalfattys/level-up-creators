
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash, Copy, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from '@/hooks/useAuth';
import type { Booking } from '@/types/database';

interface BookingUser {
  handle: string | null;
  email: string;
}

interface ServiceBooking {
  id: string;
  status: string;
  usdc_amount: number;
  created_at: string;
  client_id: string;
  creator_id: string;
  service_id: string;
  updated_at: string;
  users: BookingUser;
}

interface ServiceWithBookings {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  price_usdc?: number;
  delivery_days?: number;
  category?: string;
  active: boolean;
  payment_method: string;
  created_at: string;
  updated_at: string;
  bookings?: ServiceBooking[];
}

export const CreatorServices = () => {
  const [open, setOpen] = useState(false);
  const [editService, setEditService] = useState<ServiceWithBookings | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceUsdc, setPriceUsdc] = useState<number | undefined>(undefined);
  const [deliveryDays, setDeliveryDays] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [active, setActive] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('ethereum_usdc');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['creator-services', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          bookings (
            id,
            status,
            usdc_amount,
            created_at,
            client_id,
            creator_id,
            service_id,
            updated_at,
            users!bookings_client_id_fkey (handle, email)
          )
        `)
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Ensure all services have payment_method field
      return (data || []).map(service => ({
        ...service,
        payment_method: service.payment_method || 'ethereum_usdc'
      }));
    },
    enabled: !!user?.id
  });

  const createService = useMutation({
    mutationFn: async () => {
      if (!title || !priceUsdc || !deliveryDays || !category) {
        throw new Error('Please fill in all fields.');
      }

      const { data, error } = await supabase
        .from('services')
        .insert({
          creator_id: user?.id,
          title,
          description,
          price_usdc: priceUsdc,
          delivery_days: deliveryDays,
          category,
          active,
          payment_method: paymentMethod
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Service created successfully!');
      queryClient.invalidateQueries({ queryKey: ['creator-services', user?.id] });
      closeModal();
    },
    onError: (error: any) => {
      toast.error('Failed to create service: ' + error.message);
    }
  });

  const updateService = useMutation({
    mutationFn: async () => {
      if (!editService?.id) {
        throw new Error('Service ID is missing.');
      }

      const { data, error } = await supabase
        .from('services')
        .update({
          title,
          description,
          price_usdc: priceUsdc,
          delivery_days: deliveryDays,
          category,
          active,
          payment_method: paymentMethod
        })
        .eq('id', editService.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Service updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['creator-services', user?.id] });
      closeModal();
    },
    onError: (error: any) => {
      toast.error('Failed to update service: ' + error.message);
    }
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Service deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['creator-services', user?.id] });
    },
    onError: (error: any) => {
      toast.error('Failed to delete service: ' + error.message);
    }
  });

  const copyService = useMutation({
    mutationFn: async (service: ServiceWithBookings) => {
      const { data, error } = await supabase
        .from('services')
        .insert({
          creator_id: user?.id,
          title: `${service.title} (Copy)`,
          description: service.description,
          price_usdc: service.price_usdc,
          delivery_days: service.delivery_days,
          category: service.category,
          active: service.active,
          payment_method: service.payment_method
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Service copied successfully!');
      queryClient.invalidateQueries({ queryKey: ['creator-services', user?.id] });
    },
    onError: (error: any) => {
      toast.error('Failed to copy service: ' + error.message);
    }
  });

  const openModal = () => {
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditService(null);
    setTitle('');
    setDescription('');
    setPriceUsdc(undefined);
    setDeliveryDays(undefined);
    setCategory(undefined);
    setActive(true);
    setPaymentMethod('ethereum_usdc');
  };

  const handleEdit = (service: ServiceWithBookings) => {
    setEditService(service);
    setTitle(service.title);
    setDescription(service.description || '');
    setPriceUsdc(service.price_usdc);
    setDeliveryDays(service.delivery_days);
    setCategory(service.category);
    setActive(service.active);
    setPaymentMethod(service.payment_method);
    openModal();
  };

  const handleSubmit = async () => {
    if (editService) {
      await updateService.mutateAsync();
    } else {
      await createService.mutateAsync();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>My Services</CardTitle>
            <CardDescription>
              Manage the services you offer to clients
            </CardDescription>
          </div>
          <Button onClick={openModal}>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {isLoading ? (
              <div className="text-center py-8">Loading services...</div>
            ) : services.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No services created yet
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <Card key={service.id} className="shadow-sm">
                    <CardHeader>
                      <CardTitle>{service.title}</CardTitle>
                      <CardDescription>
                        {service.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Price:</span> ${service.price_usdc}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Delivery:</span> {service.delivery_days} days
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Category:</span> {service.category}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Status:</span>
                        {service.active ? (
                          <Badge variant="outline">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      {service.bookings && service.bookings.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium">Recent Bookings:</p>
                          <ul className="list-disc pl-4 text-sm">
                            {service.bookings.map((booking) => (
                              <li key={booking.id}>
                                {booking.users?.handle || booking.users?.email} - ${booking.usdc_amount} ({booking.status})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                    <div className="flex justify-end space-x-2 p-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyService.mutate(service)}
                        disabled={copyService.isPending}
                      >
                        {copyService.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(service)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteService.mutate(service.id)}
                        disabled={deleteService.isPending}
                      >
                        {deleteService.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash className="mr-2 h-4 w-4" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editService ? 'Edit Service' : 'Add Service'}</DialogTitle>
            <DialogDescription>
              {editService ? 'Edit your service details' : 'Create a new service to offer to clients'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price (USDC)
              </Label>
              <Input
                type="number"
                id="price"
                value={priceUsdc}
                onChange={(e) => setPriceUsdc(e.target.value ? parseFloat(e.target.value) : undefined)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="delivery" className="text-right">
                Delivery Days
              </Label>
              <Input
                type="number"
                id="delivery"
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value ? parseInt(e.target.value) : undefined)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Input
                type="text"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentMethod" className="text-right">
                Payment Method
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum_usdc">Ethereum (USDC)</SelectItem>
                  <SelectItem value="solana_usdc">Solana (USDC)</SelectItem>
                  <SelectItem value="bsc_usdc">BSC (USDC)</SelectItem>
                  <SelectItem value="sui_usdc">Sui (USDC)</SelectItem>
                  <SelectItem value="cardano_usdm">Cardano (USDM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="active" className="text-right">
                Active
              </Label>
              <Switch
                id="active"
                checked={active}
                onCheckedChange={setActive}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createService.isPending || updateService.isPending}>
              {createService.isPending || updateService.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : editService ? (
                <CheckCircle className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {editService ? 'Update Service' : 'Create Service'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
