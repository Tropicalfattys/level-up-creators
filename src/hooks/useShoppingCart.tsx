
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  service_id: string;
  creator_id: string;
  added_at: string;
  services: {
    id: string;
    title: string;
    description: string;
    price_usdc: number;
    delivery_days: number;
    category: string;
  };
  creators: {
    user_id: string;
    users: {
      handle: string;
      avatar_url: string;
    };
  };
}

export const useShoppingCart = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ['shopping-cart', user?.id],
    queryFn: async (): Promise<CartItem[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('shopping_cart')
        .select(`
          *,
          services (
            id,
            title,
            description,
            price_usdc,
            delivery_days,
            category
          ),
          creators!shopping_cart_creator_id_fkey (
            user_id,
            users (
              handle,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ serviceId, creatorId }: { serviceId: string; creatorId: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('shopping_cart')
        .insert({
          user_id: user.id,
          service_id: serviceId,
          creator_id: creatorId
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-cart'] });
      toast.success('Service added to cart!');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Service is already in your cart');
      } else {
        toast.error('Failed to add service to cart');
      }
    }
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (cartItemId: string) => {
      const { error } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-cart'] });
      toast.success('Service removed from cart');
    },
    onError: () => {
      toast.error('Failed to remove service from cart');
    }
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-cart'] });
      toast.success('Cart cleared');
    },
    onError: () => {
      toast.error('Failed to clear cart');
    }
  });

  return {
    cartItems,
    cartCount: cartItems.length,
    isLoading,
    addToCart: addToCartMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    clearCart: clearCartMutation.mutate,
    isAddingToCart: addToCartMutation.isPending,
    isRemovingFromCart: removeFromCartMutation.isPending
  };
};
