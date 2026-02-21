import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { getOrders } from '@/lib/api';
import { toast } from 'sonner';
import { Package, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await getOrders();
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'text-green-600';
      case 'shipped':
        return 'text-blue-600';
      case 'delivered':
        return 'text-green-700';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" data-testid="orders-loading"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12 px-6 md:px-12 max-w-[1200px] mx-auto">
        <h1 className="font-heading text-5xl font-bold tracking-tight mb-12">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20" data-testid="no-orders-message">
            <Package className="h-20 w-20 mx-auto mb-6 text-muted-foreground" />
            <h3 className="font-heading text-2xl font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground">Your order history will appear here</p>
          </div>
        ) : (
          <div className="space-y-6" data-testid="orders-list">
            {orders.map((order, index) => (
              <motion.div
                key={order.order_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="border border-border p-6 space-y-4"
                data-testid={`order-card-${index}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-heading text-xl font-semibold mb-1" data-testid={`order-id-${index}`}>
                      Order #{order.order_id.slice(-8).toUpperCase()}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-semibold capitalize ${getStatusColor(order.status)}`} data-testid={`order-status-${index}`}>
                      {order.status === 'paid' && <CheckCircle className="inline h-4 w-4 mr-1" />}
                      {order.status}
                    </p>
                    <p className="font-heading text-xl font-bold mt-1" data-testid={`order-total-${index}`}>
                      ₹{order.total_amount}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  {order.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex justify-between text-sm" data-testid={`order-item-${index}-${itemIndex}`}>
                      <span className="text-muted-foreground">
                        {item.title} ({item.size}) x{item.quantity}
                      </span>
                      <span className="font-semibold">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="font-heading font-semibold mb-2">Shipping Address</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{order.shipping_address.name}</p>
                    <p>{order.shipping_address.address}</p>
                    <p>
                      {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}
                    </p>
                    <p>{order.shipping_address.phone}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}