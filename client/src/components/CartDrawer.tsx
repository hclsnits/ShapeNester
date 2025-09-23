import { CartItem } from '@/types';
import { formatCentsEUR, centsToEuros } from '@/lib/money';
import { removeFromCart, clearCart, loadCart } from '@/lib/cartStorage';
import { CartItemComponent } from '@/components/CartItem';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Trash2 } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onItemsChange: (items: CartItem[]) => void;
  onLoadItem: (item: CartItem) => void;
}

export function CartDrawer({ isOpen, onClose, items, onItemsChange, onLoadItem }: CartDrawerProps) {
  const { toast } = useToast();

  const handleRemoveItem = (itemId: string) => {
    removeFromCart(itemId);
    const updatedItems = loadCart();
    onItemsChange(updatedItems);
    toast({
      title: "Item Removed",
      description: "Item removed from cart successfully.",
    });
  };

  const handleClearCart = () => {
    clearCart();
    onItemsChange([]);
    toast({
      title: "Cart Cleared",
      description: "All items removed from cart.",
    });
  };

  const subtotal = items.reduce((sum, item) => sum + centsToEuros(item.costing.total_cents), 0);
  const shipping = 12.50; // Standard shipping
  const total = subtotal + shipping;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-96" data-testid="cart-drawer">
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-6">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Your cart is empty
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <CartItemComponent
                  key={item.id}
                  item={item}
                  onRemove={handleRemoveItem}
                  onLoadInDesigner={onLoadItem}
                />
              ))}
            </div>
          )}
        </div>
        
        {items.length > 0 && (
          <div className="border-t border-border pt-6">
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium text-foreground" data-testid="text-subtotal">
                  {formatCentsEUR(BigInt(Math.round(subtotal * 100)))}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Shipping:</span>
                <span className="font-medium text-foreground" data-testid="text-shipping">
                  {formatCentsEUR(BigInt(Math.round(shipping * 100)))}
                </span>
              </div>
              <div className="border-t border-border pt-2">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span className="text-foreground">Total:</span>
                  <span className="text-primary" data-testid="text-cart-total">
                    {formatCentsEUR(BigInt(Math.round(total * 100)))}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button className="w-full" data-testid="button-checkout">
                <CreditCard className="mr-2 h-4 w-4" />
                Checkout
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleClearCart}
                data-testid="button-clear-cart"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Cart
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
