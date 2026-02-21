import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { getCart, updateCartItem, removeFromCart } from '@/lib/api';
import { toast } from 'sonner';
import { Trash2, ShoppingBag } from 'lucide-react';

export default function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await getCart();
      setCartItems(response.data);
    } catch (error) {
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      await updateCartItem(cartItemId, { quantity: newQuantity });
      setCartItems(cartItems.map(item => 
        item.cart_item_id === cartItemId ? { ...item, quantity: newQuantity } : item
      ));
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    try {
      await removeFromCart(cartItemId);
      setCartItems(cartItems.filter(item => item.cart_item_id !== cartItemId));
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" data-testid="cart-loading"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12 px-6 md:px-12 max-w-[1200px] mx-auto">
        <h1 className="font-heading text-5xl font-bold tracking-tight mb-12">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-20" data-testid="empty-cart-message">
            <ShoppingBag className="h-20 w-20 mx-auto mb-6 text-muted-foreground" />
            <h3 className="font-heading text-2xl font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6">Start shopping to add items to your cart</p>
            <Button 
              onClick={() => navigate('/marketplace')}
              className="rounded-full"
              data-testid="browse-marketplace-btn"
            >
              Browse Marketplace
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4" data-testid="cart-items-list">
              {cartItems.map((item, index) => (
                <motion.div
                  key={item.cart_item_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="flex gap-4 p-4 border border-border"
                  data-testid={`cart-item-${index}`}
                >
                  <div className="w-24 h-24 bg-muted flex-shrink-0">
                    <img 
                      src={item.product.mockup_image} 
                      alt={item.product.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-heading text-lg font-semibold mb-1" data-testid={`cart-item-title-${index}`}>{item.product.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.product.apparel_type === 'tshirt' ? 'T-Shirt' : 'Hoodie'} • Size: {item.size}
                    </p>
                    <p className="font-subheading font-semibold" data-testid={`cart-item-price-${index}`}>₹{item.product.price}</p>
                  </div>
                  
                  <div className="flex flex-col items-end justify-between">
                    <Button
                      onClick={() => handleRemoveItem(item.cart_item_id)}
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      data-testid={`remove-item-btn-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleUpdateQuantity(item.cart_item_id, item.quantity - 1)}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        data-testid={`decrease-quantity-btn-${index}`}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center font-semibold" data-testid={`item-quantity-${index}`}>{item.quantity}</span>
                      <Button
                        onClick={() => handleUpdateQuantity(item.cart_item_id, item.quantity + 1)}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        data-testid={`increase-quantity-btn-${index}`}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="border border-border p-6 space-y-4" data-testid="order-summary">
                <h2 className="font-heading text-2xl font-bold">Order Summary</h2>
                
                <div className="space-y-2 py-4 border-t border-border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold" data-testid="subtotal-amount">₹{calculateTotal()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-semibold">Free</span>
                  </div>
                </div>
                
                <div className="flex justify-between pt-4 border-t border-border">
                  <span className="font-heading text-xl font-bold">Total</span>
                  <span className="font-heading text-xl font-bold" data-testid="total-amount">₹{calculateTotal()}</span>
                </div>
                
                <Button
                  onClick={() => navigate('/checkout')}
                  size="lg"
                  className="w-full rounded-full font-subheading"
                  data-testid="proceed-to-checkout-btn"
                >
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}