
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Link } from 'react-router-dom';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  service?: Service;
}

const CATEGORIES = [
  { value: 'ama', label: 'Host an AMA' },
  { value: 'twitter', label: 'Tweet Campaigns & Threads' },
  { value: 'video', label: 'Promo Videos' },
  { value: 'tutorials', label: 'Product Tutorials' },
  { value: 'reviews', label: 'Product Reviews' },
  { value: 'spaces', label: 'Host Twitter Spaces' },
  { value: 'instagram', label: 'Instagram Posts' },
  { value: 'facebook', label: 'Facebook Posts' },
  { value: 'marketing', label: 'General Marketing' },
  { value: 'branding', label: 'Project Branding' },
  { value: 'discord', label: 'Discord Contests' },
  { value: 'blogs', label: 'Blogs & Articles' },
  { value: 'reddit', label: 'Reddit Posts' },
  { value: 'memes', label: 'Meme Creation' },
  { value: 'music', label: 'Music Production' },
  { value: 'other', label: 'Other Services' }
];

const PAYMENT_METHODS = {
  ethereum_usdc: { displayName: 'Ethereum USDC', chain: 'ethereum' },
  base_usdc: { displayName: 'Base USDC', chain: 'base' },
  solana_usdc: { displayName: 'Solana USDC', chain: 'solana' }
};

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

  const mutation = useMutation({
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
    mutation.mutate(id);
  };

  if (isLoading) return <div>Loading services...</div>;
  if (isError) return <div>Error fetching services.</div>;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Services</h1>
        <Button onClick={handleOpen}>Add Service</Button>
      </div>

      {services && services.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price (USDC)</TableHead>
                <TableHead>Delivery (Days)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{service.title}</TableCell>
                  <TableCell>{service.category}</TableCell>
                  <TableCell>{service.price_usdc}</TableCell>
                  <TableCell>{service.delivery_days}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(service)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(service.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p>No services created yet.</p>
      )}

      <ServiceForm isOpen={open} onClose={handleClose} service={selectedService || undefined} />
    </div>
  );
};

interface Service {
  id?: string;
  title: string;
  description: string;
  price_usdc: number;
  delivery_days: number;
  category: string;
  payment_method: string;
  active: boolean;
}

export const ServiceForm = ({ service, isOpen, onClose }: ServiceFormProps) => {
  const [formData, setFormData] = useState<Service>({
    title: service?.title || '',
    description: service?.description || '',
    price_usdc: service?.price_usdc || 0,
    delivery_days: service?.delivery_days || 3,
    category: service?.category || 'ama',
    payment_method: service?.payment_method || 'ethereum_usdc',
    active: service?.active ?? true,
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: Service) => {
      if (!user) throw new Error('User not authenticated');

      if (service?.id) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update(data)
          .eq('id', service.id);
        if (error) throw error;
      } else {
        // Create new service
        const { error } = await supabase
          .from('services')
          .insert([{ ...data, creator_id: user.id }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(service?.id ? 'Service updated successfully!' : 'Service created successfully!');
      queryClient.invalidateQueries({ queryKey: ['creator-services'] });
      onClose();
    },
    onError: (error) => {
      console.error('Service form error:', error);
      toast.error('Failed to save service. Please try again.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || formData.price_usdc <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    mutation.mutate(formData);
  };

  const handleChange = (field: keyof Service, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{service?.id ? 'Edit Service' : 'Create New Service'}</DialogTitle>
          <DialogDescription>
            {service?.id ? 'Update your service details' : 'Add a new service to your profile'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Service Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Trading Strategy Review"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe what you'll deliver to clients..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (USDC) *</Label>
              <Input
                id="price"
                type="number"
                min="1"
                step="0.01"
                value={formData.price_usdc}
                onChange={(e) => handleChange('price_usdc', parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="delivery">Delivery (Days)</Label>
              <Input
                id="delivery"
                type="number"
                min="1"
                max="30"
                value={formData.delivery_days}
                onChange={(e) => handleChange('delivery_days', parseInt(e.target.value) || 3)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="payment-method">Payment Method *</Label>
            <Select value={formData.payment_method} onValueChange={(value) => handleChange('payment_method', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                  <SelectItem key={key} value={key}>
                    {method.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Choose which network/token you want to receive for this service
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" type="button" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : (service?.id ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
