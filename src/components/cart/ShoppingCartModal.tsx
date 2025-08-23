
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trash2, ShoppingBag, DollarSign, Clock } from 'lucide-react';
import { useShoppingCart } from '@/hooks/useShoppingCart';
import { Link } from 'react-router-dom';

interface ShoppingCartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShoppingCartModal = ({ isOpen, onClose }: ShoppingCartModalProps) => {
  const { cartItems, cartCount, removeFromCart, clearCart, isRemovingFromCart } = useShoppingCart();

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.services?.price_usdc || 0), 0);

  if (cartCount === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Shopping Cart
            </DialogTitle>
            <DialogDescription>
              Your cart is currently empty
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center py-8">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No services in your cart yet</p>
            <Button onClick={onClose} asChild>
              <Link to="/browse">Browse Services</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Shopping Cart ({cartCount} items)
            </div>
            <Button variant="outline" size="sm" onClick={clearCart}>
              Clear All
            </Button>
          </DialogTitle>
          <DialogDescription>
            Review your selected services before checkout
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={item.creators?.users?.avatar_url} />
                      <AvatarFallback>
                        {item.creators?.users?.handle?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">
                      @{item.creators?.users?.handle}
                    </span>
                  </div>
                  
                  <h4 className="font-semibold mb-1">{item.services?.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {item.services?.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span className="font-medium">${item.services?.price_usdc} USDC</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{item.services?.delivery_days} days</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.services?.category}
                    </Badge>
                  </div>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeFromCart(item.id)}
                  disabled={isRemovingFromCart}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold">Total:</span>
            <span className="font-bold text-lg">${totalAmount.toFixed(2)} USDC</span>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Continue Shopping
            </Button>
            <Button className="flex-1" disabled={cartCount === 0}>
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
