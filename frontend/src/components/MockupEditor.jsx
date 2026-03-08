import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw, Maximize2, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, Move, Crosshair, ArrowUp, ArrowDown,
  ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon,
  Minus, Plus, Eye, EyeOff, Palette, Layers, Settings,
  Image as ImageIcon, Grid3x3, RefreshCw, Save
} from 'lucide-react';
import { GARMENT_COLORS } from '@/config/printPresets';

// ─── Print-safe areas (internal, not exposed to creators) ──────────────────────
export const PRINT_SAFE_AREAS = Object.freeze({
  tshirt: {
    front: { x: 0.26, y: 0.20, width: 0.48, height: 0.52, _maxWidthCm: 38, _maxHeightCm: 48, _verticalOffsetCm: 7, _printMethod: 'dtf' },
    back:  { x: 0.26, y: 0.17, width: 0.48, height: 0.56, _maxWidthCm: 38, _maxHeightCm: 48, _printMethod: 'dtf' }
  },
  hoodie: {
    front: { x: 0.27, y: 0.22, width: 0.46, height: 0.50, _maxWidthCm: 38, _maxHeightCm: 48, _printMethod: 'dtf' },
    back:  { x: 0.27, y: 0.18, width: 0.46, height: 0.55, _maxWidthCm: 38, _maxHeightCm: 48, _printMethod: 'dtf' }
  },
  oversized_tshirt: {
    front: { x: 0.23, y: 0.16, width: 0.54, height: 0.58, _maxWidthCm: 40, _maxHeightCm: 52, _printMethod: 'dtf' },
    back:  { x: 0.23, y: 0.14, width: 0.54, height: 0.60, _maxWidthCm: 40, _maxHeightCm: 52, _printMethod: 'dtf' }
  },
  bomber_jacket: {
    front: { x: 0.28, y: 0.24, width: 0.44, height: 0.46, _maxWidthCm: 30, _maxHeightCm: 35, _printMethod: 'dtf' },
    back:  { x: 0.25, y: 0.18, width: 0.50, height: 0.54, _maxWidthCm: 36, _maxHeightCm: 42, _printMethod: 'dtf' }
  },
  sweatshirt: {
    front: { x: 0.27, y: 0.22, width: 0.46, height: 0.50, _maxWidthCm: 36, _maxHeightCm: 44, _printMethod: 'dtf' },
    back:  { x: 0.27, y: 0.18, width: 0.46, height: 0.55, _maxWidthCm: 36, _maxHeightCm: 44, _printMethod: 'dtf' }
  }
});

// ─── Mockup images ──────────────────────────────────────────────────────────────
const MOCKUP_IMAGES = {
  tshirt: {
    front: { white: '/mockups/tshirt-whitefront.jpg', black: '/mockups/tshirt-blackfront.jpg', yellow: '/mockups/tshirt-yellow.jpg', grey: '/mockups/Grey-Front.jpg' },
    back:  { white: '/mockups/tshirt-whitebackog.png', black: '/mockups/tshirt-blackback.jpg' }
  },
  hoodie: {
    front: { white: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800', black: 'https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=800', grey: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800' },
    back:  { white: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800', black: 'https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=800' }
  },
  oversized_tshirt: {
    front: { white: 'https://images.unsplash.com/photo-1627225793904-a2f900a6e4cf?w=800', black: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800', grey: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800' },
    back:  { white: 'https://images.unsplash.com/photo-1627225793904-a2f900a6e4cf?w=800', black: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800' }
  },
  bomber_jacket: {
    front: { black: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800', white: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800', grey: 'https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=800' },
    back:  { black: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800', white: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800' }
  },
  sweatshirt: {
    front: { white: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800', black: 'https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=800', grey: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800' },
    back:  { white: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800', black: 'https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=800' }
  }
};

const DESIGN_CONSTRAINTS = { minScale: 0.15, maxScale: 1.0, defaultScale: 0.6 };
const PRODUCT_LABELS = { tshirt: 'T-Shirt', hoodie: 'Hoodie', oversized_tshirt: 'Oversized Tee', bomber_jacket: 'Bomber Jacket', sweatshirt: 'Sweatshirt' };
const NUDGE_STEP = 0.02;
const SCALE_STEP = 0.05;

// ─── Sidebar icon button ────────────────────────────────────────────────────────
const SidebarBtn = ({ icon: Icon, label, active, onClick, accent }) => (
  <button
    onClick={onClick}
    title={label}
    style={{
      width: '100%', padding: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      background: active ? 'rgba(255,102,83,0.12)' : 'transparent', border: 'none', cursor: 'pointer',
      borderLeft: active ? '3px solid #FF6653' : '3px solid transparent',
      transition: 'all 0.15s ease',
    }}
  >
    <Icon size={18} style={{ color: active ? '#FF6653' : accent ? '#FF6653' : 'rgba(255,255,255,0.55)' }} />
    <span style={{ fontSize: 9, fontFamily: "'Open Sans', sans-serif", color: active ? '#FF6653' : 'rgba(255,255,255,0.4)', letterSpacing: '0.03em', fontWeight: active ? 600 : 400 }}>
      {label}
    </span>
  </button>
);

// ═══════════════════════════════════════════════════════════════════════════════
export default function MockupEditor({
  designImage,
  productType = 'tshirt',
  initialPlacement = null,
  onPlacementChange,
  onSave,
  onBack
}) {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [activeView, setActiveView] = useState('front');
  const [selectedColor, setSelectedColor] = useState(() => {
    const colors = Object.keys(MOCKUP_IMAGES[productType]?.front || {});
    return colors.includes('black') ? 'black' : colors[0] || 'white';
  });
  const [placement, setPlacement] = useState(initialPlacement || { x: 0.5, y: 0.5, scale: DESIGN_CONSTRAINTS.defaultScale });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [designAspectRatio, setDesignAspectRatio] = useState(1);
  const [showSafeArea, setShowSafeArea] = useState(true);
  const [activePanel, setActivePanel] = useState('views'); // views | colors | size

  // Load design image aspect ratio
  useEffect(() => {
    if (!designImage) return;
    const img = new Image();
    img.onload = () => { if (img.height > 0) setDesignAspectRatio(img.width / img.height); };
    img.src = designImage;
  }, [designImage]);

  // Container size tracking
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const safeArea = (PRINT_SAFE_AREAS[productType]?.[activeView]) || PRINT_SAFE_AREAS.tshirt.front;
  const safeAreaBounds = {
    x: containerSize.width * safeArea.x, y: containerSize.height * safeArea.y,
    width: containerSize.width * safeArea.width, height: containerSize.height * safeArea.height
  };

  const calculateDesignSize = useCallback(() => {
    const maxW = safeAreaBounds.width * placement.scale;
    const maxH = safeAreaBounds.height * placement.scale;
    let w, h;
    if (designAspectRatio > maxW / maxH) { w = maxW; h = w / designAspectRatio; }
    else { h = maxH; w = h * designAspectRatio; }
    return { width: w, height: h };
  }, [safeAreaBounds, placement.scale, designAspectRatio]);

  const calculateDesignPosition = useCallback(() => {
    const ds = calculateDesignSize();
    const cx = safeAreaBounds.x + safeAreaBounds.width * placement.x;
    const cy = safeAreaBounds.y + safeAreaBounds.height * placement.y;
    return { left: cx - ds.width / 2, top: cy - ds.height / 2, width: ds.width, height: ds.height };
  }, [safeAreaBounds, placement, calculateDesignSize]);

  // ── Mouse drag/resize ──────────────────────────────────────────────────────
  const handleMouseDown = (e, action) => {
    e.preventDefault(); e.stopPropagation();
    if (action === 'drag') { setIsDragging(true); setDragStart({ x: e.clientX, y: e.clientY }); }
    else if (action === 'resize') { setIsResizing(true); setDragStart({ x: e.clientX, y: e.clientY }); }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging && !isResizing) return;
      const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
      if (isDragging) {
        const rx = dx / safeAreaBounds.width, ry = dy / safeAreaBounds.height;
        setPlacement(p => {
          const ds = calculateDesignSize();
          const hw = (ds.width / 2) / safeAreaBounds.width, hh = (ds.height / 2) / safeAreaBounds.height;
          return { ...p, x: Math.max(hw, Math.min(1 - hw, p.x + rx)), y: Math.max(hh, Math.min(1 - hh, p.y + ry)) };
        });
        setDragStart({ x: e.clientX, y: e.clientY });
      }
      if (isResizing) {
        const diag = Math.sqrt(dx * dx + dy * dy) * (dx + dy > 0 ? 1 : -1) / 200;
        setPlacement(p => ({ ...p, scale: Math.max(DESIGN_CONSTRAINTS.minScale, Math.min(DESIGN_CONSTRAINTS.maxScale, p.scale + diag)) }));
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };
    const handleMouseUp = () => { setIsDragging(false); setIsResizing(false); };
    if (isDragging || isResizing) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging, isResizing, dragStart, safeAreaBounds, calculateDesignSize]);

  // ── Touch ──────────────────────────────────────────────────────────────────
  const handleTouchStart = (e, action) => {
    const t = e.touches[0];
    handleMouseDown({ preventDefault: () => {}, stopPropagation: () => {}, clientX: t.clientX, clientY: t.clientY }, action);
  };
  useEffect(() => {
    const handleTouchMove = (e) => {
      if (!isDragging && !isResizing) return;
      const t = e.touches[0], dx = t.clientX - dragStart.x, dy = t.clientY - dragStart.y;
      if (isDragging) {
        setPlacement(p => {
          const ds = calculateDesignSize();
          const hw = (ds.width / 2) / safeAreaBounds.width, hh = (ds.height / 2) / safeAreaBounds.height;
          return { ...p, x: Math.max(hw, Math.min(1 - hw, p.x + dx / safeAreaBounds.width)), y: Math.max(hh, Math.min(1 - hh, p.y + dy / safeAreaBounds.height)) };
        });
        setDragStart({ x: t.clientX, y: t.clientY });
      }
      if (isResizing) {
        const diag = Math.sqrt(dx * dx + dy * dy) * (dx + dy > 0 ? 1 : -1) / 200;
        setPlacement(p => ({ ...p, scale: Math.max(DESIGN_CONSTRAINTS.minScale, Math.min(DESIGN_CONSTRAINTS.maxScale, p.scale + diag)) }));
        setDragStart({ x: t.clientX, y: t.clientY });
      }
    };
    const handleTouchEnd = () => { setIsDragging(false); setIsResizing(false); };
    if (isDragging || isResizing) { window.addEventListener('touchmove', handleTouchMove, { passive: false }); window.addEventListener('touchend', handleTouchEnd); }
    return () => { window.removeEventListener('touchmove', handleTouchMove); window.removeEventListener('touchend', handleTouchEnd); };
  }, [isDragging, isResizing, dragStart, safeAreaBounds, calculateDesignSize]);

  // ── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      const step = e.shiftKey ? NUDGE_STEP * 3 : NUDGE_STEP;
      switch (e.key) {
        case 'ArrowUp':    e.preventDefault(); setPlacement(p => ({ ...p, y: Math.max(0, p.y - step) })); break;
        case 'ArrowDown':  e.preventDefault(); setPlacement(p => ({ ...p, y: Math.min(1, p.y + step) })); break;
        case 'ArrowLeft':  e.preventDefault(); setPlacement(p => ({ ...p, x: Math.max(0, p.x - step) })); break;
        case 'ArrowRight': e.preventDefault(); setPlacement(p => ({ ...p, x: Math.min(1, p.x + step) })); break;
        case '+': case '=': e.preventDefault(); setPlacement(p => ({ ...p, scale: Math.min(DESIGN_CONSTRAINTS.maxScale, p.scale + SCALE_STEP) })); break;
        case '-': case '_': e.preventDefault(); setPlacement(p => ({ ...p, scale: Math.max(DESIGN_CONSTRAINTS.minScale, p.scale - SCALE_STEP) })); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleReset = () => setPlacement({ x: 0.5, y: 0.5, scale: DESIGN_CONSTRAINTS.defaultScale });
  const handleFitToArea = () => setPlacement(p => ({ ...p, x: 0.5, y: 0.5, scale: 0.9 }));
  const nudge = (axis, dir) => setPlacement(p => ({ ...p, [axis]: Math.max(0, Math.min(1, p[axis] + dir * NUDGE_STEP)) }));
  const adjustScale = (dir) => setPlacement(p => ({ ...p, scale: Math.max(DESIGN_CONSTRAINTS.minScale, Math.min(DESIGN_CONSTRAINTS.maxScale, p.scale + dir * SCALE_STEP)) }));

  // Notify parent
  useEffect(() => {
    if (onPlacementChange) {
      onPlacementChange({ view: activeView, color: selectedColor, placement: { ...placement }, _metadata: { productType, printMethod: safeArea._printMethod, maxWidthCm: safeArea._maxWidthCm, maxHeightCm: safeArea._maxHeightCm } });
    }
  }, [placement, activeView, selectedColor, productType, safeArea]);

  const handleSave = () => {
    if (onSave) {
      onSave({ view: activeView, color: selectedColor, placement: { ...placement }, _productionSpec: { productType, printMethod: safeArea._printMethod, maxWidthCm: safeArea._maxWidthCm, maxHeightCm: safeArea._maxHeightCm, finalScale: placement.scale, positionX: placement.x, positionY: placement.y } });
    }
  };

  const designPos = calculateDesignPosition();
  const mockupUrl = MOCKUP_IMAGES[productType]?.[activeView]?.[selectedColor] || MOCKUP_IMAGES.tshirt.front.white;
  const availableColors = Object.keys(MOCKUP_IMAGES[productType]?.[activeView] || {});
  const productLabel = PRODUCT_LABELS[productType] || 'Product';
  const scalePercent = Math.round(placement.scale * 100);

  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#fff', fontFamily: "'Open Sans', sans-serif", overflow: 'hidden' }}
         data-testid="mockup-editor">

      {/* ── TOP HEADER BAR (Printrove-style) ──────────────────────────────── */}
      <header style={{
        height: 56, minHeight: 56, display: 'flex', alignItems: 'center',
        padding: '0 20px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)',
        zIndex: 10, gap: 12, flexShrink: 0,
      }}>
        {/* Back */}
        <button onClick={onBack} data-testid="editor-back-btn"
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#263238', fontSize: 13, fontFamily: "'Open Sans', sans-serif", fontWeight: 500, padding: '6px 12px', borderRadius: 4, transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <ChevronLeft size={16} />
          Back
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'rgba(0,0,0,0.08)' }} />

        {/* Product label */}
        <h6 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#263238', fontFamily: "'Open Sans', sans-serif", letterSpacing: '-0.02em' }}>
          {productLabel} — Placement Editor
        </h6>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* View toggle */}
        <div style={{ display: 'flex', background: '#F2F5F8', borderRadius: 6, padding: 2, gap: 2 }}>
          {['front', 'back'].map(view => (
            <button key={view} onClick={() => setActiveView(view)}
              data-testid={`view-${view}-btn`}
              style={{
                padding: '5px 14px', fontSize: 12, fontWeight: activeView === view ? 600 : 400,
                background: activeView === view ? '#fff' : 'transparent',
                border: 'none', borderRadius: 4, cursor: 'pointer',
                color: activeView === view ? '#263238' : '#90A4AE',
                boxShadow: activeView === view ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                fontFamily: "'Open Sans', sans-serif", textTransform: 'capitalize',
                transition: 'all 0.15s',
              }}>
              {view}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'rgba(0,0,0,0.08)' }} />

        {/* Save button */}
        <button onClick={handleSave} data-testid="save-placement-btn"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 20px', fontSize: 13, fontWeight: 600,
            background: '#FF6653', color: '#fff', border: 'none',
            borderRadius: 4, cursor: 'pointer', fontFamily: "'Open Sans', sans-serif",
            boxShadow: '0 1px 3px rgba(255,102,83,0.3)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#e55a48'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(255,102,83,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FF6653'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(255,102,83,0.3)'; }}
        >
          <Save size={14} />
          Save & Continue
        </button>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── LEFT SIDEBAR (Printrove-style dark nav) ──────────────────────── */}
        <nav style={{
          width: 56, minWidth: 56, background: '#202020', display: 'flex', flexDirection: 'column',
          alignItems: 'center', paddingTop: 12, gap: 2, flexShrink: 0, overflowY: 'auto',
          borderRight: '1px solid rgba(0,0,0,0.15)',
        }}>
          <SidebarBtn icon={Layers} label="Views" active={activePanel === 'views'} onClick={() => setActivePanel('views')} />
          <SidebarBtn icon={Palette} label="Colors" active={activePanel === 'colors'} onClick={() => setActivePanel('colors')} />
          <SidebarBtn icon={Maximize2} label="Size" active={activePanel === 'size'} onClick={() => setActivePanel('size')} />
          <SidebarBtn icon={Grid3x3} label="Presets" active={activePanel === 'presets'} onClick={() => setActivePanel('presets')} />

          <div style={{ flex: 1 }} />

          <SidebarBtn icon={showSafeArea ? Eye : EyeOff} label="Guide" accent onClick={() => setShowSafeArea(s => !s)} />
          <SidebarBtn icon={RefreshCw} label="Reset" onClick={handleReset} />

          <div style={{ height: 8 }} />
        </nav>

        {/* ── SECONDARY PANEL (context-dependent, like Printrove's expanded sidebar) ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePanel}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            style={{
              width: 200, minWidth: 200, background: '#fff', borderRight: '1px solid rgba(0,0,0,0.08)',
              padding: 16, overflowY: 'auto', flexShrink: 0,
            }}
          >
            {/* VIEWS panel */}
            {activePanel === 'views' && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#90A4AE', margin: '0 0 12px' }}>Front & Back</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {['front', 'back'].map(view => {
                    const src = MOCKUP_IMAGES[productType]?.[view]?.[selectedColor] || MOCKUP_IMAGES.tshirt.front.white;
                    const isActive = activeView === view;
                    return (
                      <button key={view} onClick={() => setActiveView(view)}
                        style={{
                          border: isActive ? '2px solid #FF6653' : '2px solid #E0E0E0', borderRadius: 8,
                          overflow: 'hidden', cursor: 'pointer', padding: 0, background: '#F2F5F8',
                          boxShadow: isActive ? '0 0 0 3px rgba(255,102,83,0.15)' : 'none',
                          transition: 'all 0.15s', position: 'relative',
                        }}>
                        <img src={src} alt={`${view} view`} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} draggable={false} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 8px', background: isActive ? '#FF6653' : 'rgba(0,0,0,0.5)', }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', textTransform: 'capitalize', fontFamily: "'Open Sans', sans-serif" }}>{view}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* COLORS panel */}
            {activePanel === 'colors' && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#90A4AE', margin: '0 0 12px' }}>Garment Color</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {availableColors.map(color => {
                    const isSelected = selectedColor === color;
                    const hex = GARMENT_COLORS[color]?.hex || '#fff';
                    const name = GARMENT_COLORS[color]?.name || color;
                    return (
                      <button key={color} onClick={() => setSelectedColor(color)} data-testid={`color-${color}-btn`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6,
                          border: isSelected ? '2px solid #FF6653' : '1px solid #E0E0E0', cursor: 'pointer',
                          background: isSelected ? 'rgba(255,102,83,0.05)' : '#fff',
                          transition: 'all 0.12s',
                        }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', background: hex,
                          border: `2px solid ${color === 'white' ? '#E0E0E0' : hex}`,
                          boxShadow: isSelected ? '0 0 0 2px rgba(255,102,83,0.25)' : 'inset 0 0 0 1px rgba(0,0,0,0.05)',
                          flexShrink: 0,
                        }} />
                        <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: '#263238', fontFamily: "'Open Sans', sans-serif", textTransform: 'capitalize' }}>{name}</span>
                        {isSelected && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#FF6653' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SIZE panel */}
            {activePanel === 'size' && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#90A4AE', margin: '0 0 16px' }}>Design Size</p>

                {/* Scale display */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <span style={{ fontSize: 36, fontWeight: 300, color: '#263238', fontFamily: "'Open Sans', sans-serif" }}>{scalePercent}</span>
                  <span style={{ fontSize: 14, color: '#90A4AE', marginLeft: 2 }}>%</span>
                </div>

                {/* Scale bar */}
                <div style={{ position: 'relative', height: 6, borderRadius: 3, background: '#E0E0E0', marginBottom: 8 }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: 3, background: '#FF6653', width: `${scalePercent}%`, transition: 'width 0.1s' }} />
                </div>

                {/* +/- buttons */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  <button onClick={() => adjustScale(-1)}
                    style={{ flex: 1, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px solid #E0E0E0', background: '#F2F5F8', cursor: 'pointer' }}>
                    <ZoomOut size={16} color="#546E7A" />
                  </button>
                  <button onClick={() => adjustScale(1)}
                    style={{ flex: 1, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px solid #E0E0E0', background: '#F2F5F8', cursor: 'pointer' }}>
                    <ZoomIn size={16} color="#546E7A" />
                  </button>
                </div>

                {/* Position */}
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#90A4AE', margin: '0 0 10px' }}>Position</p>

                {/* Nudge pad */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, width: 120, margin: '0 auto 16px' }}>
                  <div />
                  <button onClick={() => nudge('y', -1)} style={{ ...nudgeBtnStyle }}><ArrowUp size={14} color="#546E7A" /></button>
                  <div />
                  <button onClick={() => nudge('x', -1)} style={{ ...nudgeBtnStyle }}><ArrowLeftIcon size={14} color="#546E7A" /></button>
                  <button onClick={handleReset} data-testid="reset-position-btn" style={{ ...nudgeBtnStyle, background: '#FF6653', border: 'none' }}><Crosshair size={14} color="#fff" /></button>
                  <button onClick={() => nudge('x', 1)} style={{ ...nudgeBtnStyle }}><ArrowRightIcon size={14} color="#546E7A" /></button>
                  <div />
                  <button onClick={() => nudge('y', 1)} style={{ ...nudgeBtnStyle }}><ArrowDown size={14} color="#546E7A" /></button>
                  <div />
                </div>

                {/* Coords */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, background: '#F2F5F8', borderRadius: 6, padding: '6px 10px' }}>
                    <span style={{ fontSize: 9, color: '#90A4AE', fontWeight: 600 }}>X</span>
                    <span style={{ fontSize: 12, color: '#263238', marginLeft: 4, fontFamily: 'monospace' }}>{Math.round(placement.x * 100)}%</span>
                  </div>
                  <div style={{ flex: 1, background: '#F2F5F8', borderRadius: 6, padding: '6px 10px' }}>
                    <span style={{ fontSize: 9, color: '#90A4AE', fontWeight: 600 }}>Y</span>
                    <span style={{ fontSize: 12, color: '#263238', marginLeft: 4, fontFamily: 'monospace' }}>{Math.round(placement.y * 100)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* PRESETS panel */}
            {activePanel === 'presets' && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#90A4AE', margin: '0 0 12px' }}>Quick Presets</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { label: 'Center — Medium', x: 0.5, y: 0.5, scale: 0.6 },
                    { label: 'Center — Large', x: 0.5, y: 0.5, scale: 0.85 },
                    { label: 'Chest — Small', x: 0.5, y: 0.35, scale: 0.35 },
                    { label: 'Full Print', x: 0.5, y: 0.5, scale: 0.95 },
                  ].map(preset => (
                    <button key={preset.label}
                      onClick={() => setPlacement({ x: preset.x, y: preset.y, scale: preset.scale })}
                      style={{
                        padding: '10px 12px', textAlign: 'left', fontSize: 13, color: '#263238',
                        background: '#F2F5F8', border: '1px solid transparent', borderRadius: 6,
                        cursor: 'pointer', fontFamily: "'Open Sans', sans-serif", fontWeight: 400,
                        transition: 'all 0.12s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.border = '1px solid #FF6653'; e.currentTarget.style.background = 'rgba(255,102,83,0.04)'; }}
                      onMouseLeave={e => { e.currentTarget.style.border = '1px solid transparent'; e.currentTarget.style.background = '#F2F5F8'; }}
                    >{preset.label}</button>
                  ))}
                </div>

                <div style={{ marginTop: 20 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#90A4AE', margin: '0 0 10px' }}>Quick Actions</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button onClick={handleReset}
                      style={{ ...quickActionStyle }}>
                      <RotateCcw size={14} color="#546E7A" />
                      Reset to Center
                    </button>
                    <button onClick={handleFitToArea} data-testid="fit-to-area-btn"
                      style={{ ...quickActionStyle }}>
                      <Maximize2 size={14} color="#546E7A" />
                      Fit to Print Area
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── MAIN CANVAS AREA (Printrove-style light bg) ──────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F2F5F8' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, position: 'relative' }}>
            {/* Canvas container */}
            <div ref={containerRef} data-testid="mockup-canvas"
              style={{
                position: 'relative', width: '100%', maxWidth: 420, aspectRatio: '3/4',
                background: '#fff', borderRadius: 10, overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(63,63,68,0.08), 0 1px 3px rgba(0,0,0,0.06)',
              }}>
              {/* Mockup image */}
              <img src={mockupUrl} alt="Product mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', userSelect: 'none' }} draggable={false} />

              {/* Print-safe area */}
              <AnimatePresence>
                {showSafeArea && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    data-testid="print-safe-area"
                    style={{
                      position: 'absolute', pointerEvents: 'none',
                      left: `${safeArea.x * 100}%`, top: `${safeArea.y * 100}%`,
                      width: `${safeArea.width * 100}%`, height: `${safeArea.height * 100}%`,
                      border: '1.5px dashed rgba(255,102,83,0.4)', borderRadius: 4,
                    }}>
                    {[
                      { top: -2, left: -2, borderTop: '2px solid #FF6653', borderLeft: '2px solid #FF6653' },
                      { top: -2, right: -2, borderTop: '2px solid #FF6653', borderRight: '2px solid #FF6653' },
                      { bottom: -2, left: -2, borderBottom: '2px solid #FF6653', borderLeft: '2px solid #FF6653' },
                      { bottom: -2, right: -2, borderBottom: '2px solid #FF6653', borderRight: '2px solid #FF6653' },
                    ].map((s, i) => <div key={i} style={{ position: 'absolute', width: 10, height: 10, ...s }} />)}
                    <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)' }}>
                      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', padding: '2px 6px', borderRadius: 3, background: 'rgba(255,102,83,0.12)', color: '#FF6653', whiteSpace: 'nowrap', fontFamily: "'Open Sans', sans-serif" }}>PRINT AREA</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Design element */}
              {designImage && containerSize.width > 0 && (
                <motion.div
                  data-testid="design-element"
                  className={isDragging ? '' : ''}
                  style={{
                    position: 'absolute', userSelect: 'none',
                    cursor: isDragging ? 'grabbing' : 'move',
                    left: designPos.left, top: designPos.top,
                    width: designPos.width, height: designPos.height,
                    filter: isDragging ? 'brightness(1.03)' : 'none',
                  }}
                  onMouseDown={e => handleMouseDown(e, 'drag')}
                  onTouchStart={e => handleTouchStart(e, 'drag')}
                >
                  <img src={designImage} alt="Your design"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
                    draggable={false} />
                  {/* Selection border */}
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: 2, pointerEvents: 'none',
                    border: `2px solid ${isDragging ? '#FF6653' : '#1976D2'}`,
                    boxShadow: isDragging ? '0 0 12px rgba(255,102,83,0.25)' : '0 0 8px rgba(25,118,210,0.15)',
                    transition: 'border-color 0.12s, box-shadow 0.12s',
                  }} />
                  {/* Resize handles */}
                  {['nw', 'ne', 'sw', 'se'].map(corner => (
                    <div key={corner}
                      data-testid={`resize-handle-${corner}`}
                      onMouseDown={e => handleMouseDown(e, 'resize')}
                      onTouchStart={e => handleTouchStart(e, 'resize')}
                      style={{
                        position: 'absolute', width: 12, height: 12,
                        background: '#FF6653', border: '2px solid #fff', borderRadius: 2,
                        cursor: (corner === 'nw' || corner === 'se') ? 'nwse-resize' : 'nesw-resize',
                        top: corner.includes('n') ? -6 : 'auto',
                        bottom: corner.includes('s') ? -6 : 'auto',
                        left: corner.includes('w') ? -6 : 'auto',
                        right: corner.includes('e') ? -6 : 'auto',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                        transition: 'transform 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* Bottom info bar */}
          <div style={{ padding: '8px 20px', borderTop: '1px solid rgba(0,0,0,0.06)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: '#90A4AE', fontFamily: "'Open Sans', sans-serif" }}>
              Drag to move · Corner handles to resize · Arrow keys to nudge
            </span>
            <span style={{ fontSize: 11, color: '#B0BEC5', fontFamily: 'monospace' }}>
              {scalePercent}% · {Math.round(placement.x * 100)},{Math.round(placement.y * 100)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared styles ──────────────────────────────────────────────────────────────
const nudgeBtnStyle = {
  width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 6, border: '1px solid #E0E0E0', background: '#F2F5F8', cursor: 'pointer',
  transition: 'all 0.1s', padding: 0,
};

const quickActionStyle = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
  fontSize: 12, color: '#546E7A', background: '#F2F5F8', border: '1px solid #E0E0E0',
  borderRadius: 6, cursor: 'pointer', fontFamily: "'Open Sans', sans-serif",
  width: '100%', textAlign: 'left', transition: 'all 0.12s',
};
