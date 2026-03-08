import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  RotateCcw, Maximize2, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, Move, Crosshair, ArrowUp, ArrowDown, ArrowLeftIcon, ArrowRightIcon,
  Minus, Plus
} from 'lucide-react';
import { GARMENT_COLORS } from '@/config/printPresets';

// Internal print-safe area configuration (NOT exposed to creators)
export const PRINT_SAFE_AREAS = Object.freeze({
  tshirt: {
    front: {
      x: 0.26, y: 0.20, width: 0.48, height: 0.52,
      _maxWidthCm: 38, _maxHeightCm: 48, _verticalOffsetCm: 7, _printMethod: 'dtf'
    },
    back: {
      x: 0.26, y: 0.17, width: 0.48, height: 0.56,
      _maxWidthCm: 38, _maxHeightCm: 48, _printMethod: 'dtf'
    }
  },
  hoodie: {
    front: {
      x: 0.27, y: 0.22, width: 0.46, height: 0.50,
      _maxWidthCm: 38, _maxHeightCm: 48, _printMethod: 'dtf'
    },
    back: {
      x: 0.27, y: 0.18, width: 0.46, height: 0.55,
      _maxWidthCm: 38, _maxHeightCm: 48, _printMethod: 'dtf'
    }
  },
  oversized_tshirt: {
    front: {
      x: 0.23, y: 0.16, width: 0.54, height: 0.58,
      _maxWidthCm: 40, _maxHeightCm: 52, _printMethod: 'dtf'
    },
    back: {
      x: 0.23, y: 0.14, width: 0.54, height: 0.60,
      _maxWidthCm: 40, _maxHeightCm: 52, _printMethod: 'dtf'
    }
  },
  bomber_jacket: {
    front: {
      x: 0.28, y: 0.24, width: 0.44, height: 0.46,
      _maxWidthCm: 30, _maxHeightCm: 35, _printMethod: 'dtf'
    },
    back: {
      x: 0.25, y: 0.18, width: 0.50, height: 0.54,
      _maxWidthCm: 36, _maxHeightCm: 42, _printMethod: 'dtf'
    }
  },
  sweatshirt: {
    front: {
      x: 0.27, y: 0.22, width: 0.46, height: 0.50,
      _maxWidthCm: 36, _maxHeightCm: 44, _printMethod: 'dtf'
    },
    back: {
      x: 0.27, y: 0.18, width: 0.46, height: 0.55,
      _maxWidthCm: 36, _maxHeightCm: 44, _printMethod: 'dtf'
    }
  }
});

// Mockup images for different views and colors
const MOCKUP_IMAGES = {
  tshirt: {
    front: {
      white: '/mockups/tshirt-whitefront.jpg',
      black: '/mockups/tshirt-blackfront.jpg',
      yellow: '/mockups/tshirt-yellow.jpg',
      grey: '/mockups/Grey-Front.jpg',
    },
    back: {
      white: '/mockups/tshirt-whitebackog.png',
      black: '/mockups/tshirt-blackback.jpg',
    }
  },
  hoodie: {
    front: {
      white: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
      black: 'https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=800',
      grey: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800',
    },
    back: {
      white: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
      black: 'https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=800',
    }
  },
  oversized_tshirt: {
    front: {
      white: 'https://images.unsplash.com/photo-1627225793904-a2f900a6e4cf?w=800',
      black: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800',
      grey: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
    },
    back: {
      white: 'https://images.unsplash.com/photo-1627225793904-a2f900a6e4cf?w=800',
      black: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800',
    }
  },
  bomber_jacket: {
    front: {
      black: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
      white: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800',
      grey: 'https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=800',
    },
    back: {
      black: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
      white: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800',
    }
  },
  sweatshirt: {
    front: {
      white: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800',
      black: 'https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=800',
      grey: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
    },
    back: {
      white: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800',
      black: 'https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=800',
    }
  }
};

// Design constraints
const DESIGN_CONSTRAINTS = {
  minScale: 0.15,
  maxScale: 1.0,
  defaultScale: 0.6
};

const PRODUCT_LABELS = {
  tshirt: 'T-Shirt',
  hoodie: 'Hoodie',
  oversized_tshirt: 'Oversized Tee',
  bomber_jacket: 'Bomber Jacket',
  sweatshirt: 'Sweatshirt'
};

// Nudge step in relative units
const NUDGE_STEP = 0.02;
const SCALE_STEP = 0.05;

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

  // View state
  const [activeView, setActiveView] = useState('front');
  const [selectedColor, setSelectedColor] = useState(() => {
    const colors = Object.keys(MOCKUP_IMAGES[productType]?.front || {});
    return colors.includes('black') ? 'black' : colors[0] || 'white';
  });

  // Design placement state (relative to safe area, 0–1 range)
  const [placement, setPlacement] = useState(
    initialPlacement || {
      x: 0.5, y: 0.5,
      scale: DESIGN_CONSTRAINTS.defaultScale
    }
  );

  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [designAspectRatio, setDesignAspectRatio] = useState(1);
  const [showSafeArea, setShowSafeArea] = useState(true);

  // Load design image to get aspect ratio
  useEffect(() => {
    if (!designImage) return;
    const img = new Image();
    img.onload = () => {
      if (img.height > 0) setDesignAspectRatio(img.width / img.height);
    };
    img.src = designImage;
  }, [designImage]);

  // Update container size on mount and resize
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

  // Get safe area config
  const safeArea =
    (PRINT_SAFE_AREAS[productType] &&
      PRINT_SAFE_AREAS[productType][activeView]) ||
    PRINT_SAFE_AREAS.tshirt.front;

  // Calculate safe area bounds in pixels
  const safeAreaBounds = {
    x: containerSize.width * safeArea.x,
    y: containerSize.height * safeArea.y,
    width: containerSize.width * safeArea.width,
    height: containerSize.height * safeArea.height
  };

  // Calculate design size based on scale and aspect ratio
  const calculateDesignSize = useCallback(() => {
    const maxWidth = safeAreaBounds.width * placement.scale;
    const maxHeight = safeAreaBounds.height * placement.scale;
    let width, height;
    if (designAspectRatio > maxWidth / maxHeight) {
      width = maxWidth;
      height = width / designAspectRatio;
    } else {
      height = maxHeight;
      width = height * designAspectRatio;
    }
    return { width, height };
  }, [safeAreaBounds, placement.scale, designAspectRatio]);

  // Calculate design position in pixels
  const calculateDesignPosition = useCallback(() => {
    const designSize = calculateDesignSize();
    const centerX = safeAreaBounds.x + safeAreaBounds.width * placement.x;
    const centerY = safeAreaBounds.y + safeAreaBounds.height * placement.y;
    return {
      left: centerX - designSize.width / 2,
      top: centerY - designSize.height / 2,
      width: designSize.width,
      height: designSize.height
    };
  }, [safeAreaBounds, placement, calculateDesignSize]);

  // Handle mouse down on design
  const handleMouseDown = (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    if (action === 'drag') {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (action === 'resize') {
      setIsResizing(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging && !isResizing) return;
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      if (isDragging) {
        const relativeX = deltaX / safeAreaBounds.width;
        const relativeY = deltaY / safeAreaBounds.height;
        setPlacement(prev => {
          const designSize = calculateDesignSize();
          const halfWidthRatio = (designSize.width / 2) / safeAreaBounds.width;
          const halfHeightRatio = (designSize.height / 2) / safeAreaBounds.height;
          const newX = Math.max(halfWidthRatio, Math.min(1 - halfWidthRatio, prev.x + relativeX));
          const newY = Math.max(halfHeightRatio, Math.min(1 - halfHeightRatio, prev.y + relativeY));
          return { ...prev, x: newX, y: newY };
        });
        setDragStart({ x: e.clientX, y: e.clientY });
      }

      if (isResizing) {
        const diagonal = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const direction = deltaX + deltaY > 0 ? 1 : -1;
        const scaleChange = (diagonal / 200) * direction;
        setPlacement(prev => ({
          ...prev,
          scale: Math.max(DESIGN_CONSTRAINTS.minScale, Math.min(DESIGN_CONSTRAINTS.maxScale, prev.scale + scaleChange))
        }));
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, safeAreaBounds, calculateDesignSize]);

  // Touch support
  const handleTouchStart = (e, action) => {
    const touch = e.touches[0];
    handleMouseDown({
      preventDefault: () => {},
      stopPropagation: () => {},
      clientX: touch.clientX,
      clientY: touch.clientY
    }, action);
  };

  useEffect(() => {
    const handleTouchMove = (e) => {
      if (!isDragging && !isResizing) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStart.x;
      const deltaY = touch.clientY - dragStart.y;

      if (isDragging) {
        const relativeX = deltaX / safeAreaBounds.width;
        const relativeY = deltaY / safeAreaBounds.height;
        setPlacement(prev => {
          const designSize = calculateDesignSize();
          const halfWidthRatio = (designSize.width / 2) / safeAreaBounds.width;
          const halfHeightRatio = (designSize.height / 2) / safeAreaBounds.height;
          const newX = Math.max(halfWidthRatio, Math.min(1 - halfWidthRatio, prev.x + relativeX));
          const newY = Math.max(halfHeightRatio, Math.min(1 - halfHeightRatio, prev.y + relativeY));
          return { ...prev, x: newX, y: newY };
        });
        setDragStart({ x: touch.clientX, y: touch.clientY });
      }

      if (isResizing) {
        const diagonal = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const direction = deltaX + deltaY > 0 ? 1 : -1;
        const scaleChange = (diagonal / 200) * direction;
        setPlacement(prev => ({
          ...prev,
          scale: Math.max(DESIGN_CONSTRAINTS.minScale, Math.min(DESIGN_CONSTRAINTS.maxScale, prev.scale + scaleChange))
        }));
        setDragStart({ x: touch.clientX, y: touch.clientY });
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, isResizing, dragStart, safeAreaBounds, calculateDesignSize]);

  // Keyboard nudge
  useEffect(() => {
    const handleKey = (e) => {
      const step = e.shiftKey ? NUDGE_STEP * 3 : NUDGE_STEP;
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setPlacement(p => ({ ...p, y: Math.max(0, p.y - step) }));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setPlacement(p => ({ ...p, y: Math.min(1, p.y + step) }));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setPlacement(p => ({ ...p, x: Math.max(0, p.x - step) }));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setPlacement(p => ({ ...p, x: Math.min(1, p.x + step) }));
          break;
        case '+':
        case '=':
          e.preventDefault();
          setPlacement(p => ({ ...p, scale: Math.min(DESIGN_CONSTRAINTS.maxScale, p.scale + SCALE_STEP) }));
          break;
        case '-':
        case '_':
          e.preventDefault();
          setPlacement(p => ({ ...p, scale: Math.max(DESIGN_CONSTRAINTS.minScale, p.scale - SCALE_STEP) }));
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Reset to center
  const handleReset = () => {
    setPlacement({ x: 0.5, y: 0.5, scale: DESIGN_CONSTRAINTS.defaultScale });
  };

  // Fit to safe area
  const handleFitToArea = () => {
    setPlacement(prev => ({ ...prev, x: 0.5, y: 0.5, scale: 0.9 }));
  };

  // Nudge handlers
  const nudge = (axis, dir) => {
    setPlacement(p => ({
      ...p,
      [axis]: Math.max(0, Math.min(1, p[axis] + dir * NUDGE_STEP))
    }));
  };

  const adjustScale = (dir) => {
    setPlacement(p => ({
      ...p,
      scale: Math.max(DESIGN_CONSTRAINTS.minScale, Math.min(DESIGN_CONSTRAINTS.maxScale, p.scale + dir * SCALE_STEP))
    }));
  };

  // Notify parent of placement changes
  useEffect(() => {
    if (onPlacementChange) {
      onPlacementChange({
        view: activeView,
        color: selectedColor,
        placement: { ...placement },
        _metadata: {
          productType,
          printMethod: safeArea._printMethod,
          maxWidthCm: safeArea._maxWidthCm,
          maxHeightCm: safeArea._maxHeightCm,
        }
      });
    }
  }, [placement, activeView, selectedColor, productType, safeArea]);

  // Handle save
  const handleSave = () => {
    if (onSave) {
      onSave({
        view: activeView,
        color: selectedColor,
        placement: { ...placement },
        _productionSpec: {
          productType,
          printMethod: safeArea._printMethod,
          maxWidthCm: safeArea._maxWidthCm,
          maxHeightCm: safeArea._maxHeightCm,
          finalScale: placement.scale,
          positionX: placement.x,
          positionY: placement.y
        }
      });
    }
  };

  const designPos = calculateDesignPosition();
  const mockupUrl = MOCKUP_IMAGES[productType]?.[activeView]?.[selectedColor] ||
                    MOCKUP_IMAGES.tshirt.front.white;

  const availableColors = Object.keys(MOCKUP_IMAGES[productType]?.[activeView] || {});
  const productLabel = PRODUCT_LABELS[productType] || 'Product';
  const scalePercent = Math.round(placement.scale * 100);

  return (
    <div className="flex flex-col h-full" data-testid="mockup-editor"
         style={{ background: '#0A0A0B', color: '#fff' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3"
           style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
          data-testid="editor-back-btn"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <h2 style={{
          fontFamily: "'Clash Display', sans-serif",
          fontWeight: 600,
          fontSize: '1rem',
          letterSpacing: '-0.02em',
          color: '#fff'
        }}>
          {productLabel} — Placement Editor
        </h2>

        <div className="w-16" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: View Thumbnails ──────────────────────── */}
        <div className="w-20 flex flex-col items-center gap-3 py-4 px-2"
             style={{ borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium mb-1">Views</span>
          {['front', 'back'].map((view) => {
            const previewSrc = MOCKUP_IMAGES[productType]?.[view]?.[selectedColor] ||
              MOCKUP_IMAGES.tshirt.front.white;
            const isActive = activeView === view;
            return (
              <button
                key={view}
                type="button"
                onClick={() => setActiveView(view)}
                className="w-full aspect-[3/4] rounded-lg overflow-hidden transition-all relative"
                style={{
                  border: isActive ? '2px solid #FF3D00' : '2px solid rgba(255,255,255,0.1)',
                  boxShadow: isActive ? '0 0 12px rgba(255,61,0,0.3)' : 'none',
                  opacity: isActive ? 1 : 0.6,
                }}
                aria-pressed={isActive}
                data-testid={`view-${view}-btn`}
              >
                <img
                  src={previewSrc}
                  alt={`${view} view`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                {isActive && (
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 60%, rgba(255,61,0,0.15) 100%)' }} />
                )}
              </button>
            );
          })}
          <span className="text-[10px] capitalize text-white/40">{activeView}</span>
        </div>

        {/* ── Center: Canvas ─────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative flex items-center justify-center p-6"
               style={{
                 background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, transparent 70%)',
               }}>
            {/* Checkerboard subtle bg */}
            <div className="absolute inset-0 opacity-[0.015]"
                 style={{
                   backgroundImage: `
                     linear-gradient(45deg, #fff 25%, transparent 25%),
                     linear-gradient(-45deg, #fff 25%, transparent 25%),
                     linear-gradient(45deg, transparent 75%, #fff 75%),
                     linear-gradient(-45deg, transparent 75%, #fff 75%)
                   `,
                   backgroundSize: '20px 20px',
                   backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                 }}
            />

            <div
              ref={containerRef}
              className="relative w-full max-w-md aspect-[3/4] rounded-xl overflow-hidden"
              style={{
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                background: '#111'
              }}
              data-testid="mockup-canvas"
            >
              {/* Mockup image */}
              <img
                src={mockupUrl}
                alt="Product mockup"
                className="w-full h-full object-cover pointer-events-none select-none"
                draggable={false}
              />

              {/* Print-safe area indicator */}
              <AnimatePresence>
                {showSafeArea && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${safeArea.x * 100}%`,
                      top: `${safeArea.y * 100}%`,
                      width: `${safeArea.width * 100}%`,
                      height: `${safeArea.height * 100}%`,
                      border: '1.5px dashed rgba(255,61,0,0.35)',
                      borderRadius: '4px',
                    }}
                    data-testid="print-safe-area"
                  >
                    {/* Corner markers */}
                    {[
                      { top: -2, left: -2, borderTop: '2px solid #FF3D00', borderLeft: '2px solid #FF3D00' },
                      { top: -2, right: -2, borderTop: '2px solid #FF3D00', borderRight: '2px solid #FF3D00' },
                      { bottom: -2, left: -2, borderBottom: '2px solid #FF3D00', borderLeft: '2px solid #FF3D00' },
                      { bottom: -2, right: -2, borderBottom: '2px solid #FF3D00', borderRight: '2px solid #FF3D00' },
                    ].map((style, i) => (
                      <div key={i} className="absolute w-3 h-3" style={style} />
                    ))}

                    {/* Label */}
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="text-[9px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(255,61,0,0.15)', color: '#FF3D00', fontWeight: 500 }}>
                        Print Area
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Design element */}
              {designImage && containerSize.width > 0 && (
                <motion.div
                  className={`absolute select-none ${isDragging ? 'cursor-grabbing' : 'cursor-move'}`}
                  style={{
                    left: designPos.left,
                    top: designPos.top,
                    width: designPos.width,
                    height: designPos.height,
                    filter: isDragging ? 'brightness(1.05)' : 'none',
                  }}
                  onMouseDown={(e) => handleMouseDown(e, 'drag')}
                  onTouchStart={(e) => handleTouchStart(e, 'drag')}
                  data-testid="design-element"
                >
                  <img
                    src={designImage}
                    alt="Your design"
                    className="w-full h-full object-contain pointer-events-none select-none mix-blend-normal"
                    draggable={false}
                  />
                  {/* Selection border */}
                  <div className="absolute inset-0 rounded-sm pointer-events-none"
                       style={{
                         border: `2px solid ${isDragging ? '#FF3D00' : 'rgba(255,255,255,0.7)'}`,
                         boxShadow: isDragging ? '0 0 16px rgba(255,61,0,0.3)' : '0 0 8px rgba(0,0,0,0.3)',
                         transition: 'border-color 0.15s, box-shadow 0.15s'
                       }}
                  />
                  {/* Resize handles */}
                  {['nw', 'ne', 'sw', 'se'].map((corner) => {
                    const isNS = corner === 'nw' || corner === 'se';
                    return (
                      <div
                        key={corner}
                        className={`absolute ${isNS ? 'cursor-nwse-resize' : 'cursor-nesw-resize'}`}
                        style={{
                          width: 14, height: 14,
                          background: '#FF3D00',
                          border: '2px solid #fff',
                          borderRadius: 3,
                          top: corner.includes('n') ? -7 : 'auto',
                          bottom: corner.includes('s') ? -7 : 'auto',
                          left: corner.includes('w') ? -7 : 'auto',
                          right: corner.includes('e') ? -7 : 'auto',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                          transition: 'transform 0.15s',
                        }}
                        onMouseDown={(e) => handleMouseDown(e, 'resize')}
                        onTouchStart={(e) => handleTouchStart(e, 'resize')}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.3)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                        data-testid={`resize-handle-${corner}`}
                      />
                    );
                  })}
                </motion.div>
              )}
            </div>
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-5 py-3"
               style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-4">
              {/* Zoom controls */}
              <div className="flex items-center gap-1.5">
                <button onClick={() => adjustScale(-1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                        title="Zoom out (-)">
                  <ZoomOut className="h-3.5 w-3.5 text-white/60" />
                </button>
                <span className="text-xs text-white/50 w-10 text-center tabular-nums font-mono">
                  {scalePercent}%
                </span>
                <button onClick={() => adjustScale(1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                        title="Zoom in (+)">
                  <ZoomIn className="h-3.5 w-3.5 text-white/60" />
                </button>
              </div>

              {/* Divider */}
              <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.08)' }} />

              {/* Nudge controls */}
              <div className="flex items-center gap-0.5">
                <button onClick={() => nudge('x', -1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-white/10"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                        title="Nudge left">
                  <ArrowLeftIcon className="h-3.5 w-3.5 text-white/50" />
                </button>
                <button onClick={() => nudge('y', -1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-white/10"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                        title="Nudge up">
                  <ArrowUp className="h-3.5 w-3.5 text-white/50" />
                </button>
                <button onClick={() => nudge('y', 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-white/10"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                        title="Nudge down">
                  <ArrowDown className="h-3.5 w-3.5 text-white/50" />
                </button>
                <button onClick={() => nudge('x', 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-white/10"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                        title="Nudge right">
                  <ArrowRightIcon className="h-3.5 w-3.5 text-white/50" />
                </button>
              </div>

              {/* Divider */}
              <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.08)' }} />

              {/* Quick actions */}
              <button onClick={handleReset}
                      className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
                      data-testid="reset-position-btn"
                      title="Reset position">
                <Crosshair className="h-3.5 w-3.5" />
                Center
              </button>
              <button onClick={handleFitToArea}
                      className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
                      data-testid="fit-to-area-btn"
                      title="Fill print area">
                <Maximize2 className="h-3.5 w-3.5" />
                Fill
              </button>
              <button onClick={() => setShowSafeArea(s => !s)}
                      className="flex items-center gap-1.5 text-xs transition-colors"
                      style={{ color: showSafeArea ? 'rgba(255,61,0,0.7)' : 'rgba(255,255,255,0.3)' }}
                      title="Toggle print area guide">
                <Move className="h-3.5 w-3.5" />
                Guide
              </button>
            </div>

            <span className="text-[10px] text-white/20 hidden sm:block">
              Arrow keys to nudge · +/- to resize · Shift for bigger steps
            </span>
          </div>
        </div>

        {/* ── Right Sidebar ──────────────────────────────── */}
        <div className="w-56 flex flex-col flex-shrink-0"
             style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
            {/* Color selector */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium mb-3">
                Garment Color
              </p>
              <div className="flex flex-wrap gap-2.5">
                {availableColors.map((color) => {
                  const isSelected = selectedColor === color;
                  const hex = GARMENT_COLORS[color]?.hex || '#fff';
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className="relative transition-transform"
                      style={{ transform: isSelected ? 'scale(1.15)' : 'scale(1)' }}
                      title={GARMENT_COLORS[color]?.name || color}
                      data-testid={`color-${color}-btn`}
                    >
                      <div className="w-9 h-9 rounded-full transition-all"
                           style={{
                             background: hex,
                             border: isSelected ? '2.5px solid #FF3D00' : '2px solid rgba(255,255,255,0.15)',
                             boxShadow: isSelected
                               ? '0 0 12px rgba(255,61,0,0.35), inset 0 0 0 2px rgba(0,0,0,0.1)'
                               : 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                           }}
                      />
                      {isSelected && (
                        <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2">
                          <div className="w-1 h-1 rounded-full bg-[#FF3D00]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scale slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium">Size</p>
                <span className="text-xs text-white/40 font-mono tabular-nums">{scalePercent}%</span>
              </div>
              <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div
                  className="absolute top-0 left-0 h-full rounded-full"
                  style={{
                    width: `${scalePercent}%`,
                    background: 'linear-gradient(90deg, #FF3D00, #ff6a33)',
                  }}
                  layout
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <button onClick={() => adjustScale(-1)}
                        className="w-6 h-6 flex items-center justify-center rounded text-white/30 hover:text-white/60 transition-colors"
                        style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <Minus className="h-3 w-3" />
                </button>
                <button onClick={() => adjustScale(1)}
                        className="w-6 h-6 flex items-center justify-center rounded text-white/30 hover:text-white/60 transition-colors"
                        style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Position readout */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium mb-2">Position</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md px-2.5 py-1.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-[9px] text-white/25 uppercase">X</span>
                  <span className="text-xs text-white/60 ml-1 font-mono tabular-nums">
                    {Math.round(placement.x * 100)}%
                  </span>
                </div>
                <div className="rounded-md px-2.5 py-1.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-[9px] text-white/25 uppercase">Y</span>
                  <span className="text-xs text-white/60 ml-1 font-mono tabular-nums">
                    {Math.round(placement.y * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Quick presets */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium mb-2">Quick Presets</p>
              <div className="space-y-1.5">
                {[
                  { label: 'Center — Medium', x: 0.5, y: 0.5, scale: 0.6 },
                  { label: 'Center — Large', x: 0.5, y: 0.5, scale: 0.85 },
                  { label: 'Chest — Small', x: 0.5, y: 0.35, scale: 0.35 },
                  { label: 'Full Print', x: 0.5, y: 0.5, scale: 0.95 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setPlacement({ x: preset.x, y: preset.y, scale: preset.scale })}
                    className="w-full text-left text-xs px-2.5 py-1.5 rounded-md transition-colors text-white/40 hover:text-white/70"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={handleSave}
              className="w-full py-2.5 rounded-full text-sm font-semibold text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #FF3D00, #ff5722)',
                boxShadow: '0 4px 16px rgba(255,61,0,0.3)',
                fontFamily: "'Clash Display', sans-serif",
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(255,61,0,0.45)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,61,0,0.3)'; }}
              data-testid="save-placement-btn"
            >
              Save Placement
              <ChevronRight className="inline-block ml-1 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
