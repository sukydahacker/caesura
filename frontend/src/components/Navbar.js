import { getMe, logout } from '@/lib/api';
import { ShoppingCart, LogOut, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const BG  = '#0A0A0B';
const TP  = '#FAFAF9';
const TS  = 'rgba(250,250,249,0.55)';
const TT  = 'rgba(250,250,249,0.25)';
const BS  = 'rgba(250,250,249,0.08)';
const AP  = '#FF3D00';
const AS  = '#C8FF00';

const display = { fontFamily: '"Clash Display", "Bebas Neue", sans-serif' };
const body    = { fontFamily: '"DM Sans", system-ui, sans-serif' };

export default function Navbar({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try { const r = await getMe(); setUser(r.data); }
      catch { /* not logged in */ }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    try { await logout(); setUser(null); toast.success('Logged out'); navigate('/'); }
    catch { toast.error('Logout failed'); }
  };

  const isAdmin = user?.role === 'admin';
  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, label, testId }) => (
    <button
      onClick={() => { navigate(to); setMobileOpen(false); }}
      data-testid={testId}
      style={{
        ...body, fontSize: '13px', fontWeight: 600, letterSpacing: '0.03em',
        padding: '8px 16px', border: 'none', borderRadius: '4px',
        cursor: 'pointer', transition: 'all 0.2s',
        background: isActive(to) ? 'rgba(255,255,255,0.08)' : 'transparent',
        color: isActive(to) ? TP : TS,
      }}
      onMouseEnter={e => { if (!isActive(to)) e.target.style.color = TP; }}
      onMouseLeave={e => { if (!isActive(to)) e.target.style.color = TS; }}
    >
      {label}
    </button>
  );

  const IconBtn = ({ onClick, testId, children }) => (
    <button
      onClick={onClick}
      data-testid={testId}
      style={{
        width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${BS}`, borderRadius: '4px', cursor: 'pointer',
        background: 'transparent', color: TS, transition: 'all 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = TP; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TS; }}
    >
      {children}
    </button>
  );

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? 'rgba(10,10,11,0.85)' : 'rgba(10,10,11,0.6)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${scrolled ? BS : 'transparent'}`,
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <a
            href="/"
            data-testid="navbar-logo"
            style={{
              ...display, fontSize: '22px', fontWeight: 800, color: TP,
              letterSpacing: '0.15em', textDecoration: 'none',
              textTransform: 'uppercase',
            }}
          >
            CAE<span style={{ color: AP }}>|</span>SURA
          </a>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="desktop-nav">
            <NavLink to="/marketplace" label="Shop" testId="navbar-marketplace-link" />

            {user ? (
              <>
                <NavLink to="/dashboard" label="Dashboard" testId="navbar-dashboard-link" />
                {isAdmin && <NavLink to="/admin" label="Admin" testId="navbar-admin-link" />}

                <div style={{ width: '1px', height: '20px', background: BS, margin: '0 8px' }} />

                <IconBtn onClick={() => navigate('/cart')} testId="navbar-cart-btn">
                  <ShoppingCart size={18} />
                </IconBtn>
                <IconBtn onClick={handleLogout} testId="navbar-logout-btn">
                  <LogOut size={18} />
                </IconBtn>
              </>
            ) : onLogin ? (
              <button
                onClick={onLogin}
                data-testid="navbar-login-btn"
                style={{
                  ...body, fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em',
                  padding: '8px 20px', border: 'none', borderRadius: '4px',
                  cursor: 'pointer', background: AP, color: '#fff',
                  transition: 'all 0.2s', marginLeft: '8px',
                }}
                onMouseEnter={e => e.target.style.opacity = '0.85'}
                onMouseLeave={e => e.target.style.opacity = '1'}
              >
                Sign In
              </button>
            ) : null}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="mobile-menu-btn"
            style={{
              display: 'none', width: '40px', height: '40px',
              alignItems: 'center', justifyContent: 'center',
              border: 'none', background: 'transparent', color: TP, cursor: 'pointer',
            }}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="mobile-drawer" style={{
            padding: '8px 32px 24px', display: 'flex', flexDirection: 'column', gap: '4px',
            borderTop: `1px solid ${BS}`,
          }}>
            <NavLink to="/marketplace" label="Shop" testId="navbar-marketplace-link-m" />
            {user && (
              <>
                <NavLink to="/dashboard" label="Dashboard" testId="navbar-dashboard-link-m" />
                {isAdmin && <NavLink to="/admin" label="Admin" testId="navbar-admin-link-m" />}
                <NavLink to="/cart" label="Cart" testId="navbar-cart-link-m" />
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  style={{ ...body, fontSize: '13px', fontWeight: 600, color: AP, padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', borderRadius: '4px' }}
                >
                  Log Out
                </button>
              </>
            )}
            {!user && onLogin && (
              <button onClick={() => { onLogin(); setMobileOpen(false); }} style={{ ...body, fontSize: '13px', fontWeight: 700, padding: '10px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: AP, color: '#fff', marginTop: '8px' }}>
                Sign In
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-drawer { display: none !important; }
        }
      `}</style>
    </>
  );
}
