import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getCart, createOrder, createPaymentOrder, verifyPayment } from '@/lib/api';
import { toast } from 'sonner';

export default function Checkout() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Shipping form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await getCart();
      if (response.data.length === 0) {
        navigate('/cart');
        return;
      }
      setCartItems(response.data);
    } catch (error) {
      toast.error('Failed to load cart');
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (!name || !email || !phone || !address || !city || !state || !pincode) {
      toast.error('Please fill in all shipping details');
      return;
    }

    setProcessing(true);
    
    try {
      const totalAmount = calculateTotal();
      
      // Create Razorpay order
      const paymentOrderResponse = await createPaymentOrder({ amount: totalAmount });
      const { order_id, amount, currency, mock } = paymentOrderResponse.data;

      if (mock) {
        // Mock payment flow
        const orderItems = cartItems.map(item => ({
          product_id: item.product_id,
          title: item.product.title,
          size: item.size,
          quantity: item.quantity,
          price: item.product.price
        }));

        await createOrder({
          items: orderItems,
          total_amount: totalAmount,
          razorpay_order_id: order_id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          shipping_address: {
            name, email, phone, address, city, state, pincode
          }
        });

        toast.success('Order placed successfully! (Mock Payment)');
        navigate('/orders');
        return;
      }

      // Real Razorpay payment
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || '',
        amount: amount,
        currency: currency,
        name: "Caesura",
        description: "Streetwear Purchase",
        order_id: order_id,
        handler: async function (response) {
          try {
            // Verify payment
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            // Create order
            const orderItems = cartItems.map(item => ({
              product_id: item.product_id,
              title: item.product.title,
              size: item.size,
              quantity: item.quantity,
              price: item.product.price
            }));

            await createOrder({
              items: orderItems,
              total_amount: totalAmount,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              shipping_address: {
                name, email, phone, address, city, state, pincode
              }
            });

            toast.success('Order placed successfully!');
            navigate('/orders');
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: name,
          email: email,
          contact: phone
        },
        theme: {
          color: "#0047FF"
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error('Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" data-testid="checkout-loading"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12 px-6 md:px-12 max-w-[1200px] mx-auto">
        <h1 className="font-heading text-5xl font-bold tracking-tight mb-12">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Form */}
          <div className="lg:col-span-2 space-y-6" data-testid="shipping-form">
            <div className="border border-border p-6 space-y-4">
              <h2 className="font-heading text-2xl font-bold mb-4">Shipping Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="mt-2"
                    data-testid="shipping-name-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="mt-2"
                    data-testid="shipping-email-input"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="mt-2"
                  data-testid="shipping-phone-input"
                />
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea 
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, apartment, etc."
                  className="mt-2"
                  data-testid="shipping-address-input"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input 
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="mt-2"
                    data-testid="shipping-city-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input 
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    className="mt-2"
                    data-testid="shipping-state-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input 
                    id="pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="000000"
                    className="mt-2"
                    data-testid="shipping-pincode-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="border border-border p-6 space-y-4" data-testid="checkout-summary">
              <h2 className="font-heading text-2xl font-bold">Order Summary</h2>
              
              <div className="space-y-3 py-4 border-t border-border">
                {cartItems.map((item, index) => (
                  <div key={item.cart_item_id} className="flex justify-between text-sm" data-testid={`summary-item-${index}`}>
                    <span className="text-muted-foreground">
                      {item.product.title} ({item.size}) x{item.quantity}
                    </span>
                    <span className="font-semibold">₹{item.product.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2 py-4 border-t border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold" data-testid="checkout-subtotal">₹{calculateTotal()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-semibold">Free</span>
                </div>
              </div>
              
              <div className="flex justify-between pt-4 border-t border-border">
                <span className="font-heading text-xl font-bold">Total</span>
                <span className="font-heading text-xl font-bold" data-testid="checkout-total">₹{calculateTotal()}</span>
              </div>
              
              <Button
                onClick={handleCheckout}
                disabled={processing}
                size="lg"
                className="w-full rounded-full font-subheading"
                data-testid="place-order-btn"
              >
                {processing ? 'Processing...' : 'Place Order'}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Payment powered by Razorpay. Supports UPI, Cards, and more.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}