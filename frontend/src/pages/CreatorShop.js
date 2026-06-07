import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package } from 'lucide-react';
import { getProducts } from '@/lib/api';

const BG  = '#0A0A0B';
const BG2 = '#141416';
const BG3 = '#1C1C1F';
const AS  = '#C8FF00';
const TP  = '#FAFAF9';
const TS  = '#9A9A9D';
const TT  = '#5A5A5E';
const BS  = 'rgba(255,255,255,0.07)';
const ease = [0.22, 1, 0.36, 1];

const display = { fontFamily: '"Clash Display", sans-serif' };
const body    = { fontFamily: '"Cabinet Grotesk", sans-serif' };
const script  = { fontFamily: '"Caveat", cursive' };

export default function CreatorShop() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreatorProducts();
  }, [userId]);

  const fetchCreatorProducts = async () => {
    try {
      const r = await getProducts(0, 100);
      const allProducts = r.data?.products || r.data || [];
      const creatorProducts = allProducts.filter(
        p => p.creator_id === userId || p.user_id === userId
      );
      setProducts(creatorProducts);
      if (creatorProducts.length > 0) {
        const p = creatorProducts[0];
        setCreator({
          name: p.creator_name || p.creator?.name || 'Creator',
          picture: p.creator_picture || p.creator?.picture,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...script, fontSize: '24px', color: TT }}>loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: BG }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px 80px' }}>

        {/* Back nav */}
        <div style={{ padding: '32px 0 0' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ ...body, fontSize: '13px', color: TS, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        {/* Creator header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          style={{ padding: '48px 0 40px', borderBottom: `1px solid ${BS}`, marginBottom: '48px', display: 'flex', alignItems: 'center', gap: '24px' }}
        >
          {creator?.picture ? (
            <img
              src={creator.picture}
              alt={creator.name}
              style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${BS}` }}
            />
          ) : (
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: BG3, border: `2px solid ${BS}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ ...display, fontSize: '28px', color: AS, fontWeight: 700 }}>
                {(creator?.name || 'C')[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 style={{ ...display, fontWeight: 700, fontSize: 'clamp(28px, 4vw, 48px)', color: TP, margin: '0 0 6px', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
              {creator?.name || 'Creator'}
            </h1>
            <span style={{ ...body, fontSize: '13px', color: TT }}>
              {products.length} product{products.length !== 1 ? 's' : ''}
            </span>
          </div>
        </motion.div>

        {/* Products grid */}
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Package size={40} style={{ color: TT, marginBottom: '16px' }} />
            <p style={{ ...body, fontSize: '15px', color: TS }}>No products yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
            {products.map((product, i) => (
              <motion.div
                key={product.product_id || i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.04, ease }}
                onClick={() => navigate(`/t/${product.product_id}`)}
                style={{ cursor: 'pointer', background: BG2, border: `1px solid ${BS}`, overflow: 'hidden', transition: 'border-color 0.2s, transform 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BS; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ aspectRatio: '1', background: BG3, overflow: 'hidden' }}>
                  <img
                    src={product.mockup_url || product.image_url}
                    alt={product.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ padding: '16px' }}>
                  <h3 style={{ ...display, fontWeight: 600, fontSize: '15px', color: TP, margin: '0 0 4px', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {product.title}
                  </h3>
                  <p style={{ ...display, fontWeight: 700, fontSize: '16px', color: AS, margin: 0 }}>
                    ₹{product.base_price || product.price}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
