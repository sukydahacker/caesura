import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { getProduct, addToCart } from '@/lib/api';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await getProduct(productId);
      setProduct(response.data);
    } catch (error) {
      toast.error('Product not found');
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      await addToCart({
        product_id: product.product_id,
        size: selectedSize,
        quantity
      });
      toast.success('Added to cart!');
      navigate('/cart');
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Please sign in to add items to cart');
        const redirectUrl = window.location.origin + '/dashboard';
        window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      } else {
        toast.error('Failed to add to cart');
      }
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" data-testid="product-loading"></div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12 px-6 md:px-12 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="sticky top-24 h-fit"
          >
            <div className="aspect-square bg-muted overflow-hidden">
              <img 
                src={product.mockup_image} 
                alt={product.title}
                className="w-full h-full object-contain"
                data-testid="product-image"
              />
            </div>
          </motion.div>

          {/* Product Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                {product.apparel_type === 'tshirt' ? 'T-Shirt' : 'Hoodie'}
              </p>
              <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4" data-testid="product-detail-title">
                {product.title}
              </h1>
              <p className="font-subheading text-3xl font-bold" data-testid="product-detail-price">₹{product.price}</p>
              {product.product_status === 'out_of_stock' && (
                <div className="mt-3 inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold" data-testid="out-of-stock-notice">
                  Currently Out of Stock
                </div>
              )}
            </div>

            {product.description && (
              <div>
                <h3 className="font-heading text-xl font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground leading-relaxed" data-testid="product-detail-description">{product.description}</p>
              </div>
            )}

            {/* Size Selection */}
            <div>
              <h3 className="font-heading text-xl font-semibold mb-4">Select Size</h3>
              <div className="flex gap-2" data-testid="size-selector">
                {product.sizes.map((size) => (
                  <Button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    variant={selectedSize === size ? 'default' : 'outline'}
                    className="w-16 h-16 rounded-full font-subheading"
                    data-testid={`size-btn-${size}`}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <h3 className="font-heading text-xl font-semibold mb-4">Quantity</h3>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  data-testid="quantity-decrease-btn"
                >
                  -
                </Button>
                <span className="font-subheading text-xl font-semibold w-12 text-center" data-testid="quantity-display">{quantity}</span>
                <Button
                  onClick={() => setQuantity(quantity + 1)}
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  data-testid="quantity-increase-btn"
                >
                  +
                </Button>
              </div>
            </div>

            {/* Add to Cart */}
            {product.product_status === 'out_of_stock' ? (
              <Button
                disabled
                size="lg"
                className="w-full h-14 rounded-full font-subheading text-base bg-gray-300 cursor-not-allowed"
                data-testid="add-to-cart-btn-disabled"
              >
                Out of Stock
              </Button>
            ) : (
              <Button
                onClick={handleAddToCart}
                disabled={addingToCart}
                size="lg"
                className="w-full h-14 rounded-full font-subheading text-base"
                data-testid="add-to-cart-btn"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </Button>
            )}

            {/* Product Info */}
            <div className="border-t border-border pt-8 space-y-4">
              <div>
                <h4 className="font-heading font-semibold mb-2">Product Details</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Premium quality fabric</li>
                  <li>• Print-on-demand production</li>
                  <li>• Ships within 5-7 business days</li>
                  <li>• 100% original creator design</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}