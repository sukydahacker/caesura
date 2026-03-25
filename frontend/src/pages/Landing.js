import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence, easeOut } from 'framer-motion';
import { Upload, ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Truck, Palette, Star, Heart, ShoppingBag, Twitter, Instagram, Youtube } from 'lucide-react';
import { getProducts } from '@/lib/api';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const BG    = '#0A0A0B';
const BG2   = '#111113';
const BG3   = '#1A1A1C';
const SURF  = '#F5F4F0';
const TP    = '#FAFAF9';
const TS    = 'rgba(250,250,249,0.55)';
const TT    = 'rgba(250,250,249,0.25)';
const BS    = 'rgba(250,250,249,0.08)';
const AP    = '#FF3D00';
const AS    = '#C8FF00';
const GOLD  = '#FFD600';
const BLUE  = '#0047FF';

const display = { fontFamily: '"Clash Display", "Bebas Neue", sans-serif' };
const serif   = { fontFamily: '"DM Serif Display", "Georgia", serif' };
const body    = { fontFamily: '"DM Sans", system-ui, sans-serif' };
const mono    = { fontFamily: '"JetBrains Mono", monospace' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FV = ({ children, x = 0, y = 30, delay = 0, style = {} }) => (
  <motion.div
    initial={{ opacity: 0, x, y }}
    whileInView={{ opacity: 1, x: 0, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    style={style}
  >
    {children}
  </motion.div>
);

// ─── Header ───────────────────────────────────────────────────────────────────
function SiteHeader({ user }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    ['Home',          '/'],
    ['Shop',          '/explore'],
    ['Sell Your Art', '/join'],
    ['FAQ',           '/faq'],
    ['Contact Us',    'mailto:hello@caesura.in'],
  ];

  return (
    <>
      {/* Slide-out Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              style={{
                position: 'fixed', top: 0, left: 0, bottom: 0, width: '360px',
                background: BG2, zIndex: 300, display: 'flex', flexDirection: 'column',
                borderRight: `1px solid ${BS}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: `1px solid ${BS}` }}>
                <span style={{ ...display, fontSize: '22px', color: TP, letterSpacing: '-0.01em' }}>CAESURA<span style={{ color: AP }}>.</span></span>
                <button
                  onClick={() => setMenuOpen(false)}
                  style={{ ...body, fontSize: '13px', color: TS, background: BG3, border: `1px solid ${BS}`, borderRadius: '999px', padding: '8px 16px', cursor: 'pointer' }}
                >
                  Close ✕
                </button>
              </div>
              <nav style={{ flex: 1, padding: '40px 28px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {navLinks.map(([label, path], i) => (
                  <motion.a
                    key={label}
                    href={path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.06, ease: easeOut }}
                    onClick={e => {
                      e.preventDefault();
                      if (path.startsWith('mailto:')) { window.location.href = path; }
                      else { navigate(path); }
                      setMenuOpen(false);
                    }}
                    style={{
                      ...display, fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 700,
                      color: TP, textDecoration: 'none',
                      lineHeight: 1, letterSpacing: '-0.02em',
                      textTransform: 'uppercase',
                      padding: '14px 0',
                      borderBottom: `1px solid ${BS}`,
                      display: 'block',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                    onMouseLeave={e => (e.currentTarget.style.color = TP)}
                  >
                    {label}
                  </motion.a>
                ))}
              </nav>
              <div style={{ padding: '24px 28px', borderTop: `1px solid ${BS}`, display: 'flex', gap: '12px' }}>
                {[Twitter, Instagram, Youtube].map((Icon, i) => (
                  <button key={i} style={{ width: '36px', height: '36px', borderRadius: '50%', border: `1px solid ${BS}`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Icon size={14} color={TS} />
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '72px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', zIndex: 100,
        background: scrolled ? 'rgba(10,10,11,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? `1px solid ${BS}` : 'none',
        transition: 'all 0.3s ease',
      }}>
        {/* Left: Menu */}
        <button
          onClick={() => setMenuOpen(true)}
          style={{ ...body, fontSize: '14px', fontWeight: 500, color: TP, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}
        >
          <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ width: '18px', height: '1.5px', background: TP, display: 'block' }} />
            <span style={{ width: '12px', height: '1.5px', background: TP, display: 'block' }} />
          </span>
          Menu
        </button>

        {/* Center: Social */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[Twitter, Instagram, Youtube].map((Icon, i) => (
            <button key={i} style={{ width: '36px', height: '36px', borderRadius: '50%', border: `1px solid rgba(250,250,249,0.2)`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Icon size={14} color={TP} />
            </button>
          ))}
        </div>

        {/* Right: Auth + icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              style={{ ...body, fontSize: '14px', fontWeight: 600, color: BG, background: TP, border: 'none', borderRadius: '999px', padding: '10px 24px', cursor: 'pointer' }}
            >
              Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate('/join')}
              style={{ ...body, fontSize: '14px', fontWeight: 600, color: BG, background: TP, border: 'none', borderRadius: '999px', padding: '10px 24px', cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Sign up / Login
            </button>
          )}
          <button onClick={() => navigate('/cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <ShoppingBag size={22} color={TP} />
          </button>
        </div>
      </header>
    </>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection({ user }) {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <section ref={heroRef} style={{ background: BG, width: '100vw', minHeight: '100vh', overflow: 'hidden', position: 'relative' }}>

      {/* Background image */}
      <motion.div style={{ opacity: heroOpacity, position: 'absolute', inset: 0, zIndex: 1 }}>
        <img
          src="/nubelson-fernandes-iE71-TMrrkE-unsplash.jpg"
          alt="Caesura crew"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%', filter: 'contrast(1.15) saturate(1.2) brightness(0.9)' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,71,255,0.12) 0%, rgba(0,0,0,0.5) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
      </motion.div>

      {/* Grain overlay */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, opacity: 0.04, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '128px' }} />

      {/* Giant wordmark */}
      <motion.div
        style={{ opacity: heroOpacity, y: heroY }}
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'absolute', top: '42%', left: 0, transform: 'translateY(-50%)',
          width: '100vw', zIndex: 6,
        }}
      >
        <h1 style={{
          ...display, fontWeight: 700, fontStyle: 'italic',
          fontSize: 'clamp(80px, 14.8vw, 260px)',
          color: GOLD, letterSpacing: '0em', lineHeight: 0.88,
          textTransform: 'uppercase', margin: 0, userSelect: 'none',
          width: '100%', textAlign: 'center', display: 'block',
        }}>
          CAESURA.
          <sup style={{ ...body, fontStyle: 'normal', fontWeight: 400, fontSize: '0.18em', color: GOLD, verticalAlign: 'super', letterSpacing: 0, marginLeft: '0.1em', opacity: 0.85 }}>™</sup>
        </h1>
      </motion.div>

      {/* Bottom left label */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        style={{ position: 'absolute', bottom: '48px', left: '5%', zIndex: 6, display: 'flex', gap: '20px', alignItems: 'baseline' }}
      >
        <span style={{ ...display, fontWeight: 700, fontSize: 'clamp(12px, 1.5vw, 18px)', color: TP, letterSpacing: '0.12em', textTransform: 'uppercase' }}>CREATOR-LED</span>
        <span style={{ ...body, fontSize: '11px', color: TT }}>/</span>
        <span style={{ ...display, fontWeight: 700, fontSize: 'clamp(12px, 1.5vw, 18px)', color: TP, letterSpacing: '0.12em', textTransform: 'uppercase' }}>T-SHIRT</span>
        <span style={{ ...body, fontSize: '11px', color: TT }}>/</span>
        <span style={{ ...display, fontWeight: 700, fontSize: 'clamp(12px, 1.5vw, 18px)', color: TP, letterSpacing: '0.12em', textTransform: 'uppercase' }}>For Creators</span>
      </motion.div>

      {/* Bottom right CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        style={{ position: 'absolute', bottom: '40px', right: '5%', zIndex: 6, display: 'flex', gap: '12px', alignItems: 'center' }}
      >
        <button
          onClick={() => navigate('/join')}
          style={{ ...body, fontSize: '14px', fontWeight: 600, color: BG, background: GOLD, border: 'none', borderRadius: '999px', padding: '12px 28px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'opacity 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Start Creating <Upload size={15} />
        </button>
        <button
          onClick={() => navigate('/explore')}
          style={{ ...body, fontSize: '14px', fontWeight: 500, color: TP, background: 'rgba(250,250,249,0.1)', border: `1px solid rgba(250,250,249,0.2)`, borderRadius: '999px', padding: '12px 28px', cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'all 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(250,250,249,0.18)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(250,250,249,0.1)')}
        >
          Shop Collection
        </button>
      </motion.div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        style={{ position: 'absolute', bottom: '56px', right: '5%', zIndex: 5, ...mono, fontSize: '10px', color: TS, letterSpacing: '0.25em', textTransform: 'uppercase', margin: 0 }}
      >
        WEAR ART, NOT LABELS. //
      </motion.p>
    </section>
  );
}

// ─── What Is Caesura ──────────────────────────────────────────────────────────
function WhatIsCaesura() {
  return (
    <section style={{ background: BG, borderTop: `1px solid ${BS}`, padding: '120px 0' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <FV x={-40}>
            <div style={{ position: 'relative' }}>
              <img
                src="/logan-weaver-lgnwvr-1bYp7FWHiTo-unsplash.jpg"
                alt="Caesura community"
                style={{ width: '100%', height: '560px', objectFit: 'cover', objectPosition: 'center 25%' }}
                onError={e => {
                  e.target.src = 'https://images.unsplash.com/photo-1622236405896-f0ee41309aa3?w=600&q=80';
                }}
              />
              <div style={{ position: 'absolute', bottom: '24px', left: '24px', ...mono, fontSize: '10px', color: TP, letterSpacing: '0.2em', textTransform: 'uppercase', background: 'rgba(10,10,11,0.75)', padding: '6px 14px', backdropFilter: 'blur(8px)' }}>
                New Delhi, India
              </div>
            </div>
          </FV>

          <FV x={40} delay={0.15}>
            <span style={{ ...mono, fontSize: '11px', color: TT, letterSpacing: '0.25em', textTransform: 'uppercase', display: 'block', marginBottom: '20px' }}>THE PLATFORM</span>
            <h2 style={{ ...display, fontWeight: 700, fontStyle: 'italic', fontSize: 'clamp(40px, 5.5vw, 72px)', color: TP, margin: '0 0 32px', lineHeight: 0.95, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
              Your Art.<br />
              <span style={{ ...serif, fontStyle: 'italic', fontWeight: 400, textTransform: 'none', color: AS }}>On a Tee.</span>
            </h2>
            <p style={{ ...body, fontSize: '18px', lineHeight: 1.7, color: TS, margin: '0 0 20px', maxWidth: '480px' }}>
              Caesura is the bridge between your imagination and the world. A premium marketplace where independent creators sell original streetwear — no inventory, no upfront costs, no limits.
            </p>
            <p style={{ ...body, fontSize: '18px', lineHeight: 1.7, color: TS, margin: '0', maxWidth: '480px' }}>
              Every piece is made-to-order, ensuring zero waste and maximum creative freedom. Your art. Your rules.
            </p>
          </FV>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
const STEPS = [
  { num: '01', accent: GOLD,     icon: <Upload size={28} />,      title: 'Upload your art.',   sub: 'Any design. Any niche.',    desc: 'Drop your PNG or JPEG and watch it come to life on a tee. Oversized, classic, crop — you pick the cut.' },
  { num: '02', accent: BLUE,     icon: <Palette size={28} />,     title: 'We review it.',      sub: 'Quality assured.',          desc: 'Our team checks for originality and print quality. Once approved your design goes live on the marketplace.' },
  { num: '03', accent: AS,       icon: <Truck size={28} />,       title: 'We handle the rest.', sub: 'Print. Pack. Ship.',        desc: 'Every order is printed on premium 220gsm cotton using DTF tech, packed carefully, and shipped across India.' },
  { num: '04', accent: AP,       icon: <Star size={28} />,        title: 'You get paid.',      sub: '80% of every sale.',        desc: 'Monthly payouts via UPI or bank transfer. Track sales, earnings, and fan orders from your dashboard.' },
];

function HowItWorks() {
  const navigate = useNavigate();
  return (
    <section style={{ background: BG2, borderTop: `1px solid ${BS}`, padding: '120px 0 100px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 48px' }}>
        <FV style={{ marginBottom: '72px' }}>
          <span style={{ ...mono, fontSize: '11px', color: TT, letterSpacing: '0.25em', textTransform: 'uppercase', display: 'block', marginBottom: '16px' }}>THE PROCESS</span>
          <h2 style={{ ...display, fontWeight: 700, fontStyle: 'italic', fontSize: 'clamp(44px, 7vw, 100px)', color: TP, margin: 0, lineHeight: 0.92, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            Four steps.<br />
            <span style={{ ...serif, fontStyle: 'italic', fontWeight: 400, textTransform: 'none', fontSize: '0.72em', color: TS }}>That's it.</span>
          </h2>
        </FV>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: `1px solid ${BS}` }}>
          {STEPS.map(({ num, accent, icon, title, sub, desc }, i) => (
            <FV key={num} delay={i * 0.1} y={24}>
              <div style={{ padding: '48px 36px 48px 0', borderRight: i < 3 ? `1px solid ${BS}` : 'none', paddingLeft: i > 0 ? '36px' : '0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: `${accent}18`, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px', color: accent }}>
                  {icon}
                </div>
                <div style={{ ...display, fontWeight: 700, fontStyle: 'italic', fontSize: 'clamp(52px, 6vw, 80px)', lineHeight: 1, color: 'transparent', WebkitTextStroke: `1.5px ${accent}`, userSelect: 'none', letterSpacing: '-0.04em', marginBottom: '24px' }}>
                  {num}
                </div>
                <h3 style={{ ...display, fontWeight: 700, fontSize: 'clamp(18px, 2vw, 26px)', color: TP, margin: '0 0 6px', lineHeight: 1, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>{title}</h3>
                <span style={{ ...serif, fontStyle: 'italic', fontWeight: 400, fontSize: '16px', color: accent, display: 'block', marginBottom: '16px' }}>{sub}</span>
                <p style={{ ...body, fontSize: '15px', lineHeight: 1.7, color: TS, margin: 0 }}>{desc}</p>
              </div>
            </FV>
          ))}
        </div>

        <FV delay={0.4} style={{ marginTop: '64px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/join')}
            style={{ ...display, fontWeight: 700, fontStyle: 'italic', fontSize: '16px', textTransform: 'uppercase', background: GOLD, color: BG, border: 'none', borderRadius: '999px', padding: '16px 40px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            Start for free <ArrowRight size={16} />
          </motion.button>
          <span style={{ ...body, fontSize: '13px', color: TT }}>No credit card. No inventory. No catches.</span>
        </FV>
      </div>
    </section>
  );
}

// ─── For Creators ─────────────────────────────────────────────────────────────
function ForCreators() {
  const navigate = useNavigate();
  return (
    <section style={{ background: '#09090B', borderTop: `1px solid ${BS}`, padding: '120px 0' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 48px' }}>
        <FV style={{ marginBottom: '64px' }}>
          <span style={{ ...mono, fontSize: '11px', color: TT, letterSpacing: '0.25em', textTransform: 'uppercase', display: 'block', marginBottom: '16px' }}>FOR CREATORS</span>
          <h2 style={{ ...display, fontWeight: 700, fontSize: 'clamp(44px, 7vw, 100px)', color: TP, margin: 0, lineHeight: 0.92, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            You design.<br />
            We produce.<br />
            <span style={{ color: BLUE }}>You sell.</span>
          </h2>
        </FV>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', marginBottom: '64px' }}>
          {[
            { num: '₹0',   label: 'Upfront cost',     desc: 'No inventory, no storage, no risk.' },
            { num: '80%',  label: 'Revenue you keep',  desc: 'The best split in the industry.' },
            { num: '∞',    label: 'Creative freedom',  desc: 'Any design, any niche, any vision.' },
          ].map(({ num, label, desc }, i) => (
            <FV key={label} delay={i * 0.1}>
              <div style={{ background: BG3, padding: '48px 40px', borderRight: i < 2 ? `1px solid ${BS}` : 'none' }}>
                <div style={{ ...display, fontWeight: 700, fontStyle: 'italic', fontSize: 'clamp(48px, 6vw, 80px)', color: GOLD, lineHeight: 1, marginBottom: '12px' }}>{num}</div>
                <div style={{ ...display, fontWeight: 600, fontSize: '20px', color: TP, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{label}</div>
                <div style={{ ...body, fontSize: '14px', color: TS, lineHeight: 1.6 }}>{desc}</div>
              </div>
            </FV>
          ))}
        </div>

        <FV>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/join')}
              style={{ ...body, fontSize: '14px', fontWeight: 600, color: BG, background: TP, border: 'none', borderRadius: '999px', padding: '14px 32px', cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Create Your Free Shop
            </button>
            <button
              onClick={() => navigate('/explore')}
              style={{ ...body, fontSize: '14px', fontWeight: 500, color: TP, background: 'transparent', border: `1px solid ${BS}`, borderRadius: '999px', padding: '14px 32px', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(250,250,249,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = BS)}
            >
              Browse the Marketplace
            </button>
          </div>
        </FV>
      </div>
    </section>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, index }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      onClick={() => navigate(`/t/${product.product_id}`)}
      style={{ cursor: 'pointer', minWidth: '260px' }}
    >
      <div style={{ aspectRatio: '3/4', overflow: 'hidden', background: BG3, marginBottom: '12px', position: 'relative' }}>
        <img
          src={product.mockup_image || 'https://images.pexels.com/photos/9558752/pexels-photo-9558752.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400'}
          alt={product.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
          onMouseEnter={e => (e.target.style.transform = 'scale(1.04)')}
          onMouseLeave={e => (e.target.style.transform = 'scale(1)')}
        />
        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
          <button style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(10,10,11,0.6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
            <Heart size={14} color={TP} />
          </button>
        </div>
      </div>
      <p style={{ ...mono, fontSize: '10px', color: TT, letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 4px' }}>T-SHIRT</p>
      <p style={{ ...display, fontSize: '16px', color: TP, margin: '0 0 2px', letterSpacing: '-0.01em' }}>{product.title}</p>
      <p style={{ ...body, fontSize: '15px', color: GOLD, margin: 0, fontWeight: 600 }}>₹{Math.round(product.price || 0)}</p>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ minWidth: '260px' }}>
      <div style={{ aspectRatio: '3/4', background: BG3, marginBottom: '12px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: '10px', background: BG3, marginBottom: '6px', width: '60%', borderRadius: '4px' }} />
      <div style={{ height: '16px', background: BG3, marginBottom: '4px', width: '80%', borderRadius: '4px' }} />
      <div style={{ height: '15px', background: BG3, width: '40%', borderRadius: '4px' }} />
      <style>{`@keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
    </div>
  );
}

// ─── Trending ─────────────────────────────────────────────────────────────────
function TrendingCarousel({ products, loading }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const scroll = dir => scrollRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });

  return (
    <section style={{ background: BG, borderTop: `1px solid ${BS}`, padding: '80px 0' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <h2 style={{ ...display, fontSize: 'clamp(28px, 4vw, 48px)', color: TP, margin: 0, letterSpacing: '-0.02em' }}>Trending Now 🔥</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <a onClick={e => { e.preventDefault(); navigate('/explore'); }} href="/explore" style={{ ...body, fontSize: '13px', color: TS, textDecoration: 'none' }}>see all →</a>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[ChevronLeft, ChevronRight].map((Icon, i) => (
                <button key={i} onClick={() => scroll(i === 0 ? -1 : 1)} style={{ width: '36px', height: '36px', borderRadius: '50%', border: `1px solid ${BS}`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Icon size={16} color={TP} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div ref={scrollRef} style={{ display: 'flex', gap: '16px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '8px' }}>
          {loading
            ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : products.length > 0
              ? products.slice(0, 10).map((p, i) => <ProductCard key={p.product_id} product={p} index={i} />)
              : (
                <div style={{ ...body, fontSize: '15px', color: TS, padding: '40px 0' }}>
                  No products yet — be the first to <a href="/sell" style={{ color: GOLD, textDecoration: 'none' }}>upload your design</a>!
                </div>
              )
          }
        </div>
      </div>
    </section>
  );
}


// ─── Quality Promise ──────────────────────────────────────────────────────────
function QualityPromise() {
  return (
    <section style={{ background: SURF, padding: '120px 0' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <FV x={-40}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { bg: '#09090B', content: <ShieldCheck size={48} color="white" /> },
                { bg: GOLD,      content: <span style={{ ...display, fontSize: '40px', fontWeight: 700, color: BG }}>100%</span> },
                { bg: '#F0F0EC', content: <span style={{ ...display, fontSize: '40px', fontWeight: 700, color: BG }}>80/20</span> },
                { bg: '#09090B', content: <Star size={48} color={GOLD} /> },
              ].map((cell, i) => (
                <div key={i} style={{ aspectRatio: '1/1', background: cell.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>
                  {cell.content}
                </div>
              ))}
            </div>
          </FV>

          <FV x={40} delay={0.15}>
            <span style={{ ...mono, fontSize: '11px', color: '#8A8A8E', letterSpacing: '0.25em', textTransform: 'uppercase', display: 'block', marginBottom: '20px' }}>OUR PROMISE</span>
            <h2 style={{ ...display, fontWeight: 700, fontStyle: 'italic', fontSize: 'clamp(36px, 5vw, 64px)', color: BG, margin: '0 0 32px', lineHeight: 0.95, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
              Curated quality,<br />
              <span style={{ color: BLUE }}>always.</span>
            </h2>
            <p style={{ ...body, fontSize: '17px', lineHeight: 1.7, color: '#5A5A5E', margin: '0 0 20px' }}>
              Every design on Caesura is reviewed by our team. We ensure originality, print quality, and creative merit before anything goes live.
            </p>
            <ul style={{ ...body, fontSize: '15px', color: '#5A5A5E', lineHeight: 1.9, margin: 0, paddingLeft: '0', listStyle: 'none' }}>
              {['Premium 220gsm cotton apparel', 'DTF printing for vibrant, lasting colors', 'Quality control on every single order', 'Pan-India shipping with tracking'].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: BLUE, flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
          </FV>
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
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 48px' }}>
        <FV style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '40px' }}>
          <h2 style={{ ...display, fontSize: 'clamp(28px, 4vw, 48px)', color: TP, margin: 0, letterSpacing: '-0.02em' }}>Fresh Drops</h2>
          <a onClick={e => { e.preventDefault(); navigate('/explore'); }} href="/explore" style={{ ...body, fontSize: '13px', color: TS, textDecoration: 'none' }}>View all →</a>
        </FV>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {loading
            ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : products.length > 0
              ? products.slice(0, 8).map((p, i) => <ProductCard key={p.product_id} product={p} index={i} />)
              : Array(4).fill(0).map((_, i) => (
                  <div key={i} style={{ aspectRatio: '3/4', background: BG3, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '2px' }}>
                    <span style={{ ...mono, fontSize: '10px', color: TT, letterSpacing: '0.2em' }}>COMING SOON</span>
                  </div>
                ))
          }
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA({ user }) {
  const navigate = useNavigate();
  return (
    <section style={{ background: '#09090B', borderTop: `1px solid ${BS}`, padding: '120px 0', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-200px', left: '-200px', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${BLUE}18 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-200px', right: '-200px', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${GOLD}12 0%, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 48px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <FV>
          <h2 style={{ ...serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(48px, 8vw, 110px)', color: TP, margin: '0 0 24px', lineHeight: 0.9, letterSpacing: '-0.03em' }}>
            Turn your ideas<br />into streetwear.
          </h2>
          <p style={{ ...body, fontSize: '18px', color: TS, margin: '0 0 48px', lineHeight: 1.7 }}>
            Join thousands of creators who've launched their fashion brand with zero upfront cost.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/join')}
              style={{ ...body, fontSize: '15px', fontWeight: 600, color: BG, background: TP, border: 'none', borderRadius: '999px', padding: '16px 40px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              Start Creating Today <ArrowRight size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/explore')}
              style={{ ...body, fontSize: '15px', fontWeight: 500, color: TP, background: 'transparent', border: `1px solid rgba(250,250,249,0.25)`, borderRadius: '999px', padding: '16px 40px', cursor: 'pointer' }}
            >
              Explore the Shop
            </motion.button>
          </div>
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
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 48px' }}>
        <FV style={{ maxWidth: '560px' }}>
          <h2 style={{ ...display, fontSize: 'clamp(28px, 4vw, 48px)', color: TP, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Stay in the loop.</h2>
          <p style={{ ...body, fontSize: '15px', color: TS, margin: '0 0 28px' }}>Get early access to drops + 15% off your first order.</p>
          {done ? (
            <p style={{ ...body, fontSize: '15px', color: AS }}>You're in. Watch your inbox. ✓</p>
          ) : (
            <div style={{ display: 'flex', border: `1px solid ${BS}`, borderRadius: '999px', overflow: 'hidden', maxWidth: '420px' }}>
              <input
                type="email" placeholder="your@email.com" value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ flex: 1, ...body, fontSize: '14px', color: TP, background: 'transparent', border: 'none', padding: '14px 20px', outline: 'none' }}
              />
              <button
                onClick={() => { if (email) setDone(true); }}
                style={{ ...body, fontSize: '13px', fontWeight: 600, color: BG, background: TP, border: 'none', padding: '14px 24px', cursor: 'pointer', borderRadius: '0 999px 999px 0' }}
              >
                Subscribe
              </button>
            </div>
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
    { label: 'Shop',    links: [['Men', '/explore'], ['Women', '/explore'], ['Oversized', '/explore'], ['Trending', '/explore']] },
    { label: 'Create',  links: [['Sell Your Art', '/join'], ['Creator FAQ', '/faq'], ['How It Works', '/join']] },
    { label: 'Company', links: [['About', '/about'], ['Blog', '#'], ['Contact', 'mailto:hello@caesura.in']] },
    { label: 'Help',    links: [['FAQ', '/faq'], ['Shipping', '#'], ['Size Guide', '/size-guide'], ['Terms', '#']] },
  ];

  return (
    <footer style={{ background: BG, borderTop: `1px solid ${BS}` }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '72px 48px 40px' }}>
        <div style={{ ...display, fontSize: 'clamp(48px, 10vw, 120px)', color: TP, opacity: 0.03, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '56px', userSelect: 'none' }}>
          CAESURA
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(4, 1fr)', gap: '48px', marginTop: '-64px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '16px' }}>
              <span style={{ ...display, fontSize: '22px', color: TP }}>Caesura</span>
              <span style={{ color: AP, fontSize: '26px' }}>.</span>
            </div>
            <p style={{ ...body, fontSize: '13px', color: TS, lineHeight: 1.75, maxWidth: '220px', margin: '0 0 24px' }}>
              Premium streetwear marketplace for independent creators. No inventory. No limits.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[Twitter, Instagram, Youtube].map((Icon, i) => (
                <button key={i} style={{ width: '34px', height: '34px', borderRadius: '50%', border: `1px solid ${BS}`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Icon size={13} color={TS} />
                </button>
              ))}
            </div>
          </div>

          {cols.map(col => (
            <div key={col.label}>
              <p style={{ ...mono, fontSize: '10px', color: TT, letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 16px' }}>{col.label}</p>
              {col.links.map(([label, path]) => (
                <a
                  key={label}
                  href={path}
                  onClick={e => { e.preventDefault(); if (path.startsWith('mailto:')) { window.location.href = path; } else { navigate(path); } }}
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

        <div style={{ borderTop: `1px solid ${BS}`, marginTop: '48px', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ ...body, fontSize: '12px', color: TT }}>© {new Date().getFullYear()} Caesura Inc. Made with ♥ in India.</span>
          <div style={{ display: 'flex', gap: '24px' }}>
            {['Privacy Policy', 'Terms of Service'].map(l => (
              <a key={l} href="#" style={{ ...body, fontSize: '12px', color: TT, textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {['UPI', 'Visa', 'Razorpay'].map(p => (
              <span key={p} style={{ ...body, fontSize: '10px', color: TT, border: `1px solid ${BS}`, borderRadius: '4px', padding: '3px 8px' }}>{p}</span>
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
  const [loading, setLoading]   = useState(true);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('caesura_user')) || null; } catch { return null; }
  });

  useEffect(() => {
    getProducts()
      .then(res => setProducts(res.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));

    import('@/lib/api').then(({ getMe }) => {
      getMe()
        .then(res => {
          setUser(res.data);
          localStorage.setItem('caesura_user', JSON.stringify(res.data));
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem('caesura_user');
        });
    });
  }, []);

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      <SiteHeader user={user} />
      <HeroSection user={user} />
      <WhatIsCaesura />
      <HowItWorks />
      <ForCreators />
      <TrendingCarousel products={products} loading={loading} />
      <QualityPromise />
      <FreshDrops products={products} loading={loading} />
      <FinalCTA user={user} />
      <Newsletter />
      <SiteFooter />
    </div>
  );
}
