import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw, Maximize2, ChevronLeft,
  ZoomIn, ZoomOut, Crosshair, ArrowUp, ArrowDown,
  ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon,
  Eye, EyeOff, Palette, Layers, Settings,
  Grid3x3, RefreshCw, Save, Lock, Unlock
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// QIKINK CANVAS SPEC — derived from qiknik1.html
//
// Front view display canvas : 291px  × 373.606px  (ratio = 0.7791)
// Lower canvas (2× retina)  : 582px  × 747.213px
// Snap line H (design centre Y): 211.914px → 211.914/373.606 = 0.5675
// Snap line V (design centre X): 104.197px → 104.197/291    = 0.3581
// Active design: 10.00" × 6.67" at 157 DPI → px/inch ≈ 9.70 on display canvas
//
// Max print specs per Qikink product:
//   UT27 Oversized Tee  : 14" × 17" front  / 14" × 17" back
//   UH24 Hoodie         : 11" × 13" front  / 14" × 15" back
//   UH26 Sweatshirt     : 12" × 14" front  / 14" × 15" back
//   US21 Male Crew Tee  : 12" × 14" front  / 14" × 15" back
//   UV34 Male V-Neck    : 12" × 14" front  / 14" × 15" back
//
// Print area fractions = (inches × 9.70) ÷ canvas_px, centred horizontally.
// Horizontal centre = 291/2 = 145.5px → 0.500 of canvas width.
// ─────────────────────────────────────────────────────────────────────────────

const CANVAS_RATIO = '291/373.606'; // Qikink's exact front-view canvas ratio

// ─── Print safe areas (fractions of canvas) ──────────────────────────────────
export const PRINT_SAFE_AREAS = Object.freeze({
  // UT27 — Unisex Terry Oversized Tee  14" × 17" front
  // left = (145.5 − 14×9.70/2)/291 = (145.5−67.9)/291 = 0.267
  // width = 14×9.70/291 = 0.467 | height = 17×9.70/373.606 = 0.441
  // collar ends ~22% → y = 0.220
  UT27: {
    front: { x: 0.267, y: 0.220, width: 0.467, height: 0.441, maxW_in: 14, maxH_in: 17, printMethod: 'dtf' },
    back:  { x: 0.267, y: 0.185, width: 0.467, height: 0.455, maxW_in: 14, maxH_in: 17, printMethod: 'dtf' },
  },
  // UH24 — Unisex Hoodie  11" × 13" front (hood pushes chest area to ~38% down)
  // left = (145.5 − 11×9.70/2)/291 = 0.318 | width = 11×9.70/291 = 0.367
  // height = 13×9.70/373.606 = 0.337
  UH24: {
    front: { x: 0.318, y: 0.385, width: 0.367, height: 0.337, maxW_in: 11, maxH_in: 13, printMethod: 'dtf' },
    back:  { x: 0.267, y: 0.185, width: 0.467, height: 0.390, maxW_in: 14, maxH_in: 15, printMethod: 'dtf' },
  },
  // UH26 — Unisex Sweatshirt  12" × 14" front  collar ~24% down
  // left = (145.5 − 12×9.70/2)/291 = 0.300 | width = 12×9.70/291 = 0.400
  // height = 14×9.70/373.606 = 0.364
  UH26: {
    front: { x: 0.300, y: 0.240, width: 0.400, height: 0.364, maxW_in: 12, maxH_in: 14, printMethod: 'dtf' },
    back:  { x: 0.267, y: 0.185, width: 0.467, height: 0.390, maxW_in: 14, maxH_in: 15, printMethod: 'dtf' },
  },
  // US21 — Male Standard Crew T-Shirt  12" × 14" front  collar ~23% down
  US21: {
    front: { x: 0.300, y: 0.235, width: 0.400, height: 0.364, maxW_in: 12, maxH_in: 14, printMethod: 'dtf' },
    back:  { x: 0.267, y: 0.185, width: 0.467, height: 0.390, maxW_in: 14, maxH_in: 15, printMethod: 'dtf' },
  },
  // UV34 — Male V-Neck T-Shirt  12" × 14" front  V-neck ends ~26% down
  UV34: {
    front: { x: 0.300, y: 0.260, width: 0.400, height: 0.364, maxW_in: 12, maxH_in: 14, printMethod: 'dtf' },
    back:  { x: 0.267, y: 0.185, width: 0.467, height: 0.390, maxW_in: 14, maxH_in: 15, printMethod: 'dtf' },
  },
});

// Legacy string aliases
const LEGACY_SKU = { tshirt: 'US21', hoodie: 'UH24', oversized_tshirt: 'UT27', sweatshirt: 'UH26', bomber_jacket: 'UH26' };

// ─── Qikink official hex codes (from qiknik1.html color buttons) ─────────────
export const QIKINK_COLORS = {
  white:        { hex: '#ffffff', name: 'White',            border: '#d0d0d0' },
  black:        { hex: '#000000', name: 'Black' },
  navy:         { hex: '#0e1723', name: 'Navy Blue' },
  grey:         { hex: '#C3C3C3', name: 'Grey Melange' },
  bottle_green: { hex: '#021705', name: 'Bottle Green' },
  royal_blue:   { hex: '#1F286A', name: 'Royal Blue' },
  red:          { hex: '#A50303', name: 'Red' },
  maroon:       { hex: '#230007', name: 'Maroon' },
  olive:        { hex: '#2A2A16', name: 'Olive Green' },
  mustard:      { hex: '#B6840D', name: 'Mustard Yellow' },
  baby_pink:    { hex: '#ffd4e9', name: 'Light Baby Pink' },
  lavender:     { hex: '#ebdeff', name: 'Lavender' },
  coral:        { hex: '#e57470', name: 'Coral' },
  mint:         { hex: '#c3ffe9', name: 'Mint' },
  baby_blue:    { hex: '#9ecaed', name: 'Baby Blue' },
};

// ─── Product template config ──────────────────────────────────────────────────
// Template images: stored locally after PSD conversion to PNG.
// Qikink's own view thumbnails are used as fallbacks (from qiknik1.html).
const QIKINK_TEMPLATES = {
  UT27: {
    label: 'Unisex Terry Oversized Tee | UT27',
    views: [
      { key: 'front',        label: 'Front',        fallback: 'https://products.qikink.com/assets/admin/uploads/mockup-5/1724664041Untitled-ss.png' },
      { key: 'back',         label: 'Back',         fallback: 'https://products.qikink.com/assets/admin/uploads/mockup-5/1724664035Untitled-1asa.png' },
      { key: 'left_sleeve',  label: 'Left Sleeve',  fallback: 'https://products.qikink.com/assets/admin/uploads/mockup-5/1731500042Left%20Sleeve%20Temp.png' },
      { key: 'right_sleeve', label: 'Right Sleeve', fallback: 'https://products.qikink.com/assets/admin/uploads/mockup-5/1731500069Right%20Sleeve%20Temp.png' },
    ],
    colorImages: {
      front: { white: '/mockups/UT27/white-front.png', black: '/mockups/UT27/black-front.png', navy: '/mockups/UT27/navy-front.png', grey: '/mockups/UT27/grey-front.png', red: '/mockups/UT27/red-front.png' },
      back:  { white: '/mockups/UT27/white-back.png',  black: '/mockups/UT27/black-back.png' },
      left_sleeve:  {},
      right_sleeve: {},
    },
    colors: ['white','black','navy','grey','bottle_green','royal_blue','red','maroon','olive','mustard','baby_pink','lavender','coral','mint','baby_blue'],
    sizes:  ['XS','S','M','L','XL','2XL','3XL'],
  },
  UH24: {
    label: 'Unisex Hoodie | UH24',
    views: [
      { key: 'front', label: 'Front', fallback: '/mockups/UH24/white-front.png' },
      { key: 'back',  label: 'Back',  fallback: '/mockups/UH24/white-back.png'  },
    ],
    colorImages: {
      front: { white: '/mockups/UH24/white-front.png', black: '/mockups/UH24/black-front.png', grey: '/mockups/UH24/grey-front.png' },
      back:  { white: '/mockups/UH24/white-back.png',  black: '/mockups/UH24/black-back.png'  },
    },
    colors: ['white','black','navy','grey','royal_blue','red','maroon'],
    sizes:  ['XS','S','M','L','XL','2XL','3XL'],
  },
  UH26: {
    label: 'Unisex Sweatshirt | UH26',
    views: [
      { key: 'front', label: 'Front', fallback: '/mockups/UH26/white-front.png' },
      { key: 'back',  label: 'Back',  fallback: '/mockups/UH26/white-back.png'  },
    ],
    colorImages: {
      front: { white: '/mockups/UH26/white-front.png', black: '/mockups/UH26/black-front.png', grey: '/mockups/UH26/grey-front.png' },
      back:  { white: '/mockups/UH26/white-back.png',  black: '/mockups/UH26/black-back.png'  },
    },
    colors: ['white','black','navy','grey','bottle_green','royal_blue','red','maroon','olive'],
    sizes:  ['XS','S','M','L','XL','2XL','3XL'],
  },
  US21: {
    label: 'Male Standard Crew T-Shirt | US21',
    views: [
      { key: 'front', label: 'Front', fallback: '/mockups/US21/white-front.png' },
      { key: 'back',  label: 'Back',  fallback: '/mockups/US21/white-back.png'  },
    ],
    colorImages: {
      front: { white: '/mockups/US21/white-front.png', black: '/mockups/US21/black-front.png', grey: '/mockups/US21/grey-front.png' },
      back:  { white: '/mockups/US21/white-back.png',  black: '/mockups/US21/black-back.png'  },
    },
    colors: ['white','black','navy','grey','bottle_green','royal_blue','red','maroon','olive','mustard','baby_pink','lavender','coral','mint','baby_blue'],
    sizes:  ['XS','S','M','L','XL','2XL','3XL'],
  },
  UV34: {
    label: 'Male V-Neck T-Shirt | UV34',
    views: [
      { key: 'front', label: 'Front', fallback: '/mockups/UV34/white-front.png' },
      { key: 'back',  label: 'Back',  fallback: '/mockups/UV34/white-back.png'  },
    ],
    colorImages: {
      front: { white: '/mockups/UV34/white-front.png', black: '/mockups/UV34/black-front.png' },
      back:  { white: '/mockups/UV34/white-back.png',  black: '/mockups/UV34/black-back.png'  },
    },
    colors: ['white','black','navy','grey','royal_blue','red'],
    sizes:  ['S','M','L','XL','2XL'],
  },
};

function getMockupUrl(sku, view, color) {
  const t = QIKINK_TEMPLATES[sku];
  if (!t) return '';
  const ci = t.colorImages?.[view] || {};
  if (ci[color]) return ci[color];
  const viewDef = t.views.find(v => v.key === view);
  return viewDef?.fallback || '';
}

const DESIGN_CONSTRAINTS = { minScale: 0.10, maxScale: 1.0, defaultScale: 0.55 };
const NUDGE  = 0.015;
const SCALE_STEP = 0.05;

// ─── Sub-components ───────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', margin: '0 0 10px' }}>{children}</p>
);
const CtrlBtn = ({ onClick, icon, style: s = {} }) => (
  <button onClick={onClick} style={{ flex: 1, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 5, border: '1px solid #e0e0e0', background: '#f6f6f6', cursor: 'pointer', padding: 0, transition: 'background 0.08s', ...s }}
    onMouseEnter={e => { e.currentTarget.style.background = s.background ? s.background : '#e8e8e8'; }}
    onMouseLeave={e => { e.currentTarget.style.background = s.background || '#f6f6f6'; }}
  >{icon}</button>
);
const FullBtn = ({ onClick, icon, label }) => (
  <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 9px', fontSize: 12, color: '#444', background: '#f6f6f6', border: '1px solid #e8e8e8', borderRadius: 5, cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.08s' }}
    onMouseEnter={e => { e.currentTarget.style.background = '#eee'; }}
    onMouseLeave={e => { e.currentTarget.style.background = '#f6f6f6'; }}
  >{icon} {label}</button>
);
const CoordChip = ({ label, value }) => (
  <div style={{ flex: 1, background: '#f6f6f6', borderRadius: 5, padding: '5px 9px' }}>
    <span style={{ fontSize: 9, color: '#aaa', fontWeight: 600 }}>{label} </span>
    <span style={{ fontSize: 11, color: '#222', fontFamily: 'monospace' }}>{value}</span>
  </div>
);
const SidebarBtn = ({ icon: Icon, label, active, onClick, accent }) => (
  <button onClick={onClick} title={label} style={{ width: '100%', padding: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: active ? 'rgba(255,103,0,0.12)' : 'transparent', border: 'none', cursor: 'pointer', borderLeft: active ? '3px solid #FF6700' : '3px solid transparent', transition: 'all 0.12s' }}>
    <Icon size={17} style={{ color: active ? '#FF6700' : accent ? '#FF6700' : 'rgba(255,255,255,0.5)' }} />
    <span style={{ fontSize: 8, fontFamily: 'system-ui', color: active ? '#FF6700' : 'rgba(255,255,255,0.35)', letterSpacing: '0.05em', fontWeight: active ? 600 : 400, textTransform: 'uppercase' }}>{label}</span>
  </button>
);

// ═════════════════════════════════════════════════════════════════════════════
export default function MockupEditor({
  designImage,
  productType = 'UT27',
  initialPlacement = null,
  onPlacementChange,
  onSave,
  onBack,
}) {
  const sku   = LEGACY_SKU[productType] || productType;
  const tmpl  = QIKINK_TEMPLATES[sku]   || QIKINK_TEMPLATES.US21;
  const areas = PRINT_SAFE_AREAS[sku]   || PRINT_SAFE_AREAS.US21;

  const containerRef = useRef(null);
  const [containerSize, setCSize]  = useState({ width: 0, height: 0 });
  const [activeView, setView]      = useState(tmpl.views[0].key);
  const [color, setColor]          = useState(tmpl.colors[0] || 'white');
  const [placement, setPlacement]  = useState(initialPlacement || { x: 0.5, y: 0.5, scale: DESIGN_CONSTRAINTS.defaultScale });
  const [isDragging, setDrag]      = useState(false);
  const [isResizing, setResize]    = useState(false);
  const [dragStart, setDS]         = useState({ x: 0, y: 0 });
  const [ar, setAR]                = useState(1);
  const [showGuide, setGuide]      = useState(true);
  const [panel, setPanel]          = useState('views');
  const [locked, setLocked]        = useState(false);

  // Aspect ratio of uploaded design
  useEffect(() => {
    if (!designImage) return;
    const img = new window.Image();
    img.onload = () => { if (img.height > 0) setAR(img.width / img.height); };
    img.src = designImage;
  }, [designImage]);

  // Container size observer
  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      setCSize({ width: r.width, height: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Active safe area in pixels
  const sa  = areas?.[activeView] || areas?.front || PRINT_SAFE_AREAS.US21.front;
  const sab = {
    x:      containerSize.width  * sa.x,
    y:      containerSize.height * sa.y,
    width:  containerSize.width  * sa.width,
    height: containerSize.height * sa.height,
  };

  const calcSize = useCallback(() => {
    const maxW = sab.width * placement.scale, maxH = sab.height * placement.scale;
    let w, h;
    if (ar > maxW / maxH) { w = maxW; h = w / ar; } else { h = maxH; w = h * ar; }
    return { width: w, height: h };
  }, [sab, placement.scale, ar]);

  const calcPos = useCallback(() => {
    const ds = calcSize();
    const cx = sab.x + sab.width  * placement.x;
    const cy = sab.y + sab.height * placement.y;
    return { left: cx - ds.width / 2, top: cy - ds.height / 2, ...ds };
  }, [sab, placement, calcSize]);

  const clamp = useCallback((p, ds) => {
    const hw = (ds.width  / 2) / sab.width;
    const hh = (ds.height / 2) / sab.height;
    return { ...p, x: Math.max(hw, Math.min(1 - hw, p.x)), y: Math.max(hh, Math.min(1 - hh, p.y)) };
  }, [sab]);

  // Mouse events
  const onMD = (e, action) => {
    if (locked) return;
    e.preventDefault(); e.stopPropagation();
    if (action === 'drag')   { setDrag(true);   setDS({ x: e.clientX, y: e.clientY }); }
    if (action === 'resize') { setResize(true); setDS({ x: e.clientX, y: e.clientY }); }
  };

  useEffect(() => {
    const onMM = (e) => {
      if (!isDragging && !isResizing) return;
      const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
      if (isDragging) {
        setPlacement(p => { const ds = calcSize(); return clamp({ ...p, x: p.x + dx / sab.width, y: p.y + dy / sab.height }, ds); });
        setDS({ x: e.clientX, y: e.clientY });
      }
      if (isResizing) {
        const d = Math.sqrt(dx*dx + dy*dy) * (dx+dy > 0 ? 1 : -1) / 200;
        setPlacement(p => ({ ...p, scale: Math.max(DESIGN_CONSTRAINTS.minScale, Math.min(DESIGN_CONSTRAINTS.maxScale, p.scale + d)) }));
        setDS({ x: e.clientX, y: e.clientY });
      }
    };
    const onMU = () => { setDrag(false); setResize(false); };
    if (isDragging || isResizing) { window.addEventListener('mousemove', onMM); window.addEventListener('mouseup', onMU); }
    return () => { window.removeEventListener('mousemove', onMM); window.removeEventListener('mouseup', onMU); };
  }, [isDragging, isResizing, dragStart, sab, calcSize, clamp]);

  // Touch events
  const onTS = (e, action) => {
    const t = e.touches[0];
    onMD({ preventDefault: ()=>{}, stopPropagation: ()=>{}, clientX: t.clientX, clientY: t.clientY }, action);
  };
  useEffect(() => {
    const onTM = (e) => {
      if (!isDragging && !isResizing) return;
      const t = e.touches[0], dx = t.clientX - dragStart.x, dy = t.clientY - dragStart.y;
      if (isDragging) { setPlacement(p => { const ds = calcSize(); return clamp({ ...p, x: p.x + dx / sab.width, y: p.y + dy / sab.height }, ds); }); setDS({ x: t.clientX, y: t.clientY }); }
      if (isResizing) { const d = Math.sqrt(dx*dx+dy*dy)*(dx+dy>0?1:-1)/200; setPlacement(p => ({...p, scale: Math.max(DESIGN_CONSTRAINTS.minScale, Math.min(DESIGN_CONSTRAINTS.maxScale, p.scale+d))})); setDS({x:t.clientX,y:t.clientY}); }
    };
    const onTE = () => { setDrag(false); setResize(false); };
    if (isDragging || isResizing) { window.addEventListener('touchmove', onTM, {passive:false}); window.addEventListener('touchend', onTE); }
    return () => { window.removeEventListener('touchmove', onTM); window.removeEventListener('touchend', onTE); };
  }, [isDragging, isResizing, dragStart, sab, calcSize, clamp]);

  // Keyboard
  useEffect(() => {
    const h = (e) => {
      if (locked) return;
      const step = e.shiftKey ? NUDGE * 4 : NUDGE;
      switch(e.key) {
        case 'ArrowUp':    e.preventDefault(); setPlacement(p => { const ds=calcSize(); return clamp({...p,y:p.y-step},ds); }); break;
        case 'ArrowDown':  e.preventDefault(); setPlacement(p => { const ds=calcSize(); return clamp({...p,y:p.y+step},ds); }); break;
        case 'ArrowLeft':  e.preventDefault(); setPlacement(p => { const ds=calcSize(); return clamp({...p,x:p.x-step},ds); }); break;
        case 'ArrowRight': e.preventDefault(); setPlacement(p => { const ds=calcSize(); return clamp({...p,x:p.x+step},ds); }); break;
        case '+': case '=': setPlacement(p => ({...p,scale:Math.min(DESIGN_CONSTRAINTS.maxScale,p.scale+SCALE_STEP)})); break;
        case '-': case '_': setPlacement(p => ({...p,scale:Math.max(DESIGN_CONSTRAINTS.minScale,p.scale-SCALE_STEP)})); break;
        default: break;
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [locked, calcSize, clamp]);

  const reset    = () => setPlacement({ x: 0.5, y: 0.5, scale: DESIGN_CONSTRAINTS.defaultScale });
  const fitArea  = () => setPlacement(p => ({ ...p, x: 0.5, y: 0.5, scale: 0.90 }));
  const nudge    = (axis, dir) => setPlacement(p => { const ds=calcSize(); return clamp({...p,[axis]:p[axis]+dir*NUDGE},ds); });
  const scaleAdj = (dir) => setPlacement(p => ({...p, scale: Math.max(DESIGN_CONSTRAINTS.minScale, Math.min(DESIGN_CONSTRAINTS.maxScale, p.scale+dir*SCALE_STEP))}));

  // Notify parent
  useEffect(() => {
    if (onPlacementChange) onPlacementChange({ sku, view: activeView, color, placement: {...placement}, productionSpec: { sku, printMethod: sa.printMethod, maxW_in: sa.maxW_in, maxH_in: sa.maxH_in, positionX: placement.x, positionY: placement.y, scale: placement.scale } });
  }, [placement, activeView, color, sku, sa]);

  const handleSave = () => {
    if (onSave) onSave({ sku, view: activeView, color, placement: {...placement}, mockupUrl: getMockupUrl(sku, activeView, color), productionSpec: { sku, printMethod: sa.printMethod, maxW_in: sa.maxW_in, maxH_in: sa.maxH_in, positionX: placement.x, positionY: placement.y, scale: placement.scale } });
  };

  const pos        = calcPos();
  const mockupUrl  = getMockupUrl(sku, activeView, color);
  const pct        = Math.round(placement.scale * 100);
  const cd         = QIKINK_COLORS[color] || { hex: '#ccc', name: color };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div data-testid="mockup-editor" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#fff', fontFamily: 'system-ui,sans-serif', overflow: 'hidden' }}>

      {/* TOP HEADER */}
      <header style={{ height: 54, minHeight: 54, display: 'flex', alignItems: 'center', padding: '0 16px', background: '#fff', borderBottom: '1px solid #eee', gap: 10, flexShrink: 0, zIndex: 10 }}>
        <button onClick={onBack} data-testid="editor-back-btn"
          style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'none', cursor:'pointer', color:'#333', fontSize:13, fontWeight:500, padding:'6px 10px', borderRadius:4 }}
          onMouseEnter={e => e.currentTarget.style.background='#f5f5f5'}
          onMouseLeave={e => e.currentTarget.style.background='none'}
        ><ChevronLeft size={15}/> Back</button>

        <div style={{ width:1, height:24, background:'#eee' }} />

        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#111', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {tmpl.label}
          </p>
          <p style={{ margin:0, fontSize:11, color:'#aaa' }}>
            {activeView.replace('_',' ')} · {cd.name} · {pct}%
          </p>
        </div>

        {/* View tabs */}
        <div style={{ display:'flex', background:'#f4f4f4', borderRadius:6, padding:2, gap:2 }}>
          {tmpl.views.slice(0,4).map(v => (
            <button key={v.key} onClick={() => setView(v.key)} data-testid={`view-${v.key}-btn`}
              style={{ padding:'4px 11px', fontSize:11.5, fontWeight: activeView===v.key ? 600 : 400, background: activeView===v.key ? '#fff' : 'transparent', border:'none', borderRadius:4, cursor:'pointer', color: activeView===v.key ? '#111' : '#888', boxShadow: activeView===v.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition:'all 0.1s' }}>
              {v.label}
            </button>
          ))}
        </div>

        <div style={{ width:1, height:24, background:'#eee' }} />

        <button onClick={() => setLocked(l => !l)} title={locked ? 'Unlock' : 'Lock position'}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 10px', border:'none', borderRadius:4, cursor:'pointer', background: locked ? '#fff3e8' : 'none', color: locked ? '#FF6700' : '#888', fontSize:12, fontWeight:500 }}>
          {locked ? <Lock size={14}/> : <Unlock size={14}/>}
        </button>

        <button onClick={handleSave} data-testid="save-placement-btn"
          style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 18px', fontSize:13, fontWeight:600, background:'#FF6700', color:'#fff', border:'none', borderRadius:5, cursor:'pointer', boxShadow:'0 1px 4px rgba(255,103,0,0.3)', transition:'background 0.12s' }}
          onMouseEnter={e => e.currentTarget.style.background='#e55e00'}
          onMouseLeave={e => e.currentTarget.style.background='#FF6700'}
        ><Save size={13}/> Save & Continue</button>
      </header>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* LEFT SIDEBAR */}
        <nav style={{ width:52, minWidth:52, background:'#1a1a1a', display:'flex', flexDirection:'column', alignItems:'center', paddingTop:10, gap:1, flexShrink:0 }}>
          <SidebarBtn icon={Layers}    label="Views"   active={panel==='views'}   onClick={() => setPanel('views')} />
          <SidebarBtn icon={Palette}   label="Colors"  active={panel==='colors'}  onClick={() => setPanel('colors')} />
          <SidebarBtn icon={Maximize2} label="Size"    active={panel==='size'}    onClick={() => setPanel('size')} />
          <SidebarBtn icon={Grid3x3}   label="Presets" active={panel==='presets'} onClick={() => setPanel('presets')} />
          <SidebarBtn icon={Settings}  label="Spec"    active={panel==='spec'}    onClick={() => setPanel('spec')} />
          <div style={{ flex:1 }} />
          <SidebarBtn icon={showGuide ? Eye : EyeOff} label="Guide" accent onClick={() => setGuide(g => !g)} />
          <SidebarBtn icon={RefreshCw} label="Reset" onClick={reset} />
          <div style={{ height:8 }} />
        </nav>

        {/* SECONDARY PANEL */}
        <AnimatePresence mode="wait">
          <motion.div key={panel}
            initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-6 }}
            transition={{ duration:0.1 }}
            style={{ width:200, minWidth:200, background:'#fff', borderRight:'1px solid #eee', padding:16, overflowY:'auto', flexShrink:0 }}
          >
            {panel === 'views' && (
              <div>
                <Label>Placement View</Label>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {tmpl.views.map(v => {
                    const src = getMockupUrl(sku, v.key, color) || v.fallback;
                    const active = activeView === v.key;
                    return (
                      <button key={v.key} onClick={() => setView(v.key)}
                        style={{ border: active ? '2px solid #FF6700' : '2px solid #e8e8e8', borderRadius:8, overflow:'hidden', cursor:'pointer', padding:0, background:'#f8f8f8', boxShadow: active ? '0 0 0 3px rgba(255,103,0,0.12)' : 'none', transition:'all 0.1s', position:'relative' }}>
                        <img src={src} alt={v.label} style={{ width:'100%', aspectRatio:'291/374', objectFit:'cover', display:'block' }} onError={e => { e.target.style.display='none'; }} draggable={false} />
                        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'5px 8px', background: active ? '#FF6700' : 'rgba(0,0,0,0.45)' }}>
                          <span style={{ fontSize:10, fontWeight:600, color:'#fff', textTransform:'uppercase', letterSpacing:'0.05em' }}>{v.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {panel === 'colors' && (
              <div>
                <Label>Garment Color</Label>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {tmpl.colors.map(c => {
                    const cd2 = QIKINK_COLORS[c] || { hex:'#ccc', name:c };
                    const sel = color === c;
                    return (
                      <button key={c} onClick={() => setColor(c)} data-testid={`color-${c}-btn`}
                        style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 9px', borderRadius:6, border: sel ? '2px solid #FF6700' : '1.5px solid #e8e8e8', cursor:'pointer', background: sel ? '#fff8f3' : '#fff', transition:'all 0.08s' }}
                        onMouseEnter={e => { if(!sel) e.currentTarget.style.borderColor='#ccc'; }}
                        onMouseLeave={e => { if(!sel) e.currentTarget.style.borderColor='#e8e8e8'; }}
                      >
                        <div style={{ width:22, height:22, borderRadius:'50%', background:cd2.hex, flexShrink:0, border:`1.5px solid ${c==='white'?'#ccc':cd2.hex}`, boxShadow: sel ? '0 0 0 2px rgba(255,103,0,0.25)' : 'inset 0 0 0 1px rgba(0,0,0,0.06)' }} />
                        <span style={{ fontSize:12.5, fontWeight: sel?600:400, color:'#222' }}>{cd2.name}</span>
                        {sel && <div style={{ marginLeft:'auto', width:5, height:5, borderRadius:'50%', background:'#FF6700' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {panel === 'size' && (
              <div>
                <Label>Design Size</Label>
                <div style={{ textAlign:'center', margin:'16px 0' }}>
                  <span style={{ fontSize:42, fontWeight:200, color:'#111' }}>{pct}</span>
                  <span style={{ fontSize:14, color:'#aaa', marginLeft:2 }}>%</span>
                </div>
                <div style={{ height:5, borderRadius:3, background:'#eee', marginBottom:10, position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', inset:'0 auto 0 0', borderRadius:3, background:'#FF6700', width:`${pct}%`, transition:'width 0.1s' }} />
                </div>
                <div style={{ display:'flex', gap:6, marginBottom:20 }}>
                  <CtrlBtn onClick={() => scaleAdj(-1)} icon={<ZoomOut size={15} color="#555"/>} />
                  <CtrlBtn onClick={() => scaleAdj(1)}  icon={<ZoomIn  size={15} color="#555"/>} />
                </div>
                <Label>Nudge</Label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:3, width:108, margin:'8px auto 16px' }}>
                  <div/><CtrlBtn onClick={() => nudge('y',-1)} icon={<ArrowUp size={13} color="#555"/>}/><div/>
                  <CtrlBtn onClick={() => nudge('x',-1)} icon={<ArrowLeftIcon size={13} color="#555"/>}/>
                  <CtrlBtn onClick={reset} icon={<Crosshair size={13} color="#fff"/>} style={{ background:'#FF6700', border:'none' }}/>
                  <CtrlBtn onClick={() => nudge('x',1)} icon={<ArrowRightIcon size={13} color="#555"/>}/>
                  <div/><CtrlBtn onClick={() => nudge('y',1)} icon={<ArrowDown size={13} color="#555"/>}/><div/>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <CoordChip label="X" value={`${Math.round(placement.x*100)}%`}/>
                  <CoordChip label="Y" value={`${Math.round(placement.y*100)}%`}/>
                </div>
              </div>
            )}

            {panel === 'presets' && (
              <div>
                <Label>Quick Presets</Label>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {[
                    { label:'Centre — Medium',   x:0.5,  y:0.5,  scale:0.55 },
                    { label:'Centre — Large',    x:0.5,  y:0.5,  scale:0.85 },
                    { label:'Chest — Small',     x:0.5,  y:0.32, scale:0.28 },
                    { label:'Full Print Area',   x:0.5,  y:0.5,  scale:0.95 },
                    { label:'Left Chest Pocket', x:0.30, y:0.28, scale:0.25 },
                  ].map(p => (
                    <button key={p.label} onClick={() => setPlacement(p)}
                      style={{ padding:'9px 10px', textAlign:'left', fontSize:12.5, color:'#333', background:'#f8f8f8', border:'1px solid transparent', borderRadius:6, cursor:'pointer', transition:'all 0.08s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='#FF6700'; e.currentTarget.style.background='#fff8f3'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.background='#f8f8f8'; }}
                    >{p.label}</button>
                  ))}
                </div>
                <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:5 }}>
                  <Label>Actions</Label>
                  <FullBtn onClick={reset}   icon={<RotateCcw size={13} color="#555"/>} label="Reset to Centre"/>
                  <FullBtn onClick={fitArea} icon={<Maximize2 size={13} color="#555"/>} label="Fit to Print Area"/>
                </div>
              </div>
            )}

            {panel === 'spec' && (
              <div>
                <Label>Print Spec</Label>
                {[
                  ['SKU',         sku],
                  ['Print',       (sa.printMethod||'dtf').toUpperCase()],
                  ['Max Width',   `${sa.maxW_in||12}"`],
                  ['Max Height',  `${sa.maxH_in||14}"`],
                  ['View',        activeView.replace('_',' ')],
                  ['Colour',      cd.name],
                  ['Scale',       `${pct}%`],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #f0f0f0' }}>
                    <span style={{ fontSize:10.5, color:'#aaa', textTransform:'uppercase', letterSpacing:'0.04em' }}>{k}</span>
                    <span style={{ fontSize:12, fontWeight:500, color:'#222' }}>{v}</span>
                  </div>
                ))}
                <div style={{ marginTop:12, padding:10, background:'#fff8f3', borderRadius:6, border:'1px solid #ffe0cc' }}>
                  <p style={{ margin:0, fontSize:11, color:'#c45a00', lineHeight:1.5 }}>Design must stay within the dashed boundary. Minimum 150 DPI at final print size.</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* MAIN CANVAS */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#F4F4F4' }}>
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:28 }}>

            <div ref={containerRef} data-testid="mockup-canvas"
              style={{
                position:'relative', width:'100%', maxWidth:420,
                aspectRatio: CANVAS_RATIO,   // 291÷373.606 — Qikink's exact ratio
                background:'#fff', borderRadius:10, overflow:'hidden',
                boxShadow:'0 6px 32px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
                cursor: locked ? 'default' : 'crosshair',
              }}>

              {/* Garment image */}
              {mockupUrl
                ? <img src={mockupUrl} alt="Garment" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none', userSelect:'none', display:'block' }} draggable={false} onError={e => { e.target.style.display='none'; }} />
                : <div style={{ width:'100%', height:'100%', background: cd.hex, opacity:0.75 }} />
              }

              {/* Print area guide */}
              <AnimatePresence>
                {showGuide && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    data-testid="print-safe-area"
                    style={{
                      position:'absolute', pointerEvents:'none',
                      left:`${sa.x*100}%`, top:`${sa.y*100}%`,
                      width:`${sa.width*100}%`, height:`${sa.height*100}%`,
                      border:'1.5px dashed rgba(255,103,0,0.6)', borderRadius:2,
                    }}>
                    {[
                      {top:-2,left:-2,borderTop:'2px solid #FF6700',borderLeft:'2px solid #FF6700'},
                      {top:-2,right:-2,borderTop:'2px solid #FF6700',borderRight:'2px solid #FF6700'},
                      {bottom:-2,left:-2,borderBottom:'2px solid #FF6700',borderLeft:'2px solid #FF6700'},
                      {bottom:-2,right:-2,borderBottom:'2px solid #FF6700',borderRight:'2px solid #FF6700'},
                    ].map((s,i) => <div key={i} style={{ position:'absolute', width:9, height:9, ...s }} />)}
                    {/* Centre crosshair */}
                    <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:16, height:16, opacity:0.3 }}>
                      <div style={{ position:'absolute', top:'50%', left:0, right:0, height:1, background:'#FF6700' }} />
                      <div style={{ position:'absolute', left:'50%', top:0, bottom:0, width:1, background:'#FF6700' }} />
                    </div>
                    {/* Label */}
                    <div style={{ position:'absolute', top:-20, left:'50%', transform:'translateX(-50%)', whiteSpace:'nowrap' }}>
                      <span style={{ fontSize:8.5, fontWeight:600, letterSpacing:'0.08em', padding:'2px 6px', borderRadius:3, background:'rgba(255,103,0,0.1)', color:'#FF6700', fontFamily:'monospace' }}>
                        PRINT AREA · {sa.maxW_in}" × {sa.maxH_in}"
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Design */}
              {designImage && containerSize.width > 0 && (
                <motion.div data-testid="design-element"
                  style={{ position:'absolute', userSelect:'none', cursor: locked ? 'default' : isDragging ? 'grabbing' : 'grab', left:pos.left, top:pos.top, width:pos.width, height:pos.height }}
                  onMouseDown={e => onMD(e,'drag')} onTouchStart={e => onTS(e,'drag')}
                >
                  <img src={designImage} alt="Design" style={{ width:'100%', height:'100%', objectFit:'contain', pointerEvents:'none', userSelect:'none' }} draggable={false} />
                  <div style={{ position:'absolute', inset:0, borderRadius:2, pointerEvents:'none', border:`1.5px solid ${locked ? 'rgba(255,103,0,0.3)' : isDragging ? '#FF6700' : '#2196F3'}`, boxShadow: isDragging ? '0 0 10px rgba(255,103,0,0.2)' : '0 0 6px rgba(33,150,243,0.1)', transition:'border-color 0.1s' }} />
                  {!locked && ['nw','ne','sw','se'].map(c => (
                    <div key={c} data-testid={`resize-handle-${c}`}
                      onMouseDown={e => onMD(e,'resize')} onTouchStart={e => onTS(e,'resize')}
                      style={{ position:'absolute', width:11, height:11, background:'#FF6700', border:'2px solid #fff', borderRadius:2, cursor:(c==='nw'||c==='se')?'nwse-resize':'nesw-resize', top:c.includes('n')?-5.5:'auto', bottom:c.includes('s')?-5.5:'auto', left:c.includes('w')?-5.5:'auto', right:c.includes('e')?-5.5:'auto', boxShadow:'0 1px 4px rgba(0,0,0,0.2)', transition:'transform 0.08s', zIndex:10 }}
                      onMouseEnter={e => e.currentTarget.style.transform='scale(1.4)'}
                      onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                    />
                  ))}
                </motion.div>
              )}

              {locked && (
                <div style={{ position:'absolute', top:10, right:10, background:'rgba(255,103,0,0.9)', borderRadius:4, padding:'3px 7px', display:'flex', alignItems:'center', gap:4 }}>
                  <Lock size={10} color="#fff"/>
                  <span style={{ fontSize:10, color:'#fff', fontWeight:600, letterSpacing:'0.04em' }}>LOCKED</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ padding:'7px 18px', borderTop:'1px solid #eee', background:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <span style={{ fontSize:11, color:'#bbb' }}>
              {locked ? '🔒 Locked — click unlock to edit' : 'Drag · Corner handles to resize · Arrow keys to nudge'}
            </span>
            <span style={{ fontSize:11, color:'#ccc', fontFamily:'monospace' }}>
              {sku} · {activeView} · {pct}% · ({Math.round(placement.x*100)},{Math.round(placement.y*100)})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
