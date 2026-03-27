import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, Twitter, Instagram, Youtube, Upload, ChevronLeft, ChevronRight, ArrowRight, Package, Wallet } from 'lucide-react';
import { getProducts } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import SkeletonCard from '@/components/SkeletonCard';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const BG   = '#0A0A0B';
const BG2  = '#141416';
const BG3  = '#1C1C1F';
const SURF = '#FAFAF9';
const AP   = '#FF3D00'; // accent-primary (vermillion)
const AS   = '#C8FF00'; // accent-secondary (acid lime)
const AW   = '#FF9500'; // accent-warm (amber)
const TP   = '#FAFAF9'; // text-primary
const TS   = '#9A9A9D'; // text-secondary
const TT   = '#5A5A5E'; // text-tertiary
const BS   = 'rgba(255,255,255,0.08)'; // border-subtle

const display = { fontFamily: '"Clash Display", sans-serif' };
const serif   = { fontFamily: '"Bodoni Moda", serif' };
const body    = { fontFamily: '"Cabinet Grotesk", sans-serif' };
const script  = { fontFamily: '"Caveat", cursive' };

const AUTH_URL = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api/auth/google`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const easeOut = [0.22, 1, 0.36, 1];

const FV = ({ children, delay = 0, x = 0, y = 30, style = {}, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, x, y }}
    whileInView={{ opacity: 1, x: 0, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.65, delay, ease: easeOut }}
    style={style}
    className={className}
  >
    {children}
  </motion.div>
);

// ─── Site Header ──────────────────────────────────────────────────────────────
function SiteHeader({ onLoginClick }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <>
      {/* Left side drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMenuOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 199,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
              }}
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.35, ease: easeOut }}
              style={{
                position: 'fixed', top: 0, left: 0, bottom: 0,
                width: '340px', zIndex: 200,
                background: BG2,
                borderRight: `1px solid ${BS}`,
                display: 'flex', flexDirection: 'column',
                padding: '0',
                overflow: 'hidden',
              }}
            >
              {/* Drawer header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '24px 28px',
                borderBottom: `1px solid ${BS}`,
              }}>
                <span style={{ ...display, fontSize: '16px', fontWeight: 700, color: TP, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Caesura
                </span>
                <button
                  onClick={() => setMenuOpen(false)}
                  style={{
                    ...body, fontSize: '12px', color: TS,
                    background: 'none', border: `1px solid ${BS}`,
                    borderRadius: '999px', padding: '6px 14px',
                    cursor: 'pointer', letterSpacing: '0.05em',
                  }}
                >
                  Close ✕
                </button>
              </div>

              {/* Nav links */}
              <nav style={{ flex: 1, padding: '40px 28px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  ['Home',          '/'],
                  ['Shop',          '/explore'],
                  ['Sell Your Art', '/sell'],
                  ['FAQ',           '/faq'],
                  ['Contact Us',    'mailto:hello@caesura.in'],
                ].map(([label, path], i) => (
                  <motion.a
                    key={label}
                    href={path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.06, ease: easeOut }}
                    onClick={e => { e.preventDefault(); if (path.startsWith('mailto:')) { window.location.href = path; } else { navigate(path); } setMenuOpen(false); }}
                    style={{
                      ...display, fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 700,
                      color: TP, textDecoration: 'none',
                      lineHeight: 1, letterSpacing: '-0.02em',
                      textTransform: 'uppercase',
                      padding: '12px 0',
                      borderBottom: `1px solid ${BS}`,
                      display: 'block',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#FFD600')}
                    onMouseLeave={e => (e.currentTarget.style.color = TP)}
                  >
                    {label}
                  </motion.a>
                ))}
              </nav>

              {/* Drawer footer */}
              <div style={{ padding: '24px 28px', borderTop: `1px solid ${BS}` }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  {[Twitter, Instagram, Youtube].map((Icon, i) => (
                    <button key={i} style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      border: `1px solid ${BS}`, background: 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}>
                      <Icon size={14} color={TS} />
                    </button>
                  ))}
                </div>
                <p style={{ ...body, fontSize: '11px', color: TT, margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  © 2025 Caesura. India.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '88px',
        background: scrolled ? `${BG}ee` : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? `1px solid ${BS}` : '1px solid transparent',
        transition: 'background 0.3s, border-color 0.3s',
      }}>
        <div style={{
          maxWidth: '1400px', margin: '0 auto', padding: '0 32px',
          height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative',
        }}>
          {/* Left: Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            style={{ ...body, fontSize: '16px', fontWeight: 500, color: TP, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
            data-testid="header-menu-btn"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ width: '20px', height: '1.5px', background: TP }} />
              <div style={{ width: '14px', height: '1.5px', background: TP }} />
            </div>
            Menu
          </button>

          {/* Center: Social icons — absolutely centered so they align above shipping text */}
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px' }}>
            {[Twitter, Instagram, Youtube].map((Icon, i) => (
              <button
                key={i}
                style={{
                  width: '42px', height: '42px', borderRadius: '50%',
                  border: `1px solid rgba(250,250,249,0.2)`,
                  background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(250,250,249,0.6)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(250,250,249,0.2)')}
              >
                <Icon size={17} color={TP} />
              </button>
            ))}
          </div>

          {/* Right: Login + icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => onLoginClick ? onLoginClick() : navigate('/join')}
              style={{
                ...body, fontSize: '16px', fontWeight: 600, color: BG,
                background: TP, border: 'none',
                borderRadius: '999px', padding: '10px 24px', cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              data-testid="header-login-btn"
            >
              Sign up / Login
            </button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} data-testid="header-heart-btn">
              <Heart size={22} color={TP} />
            </button>
            <button onClick={() => navigate('/cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} data-testid="header-cart-btn">
              <ShoppingBag size={22} color={TP} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
const GROUP_IMAGE = '/nubelson-fernandes-iE71-TMrrkE-unsplash.jpg';

function HeroSection() {
  const navigate = useNavigate();

  const wordmarkStyle = {
    fontFamily: '"Clash Display", sans-serif',
    fontWeight: 700,
    fontStyle: 'italic',
    fontSize: 'clamp(80px, 14.8vw, 260px)',
    color: '#FFD600',
    letterSpacing: '0em',
    lineHeight: 0.88,
    textTransform: 'uppercase',
    margin: 0,
    userSelect: 'none',
    width: '100%',
    textAlign: 'center',
    display: 'block',
  };

  return (
    <section style={{
      background: BG,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* Black bar behind header (menu + social icons) */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '88px',
        background: BG,
        zIndex: 99,
      }} />

      {/* Giant "CAESURA" — full width, centered, stamped over image */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: easeOut, delay: 0 }}
        style={{
          position: 'absolute',
          top: '42%',
          left: '0',
          transform: 'translateY(-50%)',
          width: '100vw',
          zIndex: 6,
          overflow: 'visible',
        }}
      >
        <h1 style={{ ...wordmarkStyle, position: 'relative' }}>
          CAESURA.
          <sup style={{
            fontFamily: '"DM Sans", sans-serif',
            fontStyle: 'normal',
            fontWeight: 400,
            fontSize: '0.18em',
            color: '#FFD600',
            verticalAlign: 'super',
            letterSpacing: 0,
            marginLeft: '0.1em',
            opacity: 0.85,
          }}>™</sup>
        </h1>
      </motion.div>

      {/* Hero photo — full screen */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.0, ease: easeOut, delay: 0.1 }}
        style={{ position: 'absolute', inset: 0, zIndex: 2, overflow: 'hidden' }}
      >
        <img
          src={GROUP_IMAGE}
          alt="Caesura crew"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 20%',
            filter: 'contrast(1.18) saturate(1.3) brightness(1.05)',
          }}
        />
        {/* Teal color grade overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(0,190,170,0.18) 0%, rgba(0,140,160,0.10) 60%, rgba(20,20,30,0.15) 100%)',
          mixBlendMode: 'color',
        }} />
        {/* Dark overlay so text is readable */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
      </motion.div>

      {/* Element 7: Bottom caption */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: easeOut, delay: 0.6 }}
        style={{
          position: 'absolute',
          bottom: '48px',
          left: '5%',
          zIndex: 5,
          display: 'flex',
          gap: '24px',
          alignItems: 'baseline',
        }}
      >
        {/* CREATOR-LED with decorative serif initial C */}
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ ...serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(22px, 3vw, 38px)', color: TP, lineHeight: 1 }}>C</span>
          <span style={{ ...display, fontWeight: 700, fontSize: 'clamp(14px, 1.8vw, 22px)', color: TP, letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1 }}>REATOR-LED</span>
        </div>
        <span style={{ ...body, fontSize: '12px', color: TT }}>/</span>
        <span style={{ ...display, fontWeight: 700, fontSize: 'clamp(14px, 1.8vw, 22px)', color: TP, letterSpacing: '0.1em', textTransform: 'uppercase' }}>T-SHIRT</span>
        <span style={{ ...body, fontSize: '12px', color: TT }}>/</span>
        <span style={{ ...display, fontWeight: 700, fontSize: 'clamp(14px, 1.8vw, 22px)', color: TP, letterSpacing: '0.1em', textTransform: 'uppercase' }}>For Creators</span>
      </motion.div>

      {/* Tagline — bottom right */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{
          position: 'absolute',
          bottom: '56px',
          right: '5%',
          zIndex: 5,
          ...body, fontSize: '11px', color: TS,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          margin: 0,
        }}
      >
        WEAR ART, NOT LABELS. //
      </motion.p>

    </section>
  );
}

// ─── Who Are We ───────────────────────────────────────────────────────────────
function WhoAreWe() {
  return (
    <section style={{ background: BG, padding: '120px 0', overflow: 'hidden' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>

          {/* Left: Image */}
          <FV x={-40} delay={0}>
            <div style={{ position: 'relative' }}>
              <img
                src="/logan-weaver-lgnwvr-1bYp7FWHiTo-unsplash.jpg"
                alt="Caesura community"
                style={{
                  width: '100%', height: '580px',
                  objectFit: 'cover', objectPosition: 'center 25%',
                  filter: 'contrast(1.1) saturate(1.15)',
                }}
              />
              {/* Teal overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, rgba(0,190,170,0.12) 0%, transparent 70%)',
                mixBlendMode: 'color',
                pointerEvents: 'none',
              }} />
              {/* Small label */}
              <div style={{
                position: 'absolute', bottom: '24px', left: '24px',
                ...body, fontSize: '11px', color: TP,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                background: 'rgba(10,10,11,0.7)', padding: '6px 14px',
                backdropFilter: 'blur(8px)',
              }}>
                New Delhi, India
              </div>
            </div>
          </FV>

          {/* Right: Text */}
          <FV x={40} delay={0.15}>
            <div>
              <span style={{ ...script, fontSize: '42px', color: AS, display: 'block', marginBottom: '16px' }}>
                who are we?
              </span>
              <h2 style={{
                ...display, fontWeight: 700,
                fontSize: 'clamp(36px, 5vw, 64px)',
                color: TP, margin: '0 0 32px',
                lineHeight: 1, letterSpacing: '-0.02em',
                textTransform: 'uppercase',
              }}>
                Your Art.
                <br />
                <span style={{ ...serif, fontStyle: 'italic', fontWeight: 400, textTransform: 'none' }}>
                  On a Tee.
                </span>
              </h2>
              <p style={{
                ...body, fontSize: '24px', lineHeight: 1.65,
                color: TS, margin: '0 0 24px', maxWidth: '520px',
              }}>
                Caesura is a platform for content creators in any niche — put your brand on premium t-shirts and sell directly to your fans across India.
              </p>
              <p style={{
                ...body, fontSize: '24px', lineHeight: 1.65,
                color: TS, margin: '0 0 48px', maxWidth: '520px',
              }}>
                You just upload the design. We handle printing, packaging, and delivery. That's it.
              </p>
            </div>
          </FV>

        </div>
      </div>
    </section>
  );
}

// ─── Upload Showcase ──────────────────────────────────────────────────────────
const COLORS = [
  { hex: '#A78BFA', name: 'Purple' },
  { hex: '#D4A574', name: 'Sand', selected: true },
  { hex: '#2DD4BF', name: 'Teal' },
  { hex: '#4B4B4B', name: '+9', isMore: true },
];
function UploadShowcase() {
  const navigate = useNavigate();
  const [selectedColor, setSelectedColor] = useState(1);

  return (
    <section style={{ background: BG, borderTop: `1px solid ${BS}`, padding: '96px 0' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px' }}>

        {/* Section header */}
        <div style={{ marginBottom: '64px' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{ ...script, fontSize: '28px', color: 'rgba(250,250,249,0.4)', transform: 'rotate(-3deg)', display: 'inline-block', marginBottom: '8px' }}>
              create
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{
              ...body, fontSize: '18px', fontWeight: 500, color: TP,
              background: 'rgba(250,250,249,0.06)', backdropFilter: 'blur(12px)',
              border: `1px solid ${BS}`, borderRadius: '999px', padding: '8px 20px',
            }}>
              Upload
            </div>
            <h2 style={{
              ...serif, fontStyle: 'italic', fontWeight: 400,
              fontSize: 'clamp(44px, 7vw, 80px)',
              color: TP, margin: 0, letterSpacing: '-0.02em', lineHeight: 0.95,
            }}>
              Your Design
            </h2>
          </div>
        </div>

        {/* 3-col layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '32px', alignItems: 'center', position: 'relative' }}>

          {/* Left: Color swatches */}
          <FV x={-20} delay={0.1}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              {COLORS.map((c, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedColor(i)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: c.hex,
                    border: selectedColor === i ? `2px solid ${TP}` : '2px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.2s',
                    transform: selectedColor === i ? 'scale(1.1)' : 'scale(1)',
                  }}>
                    {c.isMore && <span style={{ ...body, fontSize: '10px', color: TP }}>+9</span>}
                  </div>
                  {selectedColor === i && !c.isMore && (
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      style={{
                        ...body, fontSize: '12px', color: TP,
                        background: BG3, border: `1px solid ${BS}`,
                        borderRadius: '999px', padding: '4px 12px', whiteSpace: 'nowrap',
                      }}
                    >
                      {c.name}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </FV>

          {/* Center: T-shirt */}
          <FV delay={0.05} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src="https://images.pexels.com/photos/9558752/pexels-photo-9558752.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=600&w=500"
                alt="Plain white t-shirt"
                style={{
                  width: '100%', maxWidth: '460px',
                  objectFit: 'contain',
                  animation: 'float 3s ease-in-out infinite',
                  filter: 'drop-shadow(0 32px 40px rgba(0,0,0,0.5))',
                }}
              />
              {/* Bottom info */}
              <div style={{ marginTop: '24px' }}>
                <p style={{ ...display, fontSize: '22px', color: TP, margin: '0 0 4px' }}>Your Art Here</p>
                <p style={{ ...body, fontSize: '13px', color: TS, margin: 0 }}>Premium 220gsm cotton canvas</p>
              </div>
            </div>

            {/* Bottom CTA bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
              style={{ display: 'flex', width: '100%', maxWidth: '500px', marginTop: '32px', border: `1px solid ${BS}`, borderRadius: '999px', overflow: 'hidden' }}
            >
              <button
                onClick={() => navigate('/sell')}
                style={{
                  flex: '0 0 70%', ...body, fontSize: '15px', fontWeight: 500,
                  background: SURF, color: BG, border: 'none', padding: '16px 24px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = AS)}
                onMouseLeave={e => (e.currentTarget.style.background = SURF)}
                data-testid="upload-design-btn"
              >
                <Upload size={16} />
                Upload your design
              </button>
              <div style={{
                flex: '0 0 30%', ...body, fontSize: '15px', fontWeight: 600,
                background: 'rgba(250,250,249,0.06)', color: TP,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderLeft: `1px solid ${BS}`,
              }}>
                It's Free
              </div>
            </motion.div>
          </FV>

        </div>
      </div>
      <style>{`@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }`}</style>
    </section>
  );
}

// ─── Brand Story ──────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    accent: '#FFD600',
    title: 'Upload your art.',
    sub: 'Any design. Any niche.',
    desc: 'Drop your PNG or JPEG and watch it come to life on a tee. Oversized, classic, crop — you pick the cut.',
  },
  {
    num: '02',
    accent: AS,
    title: 'We handle the rest.',
    sub: 'Print. Pack. Ship.',
    desc: 'Every order is printed on premium 220gsm cotton using DTF tech, packed carefully, and shipped anywhere in India.',
  },
  {
    num: '03',
    accent: '#FF9500',
    title: 'You get paid.',
    sub: '80% of every sale.',
    desc: 'Monthly payouts via UPI or bank transfer. Track sales, earnings, and fan orders from your dashboard.',
  },
];

function BrandStory() {
  const navigate = useNavigate();

  return (
    <section style={{ background: BG, borderTop: `1px solid ${BS}`, padding: '120px 0 100px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px' }}>

        {/* Section label + heading */}
        <FV delay={0} style={{ marginBottom: '80px' }}>
          <span style={{ ...script, fontSize: '42px', color: AS, display: 'block', marginBottom: '12px' }}>
            how it works?
          </span>
          <h2 style={{
            ...display, fontWeight: 700, fontStyle: 'italic',
            fontSize: 'clamp(44px, 7.5vw, 110px)',
            color: TP, margin: 0,
            lineHeight: 0.9, letterSpacing: '-0.02em',
            textTransform: 'uppercase',
          }}>
            Three steps.
            <br />
            <span style={{ ...serif, fontStyle: 'italic', fontWeight: 400, textTransform: 'none', fontSize: '0.72em', letterSpacing: '-0.01em' }}>
              That's it.
            </span>
          </h2>
        </FV>

        {/* Editorial step columns — single row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderTop: `1px solid ${BS}`,
        }}>
          {STEPS.map(({ num, accent, title, sub, desc }, i) => (
            <FV key={num} delay={i * 0.12} y={24}>
              <div style={{
                padding: '52px 40px 52px 0',
                borderRight: i < 2 ? `1px solid ${BS}` : 'none',
                paddingLeft: i > 0 ? '40px' : '0',
              }}>

                {/* Giant outline number */}
                <div style={{
                  ...display,
                  fontWeight: 700,
                  fontStyle: 'italic',
                  fontSize: 'clamp(72px, 8vw, 120px)',
                  lineHeight: 1,
                  color: 'transparent',
                  WebkitTextStroke: `2px ${accent}`,
                  userSelect: 'none',
                  letterSpacing: '-0.04em',
                  marginBottom: '32px',
                }}>
                  {num}
                </div>

                {/* Title + italic sub */}
                <h3 style={{
                  ...display, fontWeight: 700,
                  fontSize: 'clamp(22px, 2.5vw, 36px)',
                  color: TP, margin: '0 0 8px',
                  lineHeight: 1, letterSpacing: '-0.02em',
                  textTransform: 'uppercase',
                }}>
                  {title}
                </h3>
                <span style={{
                  ...serif, fontStyle: 'italic', fontWeight: 400,
                  fontSize: 'clamp(16px, 1.6vw, 22px)',
                  color: accent, display: 'block',
                  marginBottom: '20px',
                }}>
                  {sub}
                </span>

                {/* Body description */}
                <p style={{
                  ...body, fontSize: '17px', lineHeight: 1.7,
                  color: TS, margin: 0,
                }}>
                  {desc}
                </p>

              </div>
            </FV>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${BS}` }} />

        {/* CTA */}
        <FV delay={0.4} style={{ marginTop: '64px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 28px rgba(255,214,0,0.3)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/sell')}
            style={{
              ...display, fontWeight: 700, fontStyle: 'italic',
              fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.01em',
              background: '#FFD600', color: BG, border: 'none',
              padding: '18px 48px', cursor: 'pointer',
            }}
            data-testid="how-it-works-cta"
          >
            Sign up now →
          </motion.button>
          <p style={{ ...body, fontSize: '15px', color: TT, margin: 0 }}>
            No credit card. No inventory. No catches.
          </p>
        </FV>

      </div>
    </section>
  );
}

// ─── Trending Carousel ────────────────────────────────────────────────────────
function TrendingCarousel({ products, loading }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const scroll = dir => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <section style={{ background: BG, borderTop: `1px solid ${BS}`, padding: '80px 0' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <h2 style={{ ...display, fontSize: 'clamp(28px, 4vw, 44px)', color: TP, margin: 0, letterSpacing: '-0.02em' }}>
            trending now 🔥
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <a onClick={e => { e.preventDefault(); navigate('/explore'); }} href="/explore" style={{ ...body, fontSize: '14px', color: TS, textDecoration: 'none' }}>
              see all →
            </a>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[ChevronLeft, ChevronRight].map((Icon, i) => (
                <button
                  key={i}
                  onClick={() => scroll(i === 0 ? -1 : 1)}
                  style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    border: `1px solid ${BS}`, background: 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  <Icon size={16} color={TP} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          style={{ display: 'flex', gap: '16px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '8px' }}
        >
          {loading
            ? Array(6).fill(0).map((_, i) => (
                <div key={i} style={{ minWidth: '280px' }}><SkeletonCard /></div>
              ))
            : products.slice(0, 10).map((p, i) => (
                <div key={p.product_id} style={{ minWidth: '280px' }}>
                  <ProductCard product={p} index={i} />
                </div>
              ))
          }
        </div>
      </div>
    </section>
  );
}

// ─── Vibe Grid ────────────────────────────────────────────────────────────────
const VIBES = [
  { label: 'streetwear', span: 2, img: 'https://images.pexels.com/photos/4710336/pexels-photo-4710336.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=500&w=800' },
  { label: 'anime', span: 1, img: 'https://images.pexels.com/photos/9558583/pexels-photo-9558583.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=500&w=400' },
  { label: 'desi remix', span: 1, img: 'https://images.pexels.com/photos/8904575/pexels-photo-8904575.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=500&w=400' },
  { label: 'minimal', span: 1, img: 'https://images.pexels.com/photos/9558752/pexels-photo-9558752.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=500&w=400' },
  { label: 'dark academia', span: 1, img: 'https://images.pexels.com/photos/19461585/pexels-photo-19461585.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=500&w=400' },
  { label: 'absurd humor', span: 1, img: 'https://images.pexels.com/photos/3137064/pexels-photo-3137064.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=500&w=400' },
];

function VibeGrid() {
  const navigate = useNavigate();

  return (
    <section style={{ background: BG, borderTop: `1px solid ${BS}`, padding: '80px 0' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px' }}>
        <FV style={{ marginBottom: '40px' }}>
          <h2 style={{ ...display, fontSize: 'clamp(28px, 4vw, 44px)', color: TP, margin: 0, letterSpacing: '-0.02em' }}>
            find your vibe
          </h2>
        </FV>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 280px)', gap: '12px' }}>
          {VIBES.map((v, i) => (
            <motion.div
              key={v.label}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              onClick={() => navigate(`/explore?category=${v.label}`)}
              style={{
                position: 'relative', overflow: 'hidden', borderRadius: '8px',
                cursor: 'pointer',
                gridColumn: i === 0 ? 'span 2' : 'span 1',
              }}
            >
              <img
                src={v.img}
                alt={v.label}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', display: 'block' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,11,0.8) 0%, transparent 55%)' }} />
              <span style={{
                position: 'absolute', bottom: '20px', left: '20px',
                ...display, fontSize: 'clamp(18px, 2.5vw, 26px)', color: TP, letterSpacing: '-0.01em',
              }}>
                {v.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Creator Spotlight ────────────────────────────────────────────────────────
function CreatorSpotlight({ products }) {
  const navigate = useNavigate();
  const creator = products?.[0];
  if (!creator) return null;
  const creatorProducts = products.filter(p => p.user_id === creator.user_id).slice(0, 3);

  return (
    <section style={{ background: SURF, padding: '96px 0' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px' }}>
        <FV style={{ marginBottom: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ ...body, fontSize: '11px', color: '#5A5A5E', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Featured Creator</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(10,10,11,0.12)' }} />
          </div>
        </FV>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '80px', alignItems: 'start' }}>
          <FV>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: BG3, marginBottom: '20px', overflow: 'hidden' }}>
              <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${creator.user_id}`} alt="creator" style={{ width: '100%', height: '100%' }} />
            </div>
            <h3 style={{ ...display, fontSize: '32px', color: BG, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              {creator.title?.split(' ').slice(0, 2).join(' ') || 'Anonymous Creator'}
            </h3>
            <p style={{ ...body, fontSize: '14px', color: '#5A5A5E', margin: '0 0 28px', lineHeight: 1.6 }}>
              Independent streetwear artist creating bold, original designs for India's Gen Z culture.
            </p>
            <button
              onClick={() => navigate(`/artist/${creator.user_id}`)}
              style={{
                ...body, fontSize: '13px', fontWeight: 600, color: BG,
                background: 'transparent', border: '1.5px solid rgba(10,10,11,0.3)',
                borderRadius: '999px', padding: '10px 24px', cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = BG; e.currentTarget.style.color = SURF; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = BG; }}
            >
              Visit Shop →
            </button>
          </FV>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {creatorProducts.map((p, i) => (
              <motion.div
                key={p.product_id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                onClick={() => navigate(`/t/${p.product_id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ aspectRatio: '1/1', overflow: 'hidden', borderRadius: '8px', marginBottom: '12px' }}>
                  <img
                    src={p.mockup_image || 'https://images.pexels.com/photos/9558752/pexels-photo-9558752.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400'}
                    alt={p.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <p style={{ ...display, fontSize: '15px', color: BG, margin: '0 0 4px' }}>{p.title}</p>
                <p style={{ ...display, fontSize: '15px', color: '#9A6000', margin: 0 }}>₹{Math.round(p.price)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Fresh Drops ──────────────────────────────────────────────────────────────
function FreshDrops({ products, loading }) {
  const navigate = useNavigate();

  return (
    <section style={{ background: BG, borderTop: `1px solid ${BS}`, padding: '80px 0' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px' }}>
        <FV style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '40px' }}>
          <h2 style={{ ...display, fontSize: 'clamp(28px, 4vw, 44px)', color: TP, margin: 0, letterSpacing: '-0.02em' }}>
            Fresh Drops
          </h2>
          <a onClick={e => { e.preventDefault(); navigate('/drops'); }} href="/drops" style={{ ...body, fontSize: '13px', color: TS, textDecoration: 'none' }}>
            View all →
          </a>
        </FV>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {loading
            ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : products.slice(0, 8).map((p, i) => <ProductCard key={p.product_id} product={p} index={i} />)
          }
        </div>
      </div>
    </section>
  );
}

// ─── Sell CTA ──────────────────────────────────────────────────────────────────
function SellCTA() {
  const navigate = useNavigate();

  return (
    <section style={{ background: BG2, borderTop: `1px solid ${BS}`, padding: '96px 0', position: 'relative', overflow: 'hidden' }}>
      {/* Accent glow edges */}
      <div style={{ position: 'absolute', top: '-200px', left: '-200px', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${AP}18 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-200px', right: '-200px', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${AS}12 0%, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px', position: 'relative', zIndex: 1 }}>
        <FV>
          <h2 style={{ ...serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(48px, 8vw, 110px)', color: TP, margin: '0 0 24px', lineHeight: 0.92, letterSpacing: '-0.035em' }}>
            got art?<br />sell it.
          </h2>
          <p style={{ ...body, fontSize: '18px', color: TS, margin: '0 0 52px', maxWidth: '520px', lineHeight: 1.7 }}>
            upload your design. we print it. you get paid.
          </p>
        </FV>

        <div style={{ display: 'flex', gap: '48px', marginBottom: '56px', flexWrap: 'wrap' }}>
          {[['₹0', 'upfront'], ['you set', 'the price'], ['we handle', 'the rest']].map(([num, label]) => (
            <FV key={label}>
              <div>
                <div style={{ ...display, fontSize: 'clamp(32px, 5vw, 56px)', color: TP, lineHeight: 1, letterSpacing: '-0.03em' }}>{num}</div>
                <div style={{ ...body, fontSize: '13px', color: TS, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '6px' }}>{label}</div>
              </div>
            </FV>
          ))}
        </div>

        <FV delay={0.15}>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 28px rgba(255,61,0,0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/sell')}
            style={{
              ...body, fontSize: '15px', fontWeight: 600,
              background: AP, color: BG, border: 'none',
              borderRadius: '999px', padding: '16px 40px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            }}
            data-testid="sell-cta-btn"
          >
            Create Your Free Shop <ArrowRight size={16} />
          </motion.button>
        </FV>
      </div>
    </section>
  );
}

// ─── Newsletter ───────────────────────────────────────────────────────────────
function Newsletter() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  return (
    <section style={{ background: BG, borderTop: `1px solid ${BS}`, padding: '80px 0' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px' }}>
        <FV style={{ maxWidth: '600px' }}>
          <h2 style={{ ...display, fontSize: 'clamp(28px, 4vw, 48px)', color: TP, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Stay in the loop.
          </h2>
          <p style={{ ...body, fontSize: '15px', color: TS, margin: '0 0 32px' }}>
            Get early access to drops + 15% off your first order.
          </p>
          {done ? (
            <p style={{ ...body, fontSize: '15px', color: AS }}>You're in. Watch your inbox. ✓</p>
          ) : (
            <form
              onSubmit={e => { e.preventDefault(); if (email) setDone(true); }}
              style={{ display: 'flex', gap: '0', border: `1px solid ${BS}`, borderRadius: '999px', overflow: 'hidden', maxWidth: '440px' }}
            >
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  flex: 1, ...body, fontSize: '14px', color: TP,
                  background: 'transparent', border: 'none', padding: '14px 20px',
                  outline: 'none',
                }}
                data-testid="newsletter-input"
              />
              <button
                type="submit"
                style={{
                  ...body, fontSize: '13px', fontWeight: 600, color: BG,
                  background: TP, border: 'none', padding: '14px 24px', cursor: 'pointer',
                  borderRadius: '0 999px 999px 0',
                }}
                data-testid="newsletter-submit"
              >
                Subscribe
              </button>
            </form>
          )}
        </FV>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function SiteFooter() {
  const navigate = useNavigate();

  const cols = [
    { label: 'Shop', links: [['Men', '/explore'], ['Women', '/explore'], ['Oversized', '/explore'], ['Trending', '/drops']] },
    { label: 'Create', links: [['Sell Your Art', '/sell'], ['Creator FAQ', '/faq'], ['Pricing', '/sell']] },
    { label: 'Company', links: [['About', '/about'], ['Blog', '#']] },
    { label: 'Help', links: [['FAQ', '/faq'], ['Shipping', '#'], ['Size Guide', '/size-guide'], ['Contact', '#']] },
  ];

  return (
    <footer style={{ background: BG, borderTop: `1px solid ${BS}` }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '72px 32px 40px' }}>

        {/* CAESURA watermark */}
        <div aria-hidden style={{
          ...display, fontSize: 'clamp(48px, 10vw, 140px)', color: TP, opacity: 0.03,
          letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '64px',
          userSelect: 'none', pointerEvents: 'none',
        }}>
          CAESURA
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(4, 1fr)', gap: '48px', marginTop: '-80px' }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '16px' }}>
              <span style={{ ...display, fontSize: '22px', color: TP }}>Caesura</span>
              <span style={{ color: AP, fontSize: '26px' }}>.</span>
            </div>
            <p style={{ ...body, fontSize: '13px', color: TS, lineHeight: 1.75, maxWidth: '220px', margin: '0 0 24px' }}>
              Premium streetwear marketplace for independent creators. No inventory. No limits.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[Twitter, Instagram, Youtube].map((Icon, i) => (
                <button
                  key={i}
                  style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    border: `1px solid ${BS}`, background: 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  <Icon size={13} color={TS} />
                </button>
              ))}
            </div>
          </div>

          {/* Nav cols */}
          {cols.map(col => (
            <div key={col.label}>
              <p style={{ ...body, fontSize: '11px', color: TT, letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 16px' }}>
                {col.label}
              </p>
              {col.links.map(([label, path]) => (
                <a
                  key={label}
                  href={path}
                  onClick={e => { e.preventDefault(); navigate(path); }}
                  style={{ ...body, fontSize: '13px', color: TS, textDecoration: 'none', display: 'block', marginBottom: '10px', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = TP)}
                  onMouseLeave={e => (e.currentTarget.style.color = TS)}
                >
                  {label}
                </a>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: `1px solid ${BS}`, marginTop: '48px', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ ...body, fontSize: '12px', color: TT }}>
            © {new Date().getFullYear()} Caesura Inc. Made with ♥ in India.
          </span>
          <div style={{ display: 'flex', gap: '24px' }}>
            {['Privacy Policy', 'Terms of Service'].map(l => (
              <a key={l} href="#" style={{ ...body, fontSize: '12px', color: TT, textDecoration: 'none' }}>
                {l}
              </a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {['UPI', 'Visa', 'Razorpay'].map(p => (
              <span key={p} style={{ ...body, fontSize: '10px', color: TT, border: `1px solid ${BS}`, borderRadius: '4px', padding: '3px 8px' }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function Landing() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then(res => setProducts(res.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      <SiteHeader />
      <HeroSection />
      <WhoAreWe />
      <BrandStory />
      <UploadShowcase />
      <TrendingCarousel products={products} loading={loading} />
      <VibeGrid />
      <CreatorSpotlight products={products} />
      <FreshDrops products={products} loading={loading} />
      <SellCTA />
      <Newsletter />
      <SiteFooter />
    </div>
  );
}
