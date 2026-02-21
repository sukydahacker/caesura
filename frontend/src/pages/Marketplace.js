import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { getProducts } from '@/lib/api';
import { toast } from 'sonner';

export default function Marketplace() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" data-testid="marketplace-loading"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12 px-6 md:px-12 max-w-[1600px] mx-auto">
        <div className="mb-12">
          <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight mb-4">Marketplace</h1>
          <p className="text-muted-foreground font-subheading text-lg">
            Discover unique designs from our creator community
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20" data-testid="no-products-message">
            <h3 className="font-heading text-2xl font-semibold mb-2">No products yet</h3>
            <p className="text-muted-foreground">Check back soon for amazing designs!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="products-grid">
            {products.map((product, index) => (
              <motion.div
                key={product.product_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                onClick={() => navigate(`/product/${product.product_id}`)}
                className="group cursor-pointer bg-transparent border-none"
                data-testid={`product-card-${index}`}
              >
                <div className="aspect-square bg-muted relative overflow-hidden mb-4">
                  <img 
                    src={product.mockup_image} 
                    alt={product.title}
                    className="w-full h-full object-contain transition-transform group-hover:scale-105"
                  />
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    {product.apparel_type === 'tshirt' ? 'T-Shirt' : 'Hoodie'}
                  </p>
                  <h3 className="font-heading text-xl font-semibold" data-testid={`product-title-${index}`}>{product.title}</h3>
                  <p className="font-subheading text-lg font-semibold" data-testid={`product-price-${index}`}>₹{product.price}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}