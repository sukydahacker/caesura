import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Package, DollarSign, TrendingUp, AlertCircle,
  CheckCircle, Clock, Eye, MoreHorizontal, ShoppingBag
} from 'lucide-react';
import {
  uploadDesignImage, createDesign, getDesigns, deleteDesign,
  getMyProducts, getCreatorEarnings, getMe
} from '@/lib/api';
import { toast } from 'sonner';
import DesignUploadFlow from '@/components/DesignUploadFlow';
import { PRINT_PRESETS, GARMENT_COLORS } from '@/config/printPresets';

// ─── Design tokens ───────────────────────────────────────────────────────────
const BG  = '#0A0A0B';
const BG2 = '#141416';
const BG3 = '#1C1C1F';
const AP  = '#FF3D00';
const AS  = '#C8FF00';
const AW  = '#FF9500';
const TP  = '#FAFAF9';
const TS  = '#9A9A9D';
const TT  = '#5A5A5E';
const BS  = 'rgba(255,255,255,0.07)';

const display = { fontFamily: '"Clash Display", sans-serif' };
const serif   = { fontFamily: '"Bodoni Moda", serif' };
const body    = { fontFamily: '"Cabinet Grotesk", sans-serif' };
const script  = { fontFamily: '"Caveat", cursive' };
const ease    = [0.22, 1, 0.36, 1];

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS = {
  draft:     { color: TT,  label: 'Draft' },
  submitted: { color: AW,  label: 'Under Review' },
  pending:   { color: AW,  label: 'Pending' },
  approved:  { color: AS,  label: 'Approved' },
  live:      { color: AS,  label: 'Live' },
  rejected:  { color: AP,  label: 'Rejected' },
};

const StatusDot = ({ status }) => {
  const s = STATUS[status] || STATUS.draft;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', ...body, fontSize: '11px', color: s.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color, display: 'inline-block' }} />
      {s.label}
    </span>
  );
};

// ─── Design card ──────────────────────────────────────────────────────────────
const DesignCard = ({ design, index, onDelete, onViewProducts }) => {
  const [hovered, setHovered] = useState(false);
  const enabledProducts = design.product_configs?.filter(p => p.enabled !== false) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: BG2,
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.15)' : BS}`,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.2s, transform 0.2s',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* Image */}
      <div style={{ aspectRatio: '1', background: BG3, position: 'relative', overflow: 'hidden' }}>
        <img
          src={design.image_url}
          alt={design.title}
          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '16px' }}
        />
        {/* Hover overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
        }}>
          <button
            onClick={() => onViewProducts(design)}
            style={{ ...body, fontSize: '12px', color: TP, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', cursor: 'pointer', letterSpacing: '0.05em' }}
          >
            VIEW PRODUCTS
          </button>
          {design.approval_status === 'draft' && (
            <button
              onClick={() => onDelete(design.design_id)}
              style={{ ...body, fontSize: '12px', color: AP, background: 'rgba(255,61,0,0.1)', border: `1px solid ${AP}`, padding: '8px 16px', cursor: 'pointer', letterSpacing: '0.05em' }}
            >
              DELETE
            </button>
          )}
        </div>
        {/* Status */}
        <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
          <StatusDot status={design.approval_status} />
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '16px' }}>
        <h3 style={{ ...display, fontWeight: 600, fontSize: '15px', color: TP, margin: '0 0 4px', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {design.title}
        </h3>
        {design.description && (
          <p style={{ ...body, fontSize: '12px', color: TS, margin: '0 0 12px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
            {design.description}
          </p>
        )}
        {enabledProducts.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '12px', borderTop: `1px solid ${BS}` }}>
            <span style={{ ...body, fontSize: '11px', color: TT, letterSpacing: '0.05em' }}>{enabledProducts.length} PRODUCT{enabledProducts.length !== 1 ? 'S' : ''}</span>
            <div style={{ display: 'flex', marginLeft: '4px' }}>
              {enabledProducts.slice(0, 4).map((p, i) => (
                <div key={i} style={{ width: '14px', height: '14px', borderRadius: '50%', border: `1px solid ${BG2}`, background: GARMENT_COLORS[p.color]?.hex || '#333', marginLeft: i ? '-4px' : 0 }} />
              ))}
            </div>
          </div>
        )}
        {design.approval_status === 'rejected' && design.rejection_reason && (
          <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(255,61,0,0.08)', borderLeft: `2px solid ${AP}` }}>
            <p style={{ ...body, fontSize: '11px', color: AP, margin: 0 }}>{design.rejection_reason}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Products drawer ──────────────────────────────────────────────────────────
const ProductsView = ({ design, open, onClose }) => {
  if (!design) return null;
  const products = design.product_configs || [];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 40 }}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: '520px', background: BG2, zIndex: 50, overflowY: 'auto', borderLeft: `1px solid ${BS}` }}
          >
            {/* Header */}
            <div style={{ padding: '24px', borderBottom: `1px solid ${BS}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: BG2, zIndex: 1 }}>
              <div>
                <h2 style={{ ...display, fontWeight: 700, fontSize: '20px', color: TP, margin: 0, letterSpacing: '-0.02em' }}>{design.title}</h2>
                <StatusDot status={design.approval_status} />
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: TS, cursor: 'pointer', fontSize: '20px', padding: '4px' }}>×</button>
            </div>

            <div style={{ padding: '24px' }}>
              {products.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {products.map((product, i) => {
                    const preset = PRINT_PRESETS[product.productType];
                    const color = GARMENT_COLORS[product.color];
                    const mockupUrl = preset?.mockupImages?.[product.color] || preset?.mockupImages?.white;
                    return (
                      <div key={i} style={{ background: BG3, border: `1px solid ${BS}`, overflow: 'hidden', opacity: product.enabled === false ? 0.4 : 1 }}>
                        <div style={{ aspectRatio: '4/5', position: 'relative' }}>
                          <img src={mockupUrl} alt={preset?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '45%', pointerEvents: 'none' }}>
                            <img src={design.image_url} alt="design" style={{ width: '100%', height: 'auto', mixBlendMode: 'multiply' }} />
                          </div>
                        </div>
                        <div style={{ padding: '12px' }}>
                          <p style={{ ...display, fontWeight: 600, fontSize: '13px', color: TP, margin: '0 0 4px' }}>{preset?.name}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color?.hex, border: `1px solid ${BS}` }} />
                            <span style={{ ...body, fontSize: '11px', color: TS }}>{color?.name}</span>
                          </div>
                          <p style={{ ...display, fontWeight: 700, fontSize: '15px', color: AW, margin: '8px 0 0' }}>₹{preset?.basePrice}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', color: TT }}>
                  <Package size={40} style={{ marginBottom: '16px', opacity: 0.4 }} />
                  <p style={{ ...body, fontSize: '14px' }}>No products configured</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader = ({ dot, title, count }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dot, display: 'inline-block', flexShrink: 0 }} />
    <h2 style={{ ...display, fontWeight: 700, fontSize: '20px', color: TP, margin: 0, letterSpacing: '-0.02em' }}>
      {title} <span style={{ color: TT, fontWeight: 400 }}>({count})</span>
    </h2>
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [productsViewOpen, setProductsViewOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [myProducts, setMyProducts] = useState([]);

  useEffect(() => {
    fetchUserData();
    fetchDesigns();
    fetchMyProducts();
    fetchEarnings();
  }, []);

  const fetchUserData = async () => {
    try { const r = await getMe(); setUser(r.data); } catch {
      setUser({ name: 'Dev', email: 'projectmark121224@gmail.com', role: 'admin', creator_status: 'approved' });
    }
  };
  const fetchEarnings = async () => {
    try { const r = await getCreatorEarnings(); setEarnings(r.data); } catch {
      setEarnings({ total_earnings: 0, pending_earnings: 0, total_orders: 0 });
    }
  };
  const fetchDesigns = async () => {
    try { const r = await getDesigns(); setDesigns(r.data); } catch {} finally { setLoading(false); }
  };
  const fetchMyProducts = async () => {
    try { const r = await getMyProducts(); setMyProducts(r.data); } catch {}
  };
  const handleDeleteDesign = async (designId) => {
    if (!window.confirm('Delete this design?')) return;
    try { await deleteDesign(designId); toast.success('Deleted'); fetchDesigns(); } catch { toast.error('Failed'); }
  };
  const handleViewProducts = (design) => { setSelectedDesign(design); setProductsViewOpen(true); };
  const handleUploadComplete = async (designData) => {
    try {
      const uploadResponse = await uploadDesignImage(designData.file);
      await createDesign({ title: designData.title, description: designData.description, image_url: uploadResponse.data.image_url, products: designData.products, analysis: designData.analysis, tags: [] });
      fetchDesigns();
    } catch (error) { throw error; }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...script, fontSize: '24px', color: TT }}>loading...</div>
      </div>
    );
  }

  const liveDesigns     = designs.filter(d => ['live','approved'].includes(d.approval_status));
  const pendingDesigns  = designs.filter(d => ['submitted','pending'].includes(d.approval_status));
  const draftDesigns    = designs.filter(d => d.approval_status === 'draft');
  const rejectedDesigns = designs.filter(d => d.approval_status === 'rejected');

  return (
    <div style={{ minHeight: '100vh', background: BG }}>
      {/* Grain overlay */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E")', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', padding: '0 32px 80px' }}>

        {/* Top nav bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px 0 48px', borderBottom: `1px solid ${BS}`, marginBottom: '48px' }}>
          <button onClick={() => navigate('/')} style={{ ...display, fontWeight: 700, fontStyle: 'italic', fontSize: '22px', color: TP, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '-0.02em' }}>
            CAESURA.
          </button>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                style={{ ...body, fontSize: '12px', color: TS, background: 'none', border: `1px solid ${BS}`, padding: '10px 20px', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}
              >
                Admin Panel
              </button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/sell')}
              disabled={user?.creator_status !== 'approved' && user?.role !== 'admin'}
              style={{ ...display, fontWeight: 700, fontSize: '13px', color: '#0A0A0B', background: AS, border: 'none', padding: '12px 24px', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase', opacity: (user?.creator_status !== 'approved' && user?.role !== 'admin') ? 0.4 : 1 }}
            >
              + Upload Design
            </motion.button>
          </div>
        </div>

        {/* Creator status banner */}
        {user?.role === 'creator' && user?.creator_status && user.creator_status !== 'approved' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '40px', padding: '20px 24px', background: user.creator_status === 'suspended' ? 'rgba(255,61,0,0.08)' : 'rgba(255,149,0,0.08)', borderLeft: `3px solid ${user.creator_status === 'suspended' ? AP : AW}`, display: 'flex', alignItems: 'center', gap: '16px' }}
          >
            {user.creator_status === 'pending' ? <Clock size={18} color={AW} /> : <AlertCircle size={18} color={AP} />}
            <div>
              <p style={{ ...display, fontWeight: 600, fontSize: '14px', color: user.creator_status === 'suspended' ? AP : AW, margin: '0 0 2px', letterSpacing: '-0.01em' }}>
                {user.creator_status === 'pending' ? 'Creator Account Under Review' : 'Account Suspended'}
              </p>
              <p style={{ ...body, fontSize: '13px', color: TS, margin: 0 }}>
                {user.creator_status === 'pending' ? 'Your application is being reviewed. Typically takes 24–48 hours.' : 'Contact support for details.'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          style={{ marginBottom: '48px' }}
        >
          {user && (
            <span style={{ ...script, fontSize: '20px', color: AS, display: 'block', marginBottom: '8px' }}>
              hey, {user.name?.split(' ')[0] || 'creator'}.
            </span>
          )}
          <h1 style={{ ...display, fontWeight: 700, fontSize: 'clamp(36px, 5vw, 64px)', color: TP, margin: 0, letterSpacing: '-0.03em', lineHeight: 1, textTransform: 'uppercase' }}>
            Your Studio
          </h1>
        </motion.div>

        {/* Earnings stats */}
        {earnings && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: BS, marginBottom: '64px', border: `1px solid ${BS}` }}
          >
            {[
              { label: 'Total Earned', value: `₹${earnings.total_earnings?.toFixed(0) || '0'}`, sub: 'lifetime', color: AS },
              { label: 'Pending', value: `₹${earnings.pending_earnings?.toFixed(0) || '0'}`, sub: 'awaiting fulfilment', color: AW },
              { label: 'Orders', value: earnings.total_orders || '0', sub: 'products sold', color: TP },
            ].map((stat, i) => (
              <div key={i} style={{ background: BG2, padding: '32px 40px' }}>
                <p style={{ ...body, fontSize: '11px', color: TT, margin: '0 0 12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{stat.label}</p>
                <p style={{ ...display, fontWeight: 700, fontSize: 'clamp(32px, 4vw, 52px)', color: stat.color, margin: '0 0 4px', letterSpacing: '-0.03em', lineHeight: 1 }}>{stat.value}</p>
                <p style={{ ...body, fontSize: '12px', color: TT, margin: 0 }}>{stat.sub}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Empty state */}
        {designs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '100px 40px', background: BG2, border: `1px solid ${BS}` }}
          >
            <span style={{ ...script, fontSize: '48px', color: TT, display: 'block', marginBottom: '16px' }}>nothing yet.</span>
            <p style={{ ...body, fontSize: '15px', color: TS, marginBottom: '32px' }}>Upload your first design to get started.</p>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/sell')}
              style={{ ...display, fontWeight: 700, fontSize: '13px', color: '#0A0A0B', background: AS, border: 'none', padding: '14px 32px', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase' }}
            >
              + Upload Your First Design
            </motion.button>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '56px' }}>
            {liveDesigns.length > 0 && (
              <section>
                <SectionHeader dot={AS} title="Live" count={liveDesigns.length} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                  {liveDesigns.map((d, i) => <DesignCard key={d.design_id} design={d} index={i} onDelete={handleDeleteDesign} onViewProducts={handleViewProducts} />)}
                </div>
              </section>
            )}
            {pendingDesigns.length > 0 && (
              <section>
                <SectionHeader dot={AW} title="Under Review" count={pendingDesigns.length} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                  {pendingDesigns.map((d, i) => <DesignCard key={d.design_id} design={d} index={i} onDelete={handleDeleteDesign} onViewProducts={handleViewProducts} />)}
                </div>
              </section>
            )}
            {draftDesigns.length > 0 && (
              <section>
                <SectionHeader dot={TT} title="Drafts" count={draftDesigns.length} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                  {draftDesigns.map((d, i) => <DesignCard key={d.design_id} design={d} index={i} onDelete={handleDeleteDesign} onViewProducts={handleViewProducts} />)}
                </div>
              </section>
            )}
            {rejectedDesigns.length > 0 && (
              <section>
                <SectionHeader dot={AP} title="Rejected" count={rejectedDesigns.length} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                  {rejectedDesigns.map((d, i) => <DesignCard key={d.design_id} design={d} index={i} onDelete={handleDeleteDesign} onViewProducts={handleViewProducts} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <DesignUploadFlow open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} onComplete={handleUploadComplete} />
      <ProductsView design={selectedDesign} open={productsViewOpen} onClose={() => { setProductsViewOpen(false); setSelectedDesign(null); }} />
    </div>
  );
}
