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

interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  service?: Service;
}

// Comprehensive category list matching the Categories page
const CATEGORIES = [
  { value: 'live-streams', label: 'Live Streams & AMAs' },
  { value: 'social-media', label: 'Social Media Management' },
  { value: 'content-creation', label: 'Content Creation' },
  { value: 'marketing', label: 'Marketing & Promotion' },
  { value: 'education', label: 'Education & Tutorials' },
  { value: 'consulting', label: 'Consulting & Strategy' },
  { value: 'community', label: 'Community Building' },
  { value: 'development', label: 'Development & Technical' },
  { value: 'design', label: 'Design & Creative' },
  { value: 'writing', label: 'Writing & Content' },
  { value: 'video', label: 'Video Production' },
  { value: 'audio', label: 'Audio & Podcasting' },
  { value: 'nft', label: 'NFT & Digital Art' },
  { value: 'defi', label: 'DeFi & Trading' },
  { value: 'gaming', label: 'Gaming & Metaverse' },
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
