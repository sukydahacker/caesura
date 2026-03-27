import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, XCircle, Users, FileImage, BarChart3,
  Package, DollarSign, TrendingUp,
  AlertCircle, Loader2, ShoppingBag
} from 'lucide-react';
import {
  getPendingCreators, approveCreator, suspendCreator, rejectCreator,
  getPendingDesigns, approveDesign, rejectDesign,
  getAdminAnalytics, getMe, getAdminOrders, getAdminUsers,
  getLiveProducts, updateProductStatus
} from '@/lib/api';
import { toast } from 'sonner';

// ─── Design tokens (same as Dashboard) ──────────────────────────────────────
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
const body    = { fontFamily: '"Cabinet Grotesk", sans-serif' };
const script  = { fontFamily: '"Caveat", cursive' };
const ease    = [0.22, 1, 0.36, 1];

// ─── Status dot ──────────────────────────────────────────────────────────────
const StatusDot = ({ color, label }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', ...body, fontSize: '11px', color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, display: 'inline-block' }} />
    {label}
  </span>
);

// ─── Section header ──────────────────────────────────────────────────────────
const SectionHeader = ({ dot, title, count }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dot, display: 'inline-block', flexShrink: 0 }} />
    <h2 style={{ ...display, fontWeight: 700, fontSize: '20px', color: TP, margin: 0, letterSpacing: '-0.02em' }}>
      {title} {count !== undefined && <span style={{ color: TT, fontWeight: 400 }}>({count})</span>}
    </h2>
  </div>
);

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('creators');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [pendingCreators, setPendingCreators] = useState([]);
  const [loadingCreators, setLoadingCreators] = useState(false);
  const [pendingDesigns, setPendingDesigns] = useState([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionType, setActionType] = useState('');
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [liveProducts, setLiveProducts] = useState([]);
  const [loadingLiveProducts, setLoadingLiveProducts] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => { checkAdminAccess(); }, []);

  const checkAdminAccess = async () => {
    try {
      const response = await getMe();
      const userData = response.data;
      setUser(userData);
      if (userData.role !== 'admin') { toast.error('Access denied.'); navigate('/dashboard'); return; }
      setLoading(false); loadCreators();
    } catch {
      const devUser = { user_id: 'user_dev_local', name: 'projectmark', email: 'projectmark121224@gmail.com', role: 'admin', creator_status: 'approved' };
      setUser(devUser); setLoading(false);
    }
  };

  const loadCreators = async () => { setLoadingCreators(true); try { const r = await getPendingCreators(); setPendingCreators(r.data); } catch {} finally { setLoadingCreators(false); } };
  const loadDesigns = async () => { setLoadingDesigns(true); try { const r = await getPendingDesigns(); setPendingDesigns(r.data); } catch {} finally { setLoadingDesigns(false); } };
  const loadAnalytics = async () => { setLoadingAnalytics(true); try { const r = await getAdminAnalytics(); setAnalytics(r.data); } catch {} finally { setLoadingAnalytics(false); } };
  const loadOrders = async () => { setLoadingOrders(true); try { const r = await getAdminOrders(); setOrders(r.data); } catch {} finally { setLoadingOrders(false); } };
  const loadLiveProducts = async () => { setLoadingLiveProducts(true); try { const r = await getLiveProducts(); setLiveProducts(r.data); } catch {} finally { setLoadingLiveProducts(false); } };
  const loadUsers = async () => { setLoadingUsers(true); try { const r = await getAdminUsers(); setUsers(r.data); } catch {} finally { setLoadingUsers(false); } };

  const handleProductStatusChange = async (productId, newStatus) => {
    try { await updateProductStatus(productId, newStatus); toast.success('Status updated'); loadLiveProducts(); } catch (e) { toast.error(`Failed: ${e.message}`); }
  };
  const handleApproveCreator = async (userId) => { try { await approveCreator(userId); toast.success('Approved!'); loadCreators(); } catch { toast.error('Failed'); } };
  const handleSuspendCreator = async (userId) => { if (!window.confirm('Suspend this creator?')) return; try { await suspendCreator(userId); toast.success('Suspended'); loadCreators(); } catch { toast.error('Failed'); } };
  const openRejectDialog = (item, type) => { setSelectedDesign(item); setActionType(type); setRejectDialogOpen(true); };
  const handleRejectCreator = async () => { if (!selectedDesign) return; try { await rejectCreator(selectedDesign.user_id, rejectReason); toast.success('Rejected'); setRejectDialogOpen(false); setRejectReason(''); loadCreators(); } catch { toast.error('Failed'); } };
  const openApproveDesignDialog = (design) => { setSelectedDesign(design); setApproveDialogOpen(true); };
  const handleApproveDesign = async () => { if (!selectedDesign) return; try { await approveDesign(selectedDesign.design_id, selectedDesign.product_type || 'UT27', false); toast.success('Approved!'); setApproveDialogOpen(false); loadDesigns(); } catch { toast.error('Failed'); } };
  const handleRejectDesign = async () => { if (!selectedDesign) return; try { await rejectDesign(selectedDesign.design_id, rejectReason); toast.success('Rejected'); setRejectDialogOpen(false); setRejectReason(''); loadDesigns(); } catch { toast.error('Failed'); } };

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === 'creators') loadCreators();
    if (value === 'designs') loadDesigns();
    if (value === 'products') loadLiveProducts();
    if (value === 'orders') loadOrders();
    if (value === 'analytics') loadAnalytics();
    if (value === 'users') loadUsers();
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...script, fontSize: '24px', color: TT }}>loading...</div>
    </div>
  );

  const TABS = [
    { key: 'creators',  icon: Users, label: 'Creators' },
    { key: 'designs',   icon: FileImage, label: 'Designs' },
    { key: 'products',  icon: Package, label: 'Products' },
    { key: 'orders',    icon: ShoppingBag, label: 'Orders' },
    { key: 'analytics', icon: BarChart3, label: 'Analytics' },
    { key: 'users',     icon: Users, label: 'Users' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG }}>
      {/* Grain overlay */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E")', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', padding: '0 32px 80px' }}>

        {/* Top nav bar — same as Dashboard */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px 0 48px', borderBottom: `1px solid ${BS}`, marginBottom: '48px' }}>
          <button onClick={() => navigate('/')} style={{ ...display, fontWeight: 700, fontStyle: 'italic', fontSize: '22px', color: TP, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '-0.02em' }}>
            CAESURA.
          </button>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={() => navigate('/dashboard')} style={{ ...body, fontSize: '12px', color: TS, background: 'none', border: `1px solid ${BS}`, padding: '10px 20px', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Dashboard
            </button>
          </div>
        </div>

        {/* Page heading */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} style={{ marginBottom: '48px' }}>
          <span style={{ ...script, fontSize: '20px', color: AP, display: 'block', marginBottom: '8px' }}>
            command center.
          </span>
          <h1 style={{ ...display, fontWeight: 700, fontSize: 'clamp(36px, 5vw, 64px)', color: TP, margin: 0, letterSpacing: '-0.03em', lineHeight: 1, textTransform: 'uppercase' }}>
            Admin Panel
          </h1>
        </motion.div>

        {/* Tab strip */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease }}
          style={{ display: 'flex', gap: '1px', background: BS, marginBottom: '48px', border: `1px solid ${BS}`, overflowX: 'auto' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => handleTabChange(tab.key)} data-testid={`tab-${tab.key}`}
                style={{
                  ...body, flex: 1, fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '16px 20px', border: 'none', cursor: 'pointer',
                  background: active ? BG3 : BG2, color: active ? TP : TT,
                  borderBottom: active ? `2px solid ${AP}` : '2px solid transparent',
                  transition: 'all 0.2s',
                }}>
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* ═══ CREATORS ═══ */}
        {activeTab === 'creators' && (
          loadingCreators ? <Loading /> : pendingCreators.length === 0 ? (
            <Empty icon={Users} text="no pending creators." sub="All applications have been reviewed" />
          ) : (
            <>
              <SectionHeader dot={AW} title="Pending Creators" count={pendingCreators.length} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {pendingCreators.map((creator, i) => (
                  <motion.div key={creator.user_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.04, ease }}
                    style={{ background: BG2, border: `1px solid ${BS}`, padding: '24px' }} data-testid={`creator-card-${i}`}>
                    <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
                      {creator.picture ? (
                        <img src={creator.picture} alt={creator.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: BG3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={20} color={TT} /></div>
                      )}
                      <div>
                        <h3 style={{ ...display, fontWeight: 600, fontSize: '15px', color: TP, margin: '0 0 2px' }} data-testid={`creator-name-${i}`}>{creator.name}</h3>
                        <p style={{ ...body, fontSize: '13px', color: TS, margin: 0 }}>{creator.email}</p>
                        <p style={{ ...body, fontSize: '11px', color: TT, margin: '4px 0 0', letterSpacing: '0.05em' }}>Joined {new Date(creator.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleApproveCreator(creator.user_id)} data-testid={`approve-creator-btn-${i}`}
                        style={{ ...display, flex: 1, fontWeight: 700, fontSize: '12px', color: BG, background: AS, border: 'none', padding: '10px', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <CheckCircle size={14} /> APPROVE
                      </button>
                      <button onClick={() => openRejectDialog(creator, 'creator')} data-testid={`reject-creator-btn-${i}`}
                        style={{ ...body, fontSize: '12px', color: AP, background: 'rgba(255,61,0,0.1)', border: `1px solid ${AP}`, padding: '10px 16px', cursor: 'pointer' }}>
                        <XCircle size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )
        )}

        {/* ═══ DESIGNS ═══ */}
        {activeTab === 'designs' && (
          loadingDesigns ? <Loading /> : pendingDesigns.length === 0 ? (
            <Empty icon={FileImage} text="no pending designs." sub="All designs have been reviewed" />
          ) : (
            <>
              <SectionHeader dot={AW} title="Pending Designs" count={pendingDesigns.length} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {pendingDesigns.map((design, i) => (
                  <motion.div key={design.design_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.04, ease }}
                    style={{ background: BG2, border: `1px solid ${BS}`, overflow: 'hidden' }} data-testid={`design-card-${i}`}>
                    <div style={{ aspectRatio: '1', background: BG3, position: 'relative' }}>
                      {design.mockup_image_url ? (
                        <img src={design.mockup_image_url} alt={design.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <>
                          <img src="/mockups/tshirt-whitefront.jpg" alt="t-shirt" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          <img src={design.image_url} alt={design.title} style={{ position: 'absolute', top: '28%', left: '28%', width: '44%', height: '32%', objectFit: 'contain', pointerEvents: 'none' }} />
                        </>
                      )}
                      <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                        <StatusDot color={AW} label="PENDING" />
                      </div>
                      {design.product_type && (
                        <span style={{ ...body, position: 'absolute', top: '12px', right: '12px', fontSize: '10px', background: 'rgba(0,0,0,0.7)', color: AS, padding: '4px 8px', letterSpacing: '0.08em' }}>
                          {design.product_type}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: '16px' }}>
                      <h3 style={{ ...display, fontWeight: 600, fontSize: '15px', color: TP, margin: '0 0 4px', letterSpacing: '-0.01em' }} data-testid={`design-title-${i}`}>{design.title}</h3>
                      {design.description && <p style={{ ...body, fontSize: '12px', color: TS, margin: '0 0 8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{design.description}</p>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ ...display, fontWeight: 700, fontSize: '15px', color: AW }}>{design.price ? `₹${design.price}` : '—'}</span>
                        <span style={{ ...body, fontSize: '11px', color: TT }}>by {design.creator_name || 'Unknown'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openApproveDesignDialog(design)} data-testid={`approve-design-btn-${i}`}
                          style={{ ...display, flex: 1, fontWeight: 700, fontSize: '12px', color: BG, background: AS, border: 'none', padding: '10px', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <CheckCircle size={14} /> APPROVE
                        </button>
                        <button onClick={() => openRejectDialog(design, 'design')} data-testid={`reject-design-btn-${i}`}
                          style={{ ...body, fontSize: '12px', color: AP, background: 'rgba(255,61,0,0.1)', border: `1px solid ${AP}`, padding: '10px 16px', cursor: 'pointer' }}>
                          <XCircle size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )
        )}

        {/* ═══ PRODUCTS ═══ */}
        {activeTab === 'products' && (
          loadingLiveProducts ? <Loading /> : liveProducts.length === 0 ? (
            <Empty icon={Package} text="no live products." sub="Products appear here once designs are approved" />
          ) : (
            <>
              <SectionHeader dot={AS} title="Live Products" count={liveProducts.length} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {liveProducts.map((product, i) => (
                  <motion.div key={product.product_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.04, ease }}
                    style={{ background: BG2, border: `1px solid ${BS}`, overflow: 'hidden' }} data-testid={`live-product-card-${i}`}>
                    <div style={{ aspectRatio: '1', background: BG3, position: 'relative' }}>
                      <img src={product.mockup_image || product.design_image} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                        <StatusDot
                          color={product.product_status === 'live' ? AS : product.product_status === 'out_of_stock' ? AW : AP}
                          label={product.product_status === 'live' ? 'LIVE' : product.product_status === 'out_of_stock' ? 'OUT OF STOCK' : 'DISABLED'}
                        />
                      </div>
                    </div>
                    <div style={{ padding: '16px' }}>
                      <h3 style={{ ...display, fontWeight: 600, fontSize: '15px', color: TP, margin: '0 0 4px' }} data-testid={`product-title-${i}`}>{product.title}</h3>
                      <p style={{ ...body, fontSize: '11px', color: TT, margin: '0 0 8px' }}>by {product.creator_name || 'Unknown'}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ ...display, fontWeight: 700, fontSize: '18px', color: TP }}>{`₹${product.price?.toFixed(0) || '999'}`}</span>
                        <span style={{ ...body, fontSize: '11px', color: TT, letterSpacing: '0.05em' }}>{product.units_sold || 0} SOLD</span>
                      </div>
                      <div style={{ borderTop: `1px solid ${BS}`, paddingTop: '12px' }}>
                        <p style={{ ...body, fontSize: '11px', color: TT, margin: '0 0 8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Change Status</p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {product.product_status !== 'live' && (
                            <button onClick={() => handleProductStatusChange(product.product_id, 'live')} data-testid={`enable-product-btn-${i}`}
                              style={{ ...body, fontSize: '11px', fontWeight: 600, color: BG, background: AS, border: 'none', padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.05em' }}>ENABLE</button>
                          )}
                          {product.product_status !== 'out_of_stock' && (
                            <button onClick={() => handleProductStatusChange(product.product_id, 'out_of_stock')} data-testid={`out-of-stock-btn-${i}`}
                              style={{ ...body, fontSize: '11px', fontWeight: 600, color: TS, background: 'none', border: `1px solid ${BS}`, padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.05em' }}>OOS</button>
                          )}
                          {product.product_status !== 'disabled' && (
                            <button onClick={() => handleProductStatusChange(product.product_id, 'disabled')} data-testid={`disable-product-btn-${i}`}
                              style={{ ...body, fontSize: '11px', fontWeight: 600, color: AP, background: 'rgba(255,61,0,0.1)', border: `1px solid ${AP}`, padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.05em' }}>DISABLE</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )
        )}

        {/* ═══ ORDERS ═══ */}
        {activeTab === 'orders' && (
          loadingOrders ? <Loading /> : orders.length === 0 ? (
            <Empty icon={ShoppingBag} text="no orders yet." sub="Orders appear here once customers start purchasing" />
          ) : (
            <>
              <SectionHeader dot={TP} title="All Orders" count={orders.length} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: BS, border: `1px solid ${BS}` }}>
                {orders.map((order, i) => (
                  <motion.div key={order.order_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: i * 0.03 }}
                    style={{ background: BG2, padding: '24px' }} data-testid={`order-card-${i}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ ...display, fontWeight: 600, fontSize: '16px', color: TP, margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                          #{order.order_id.slice(-8).toUpperCase()}
                        </h3>
                        <p style={{ ...body, fontSize: '11px', color: TT }}>{new Date(order.created_at).toLocaleString()}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <StatusDot
                          color={order.status === 'paid' || order.status === 'delivered' ? AS : order.status === 'pending' ? AW : order.status === 'shipped' ? '#5B8DEF' : AP}
                          label={order.status.toUpperCase()}
                        />
                        <p style={{ ...display, fontWeight: 700, fontSize: 'clamp(20px, 3vw, 28px)', color: TP, margin: '8px 0 0', letterSpacing: '-0.02em' }}>₹{order.total_amount.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                      {order.items.map((item, j) => (
                        <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: BG3 }}>
                          <div>
                            <p style={{ ...body, fontSize: '13px', color: TP, margin: 0, fontWeight: 600 }}>{item.title}</p>
                            {item.creator_name && <p style={{ ...body, fontSize: '11px', color: TT, margin: '2px 0 0' }}>by {item.creator_name}</p>}
                            <p style={{ ...body, fontSize: '11px', color: TT, margin: '2px 0 0' }}>Size: {item.size} × {item.quantity}</p>
                          </div>
                          <span style={{ ...display, fontSize: '14px', color: TP, fontWeight: 600 }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Revenue splits */}
                    {order.revenue_splits?.length > 0 && (
                      <div style={{ borderTop: `1px solid ${BS}`, paddingTop: '16px', marginBottom: '16px', display: 'flex', gap: '32px' }}>
                        {order.revenue_splits.map((split, si) => (
                          <div key={si} style={{ display: 'flex', gap: '32px' }}>
                            <div>
                              <p style={{ ...body, fontSize: '11px', color: TT, margin: '0 0 2px', letterSpacing: '0.05em' }}>CREATOR 80%</p>
                              <p style={{ ...display, fontSize: '16px', color: AS, margin: 0, fontWeight: 700 }}>₹{split.creator_amount.toFixed(2)}</p>
                            </div>
                            <div>
                              <p style={{ ...body, fontSize: '11px', color: TT, margin: '0 0 2px', letterSpacing: '0.05em' }}>PLATFORM 20%</p>
                              <p style={{ ...display, fontSize: '16px', color: AP, margin: 0, fontWeight: 700 }}>₹{split.platform_amount.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Shipping */}
                    <div style={{ borderTop: `1px solid ${BS}`, paddingTop: '12px' }}>
                      <p style={{ ...body, fontSize: '11px', color: TT, margin: '0 0 6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Ship To</p>
                      <p style={{ ...body, fontSize: '13px', color: TS, margin: 0, lineHeight: 1.6 }}>
                        {order.shipping_address.name}, {order.shipping_address.address}, {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode} — {order.shipping_address.phone}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )
        )}

        {/* ═══ ANALYTICS ═══ */}
        {activeTab === 'analytics' && (
          loadingAnalytics ? <Loading /> : analytics ? (
            <>
              <SectionHeader dot={AP} title="Platform Analytics" />

              {/* Stat strip — same as Dashboard earnings */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: BS, marginBottom: '32px', border: `1px solid ${BS}` }}>
                {[
                  { label: 'Users', value: analytics.users.total, sub: `${analytics.users.creators} creators`, color: TP },
                  { label: 'Designs', value: analytics.designs.total, sub: `${analytics.designs.pending} pending`, color: AW },
                  { label: 'Products', value: analytics.products.total, sub: 'marketplace', color: AS },
                  { label: 'Orders', value: analytics.orders.total, sub: `${analytics.orders.total_units} units`, color: AP },
                ].map((stat, i) => (
                  <div key={i} style={{ background: BG2, padding: '32px 28px' }}>
                    <p style={{ ...body, fontSize: '11px', color: TT, margin: '0 0 12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{stat.label}</p>
                    <p style={{ ...display, fontWeight: 700, fontSize: 'clamp(28px, 3.5vw, 44px)', color: stat.color, margin: '0 0 4px', letterSpacing: '-0.03em', lineHeight: 1 }}>{stat.value}</p>
                    <p style={{ ...body, fontSize: '12px', color: TT, margin: 0 }}>{stat.sub}</p>
                  </div>
                ))}
              </motion.div>

              {/* Revenue card */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease }}
                style={{ background: BG2, border: `1px solid ${AP}`, padding: '32px 40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <DollarSign size={32} color={AP} />
                  <div>
                    <p style={{ ...body, fontSize: '11px', color: TT, margin: '0 0 4px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Gross Revenue</p>
                    <p style={{ ...display, fontWeight: 700, fontSize: 'clamp(32px, 4vw, 52px)', color: TP, margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>₹{analytics.revenue.total_revenue.toFixed(2)}</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: BS, border: `1px solid ${BS}` }}>
                  <div style={{ background: BG2, padding: '24px 28px' }}>
                    <p style={{ ...body, fontSize: '11px', color: TT, margin: '0 0 8px', letterSpacing: '0.1em' }}>PLATFORM (20%)</p>
                    <p style={{ ...display, fontWeight: 700, fontSize: '28px', color: AS, margin: 0 }}>₹{analytics.revenue.platform_earnings.toFixed(2)}</p>
                  </div>
                  <div style={{ background: BG2, padding: '24px 28px' }}>
                    <p style={{ ...body, fontSize: '11px', color: TT, margin: '0 0 8px', letterSpacing: '0.1em' }}>CREATOR (80%)</p>
                    <p style={{ ...display, fontWeight: 700, fontSize: '28px', color: TP, margin: 0 }}>₹{analytics.revenue.creator_earnings.toFixed(2)}</p>
                  </div>
                </div>
              </motion.div>
            </>
          ) : (
            <Empty icon={AlertCircle} text="analytics unavailable." sub="Failed to load data" />
          )
        )}

        {/* ═══ USERS ═══ */}
        {activeTab === 'users' && (
          loadingUsers ? <Loading /> : (
            <>
              <SectionHeader dot={TP} title="All Users" count={users.length} />
              <div style={{ border: `1px solid ${BS}`, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BS}` }}>
                      {['Name', 'Email', 'Role', 'Creator Status', 'Joined'].map(h => (
                        <th key={h} style={{ ...body, fontSize: '11px', color: TT, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'left', padding: '14px 20px', fontWeight: 600, background: BG2 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u.user_id} style={{ borderBottom: `1px solid ${BS}`, background: i % 2 === 0 ? BG : BG2 }}>
                        <td style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {u.picture && <img src={u.picture} alt={u.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />}
                          <span style={{ ...display, fontSize: '14px', color: TP, fontWeight: 600 }}>{u.name || u.email}</span>
                        </td>
                        <td style={{ ...body, fontSize: '13px', color: TS, padding: '12px 20px' }}>{u.email}</td>
                        <td style={{ padding: '12px 20px' }}>
                          <StatusDot
                            color={u.role === 'admin' ? AP : u.role === 'creator' ? AS : TT}
                            label={u.role}
                          />
                        </td>
                        <td style={{ padding: '12px 20px' }}>
                          {u.creator_status ? (
                            <StatusDot
                              color={u.creator_status === 'approved' ? AS : u.creator_status === 'pending' ? AW : AP}
                              label={u.creator_status}
                            />
                          ) : <span style={{ ...body, color: TT, fontSize: '13px' }}>—</span>}
                        </td>
                        <td style={{ ...body, fontSize: '12px', color: TT, padding: '12px 20px' }}>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', ...body, color: TT }}>No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )
        )}
      </div>

      {/* ═══ APPROVE DIALOG ═══ */}
      <AnimatePresence>
        {approveDialogOpen && selectedDesign && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setApproveDialogOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 40 }} />
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', maxWidth: '440px', background: BG2, border: `1px solid ${BS}`, zIndex: 50, padding: '28px' }}>
              <h2 style={{ ...display, fontWeight: 700, fontSize: '20px', color: TP, margin: '0 0 4px', letterSpacing: '-0.02em' }}>Approve Design</h2>
              <p style={{ ...body, fontSize: '13px', color: TS, margin: '0 0 20px' }}>Qikink will print and ship automatically.</p>

              <div style={{ aspectRatio: '1', background: BG3, position: 'relative', marginBottom: '16px' }}>
                {selectedDesign.mockup_image_url ? (
                  <img src={selectedDesign.mockup_image_url} alt="mockup" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <>
                    <img src="/mockups/tshirt-whitefront.jpg" alt="t-shirt" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    <img src={selectedDesign.image_url} alt={selectedDesign.title} style={{ position: 'absolute', top: '26%', left: '30%', width: '40%', height: '30%', objectFit: 'contain', pointerEvents: 'none' }} />
                  </>
                )}
              </div>

              <p style={{ ...display, fontWeight: 600, fontSize: '15px', color: TP, margin: '0 0 2px' }}>{selectedDesign.title}</p>
              <p style={{ ...body, fontSize: '12px', color: TT, margin: '0 0 4px' }}>by {selectedDesign.creator_name || 'Unknown'}</p>
              <p style={{ ...display, fontWeight: 700, fontSize: '16px', color: AW, margin: '0 0 16px' }}>₹{selectedDesign.price || '999'}</p>

              {selectedDesign.product_type && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ ...body, fontSize: '12px', color: TT }}>Product:</span>
                  <span style={{ ...body, fontSize: '11px', background: BG3, color: AS, padding: '4px 8px', letterSpacing: '0.08em' }}>{selectedDesign.product_type}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleApproveDesign} data-testid="confirm-approve-design-btn"
                  style={{ ...display, flex: 1, fontWeight: 700, fontSize: '12px', color: BG, background: AS, border: 'none', padding: '12px', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <CheckCircle size={14} /> APPROVE & GO LIVE
                </button>
                <button onClick={() => setApproveDialogOpen(false)}
                  style={{ ...body, fontSize: '12px', color: TS, background: 'none', border: `1px solid ${BS}`, padding: '12px 20px', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  CANCEL
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ REJECT DIALOG ═══ */}
      <AnimatePresence>
        {rejectDialogOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setRejectDialogOpen(false); setRejectReason(''); }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 40 }} />
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', maxWidth: '440px', background: BG2, border: `1px solid ${BS}`, zIndex: 50, padding: '28px' }}>
              <h2 style={{ ...display, fontWeight: 700, fontSize: '20px', color: TP, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                Reject {actionType === 'creator' ? 'Creator' : 'Design'}
              </h2>
              <p style={{ ...body, fontSize: '13px', color: TS, margin: '0 0 20px' }}>Provide a reason for rejection.</p>

              <p style={{ ...body, fontSize: '11px', color: TT, margin: '0 0 6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Reason</p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Enter reason..."
                rows={4}
                style={{
                  ...body, width: '100%', padding: '12px', fontSize: '14px',
                  background: BG, border: `1px solid ${BS}`, color: TP,
                  resize: 'vertical', boxSizing: 'border-box', marginBottom: '16px', outline: 'none',
                }}
              />

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={actionType === 'creator' ? handleRejectCreator : handleRejectDesign} data-testid="confirm-reject-btn"
                  style={{ ...display, flex: 1, fontWeight: 700, fontSize: '12px', color: '#fff', background: AP, border: 'none', padding: '12px', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <XCircle size={14} /> CONFIRM REJECTION
                </button>
                <button onClick={() => { setRejectDialogOpen(false); setRejectReason(''); }}
                  style={{ ...body, fontSize: '12px', color: TS, background: 'none', border: `1px solid ${BS}`, padding: '12px 20px', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  CANCEL
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Shared sub-components ───────────────────────────────────────────────────
function Loading() {
  return (
    <div style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: '"Caveat", cursive', fontSize: '24px', color: '#5A5A5E' }}>loading...</div>
    </div>
  );
}

function Empty({ icon: Icon, text, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '100px 40px', background: '#141416', border: '1px solid rgba(255,255,255,0.07)' }}>
      <Icon size={40} style={{ marginBottom: '16px', opacity: 0.3, color: '#5A5A5E' }} />
      <span style={{ fontFamily: '"Caveat", cursive', fontSize: '28px', color: '#5A5A5E', display: 'block', marginBottom: '8px' }}>{text}</span>
      <p style={{ fontFamily: '"Cabinet Grotesk", sans-serif', fontSize: '14px', color: '#9A9A9D' }}>{sub}</p>
    </div>
  );
}
