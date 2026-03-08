import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product, index = 0 }) {
  const navigate = useNavigate();
  const price = product?.price ? `₹${Math.round(product.price)}` : '₹999';
  const isSoldOut = product?.product_status === 'out_of_stock';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      onClick={() => !isSoldOut && navigate(`/t/${product?.product_id}`)}
      className="group cursor-pointer"
      style={{ background: '#141416' }}
      data-testid="product-card"
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '1/1' }}>
        <img
          src={product?.mockup_image || 'https://images.pexels.com/photos/9558752/pexels-photo-9558752.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=500&w=500'}
          alt={product?.title || 'Product'}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Heart */}
        <button
          className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: 'rgba(10,10,11,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}
          onClick={e => e.stopPropagation()}
          data-testid="product-card-heart"
        >
          <Heart size={14} style={{ color: '#FAFAF9' }} />
        </button>
        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(10,10,11,0.65)' }}>
            <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(250,250,249,0.6)' }}>
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5A5A5E', marginBottom: '4px' }}>
          {product?.apparel_type || 'T-Shirt'}
        </p>
        <h3 style={{ fontFamily: '"Instrument Serif", serif', fontSize: '16px', color: '#FAFAF9', margin: '0 0 8px 0', lineHeight: 1.2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
          {product?.title || 'Untitled Design'}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: '"Instrument Serif", serif', fontSize: '18px', color: '#FF9500' }}>
            {price}
          </span>
          <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '11px', color: '#5A5A5E' }}>
            {product?.units_sold || 0} sold
          </span>
        </div>
      </div>
    </motion.div>
  );
}
