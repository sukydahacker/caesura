import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { CheckCircle, XCircle, Package } from 'lucide-react';
import { getPendingProducts, approveProduct, rejectProduct } from '@/lib/api';
import { toast } from 'sonner';

export default function Admin() {
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  const fetchPendingProducts = async () => {
    try {
      const response = await getPendingProducts();
      setPendingProducts(response.data);
    } catch (error) {
      toast.error('Failed to load pending products');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (productId) => {
    try {
      await approveProduct(productId);
      toast.success('Product approved successfully!');
      fetchPendingProducts();
    } catch (error) {
      toast.error('Failed to approve product');
    }
  };

  const handleReject = async (productId) => {
    if (!window.confirm('Are you sure you want to reject this product?')) return;
    
    try {
      await rejectProduct(productId);
      toast.success('Product rejected');
      fetchPendingProducts();
    } catch (error) {
      toast.error('Failed to reject product');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" data-testid="admin-loading"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark">
      <Navbar />
      
      <div className="pt-24 pb-12 px-6 md:px-12 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="font-heading text-5xl font-bold tracking-tight mb-2">Admin Panel</h1>
            <p className="text-muted-foreground font-subheading">Review and approve pending products</p>
          </div>
          
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            variant="outline"
            size="lg"
            className="rounded-full font-subheading"
            data-testid="back-to-dashboard-btn"
          >
            Back to Dashboard
          </Button>
        </div>

        {pendingProducts.length === 0 ? (
          <div className="text-center py-20" data-testid="no-pending-products">
            <Package className="h-20 w-20 mx-auto mb-6 text-muted-foreground" />
            <h3 className="font-heading text-2xl font-semibold mb-2">No pending products</h3>
            <p className="text-muted-foreground">All products have been reviewed!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="pending-products-grid">
            {pendingProducts.map((product, index) => (
              <motion.div
                key={product.product_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group relative bg-card border border-border overflow-hidden"
                data-testid={`pending-product-${index}`}
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  <img 
                    src={product.mockup_image} 
                    alt={product.title}
                    className="w-full h-full object-contain"
                  />
                  {product.design_image && (
                    <img
                      src={product.design_image}
                      alt="design"
                      className="absolute pointer-events-none"
                      style={{ top: '28%', left: '28%', width: '44%', height: '32%', objectFit: 'contain' }}
                    />
                  )}
                </div>
                
                <div className="p-6">
                  <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                    {product.apparel_type === 'tshirt' ? 'T-Shirt' : 'Hoodie'}
                  </p>
                  <h3 className="font-heading text-xl font-semibold mb-2" data-testid={`pending-product-title-${index}`}>{product.title}</h3>
                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
                  )}
                  <p className="font-subheading text-lg font-semibold mb-4">₹{product.price}</p>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleApprove(product.product_id)}
                      size="sm"
                      className="flex-1 rounded-full font-subheading bg-green-600 hover:bg-green-700"
                      data-testid={`approve-btn-${index}`}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    
                    <Button 
                      onClick={() => handleReject(product.product_id)}
                      size="sm"
                      variant="destructive"
                      className="rounded-full"
                      data-testid={`reject-btn-${index}`}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
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
