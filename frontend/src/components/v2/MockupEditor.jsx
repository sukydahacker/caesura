import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RotateCcw, Maximize2, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { GARMENT_COLORS } from '@/config/printPresets';

// Internal print-safe area configuration (NOT exposed to creators)
export const PRINT_SAFE_AREAS = Object.freeze({
  tshirt: {
  front: {
    // Percentages relative to mockup container
    x: 0.26,      // Slightly right for better visual centering
    y: 0.20,      // Lowered to avoid collar area
    width: 0.48,  // Slightly narrower for cleaner margins
    height: 0.52, // Balanced vertical print zone

    // Internal production specs (hidden)
    _maxWidthCm: 38,
    _maxHeightCm: 48,
    _verticalOffsetCm: 7, // More realistic chest drop
    _printMethod: 'dtf'
  },

  back: {
    x: 0.26,
    y: 0.17,      // Back starts a bit higher than front
    width: 0.48,
    height: 0.56, // More vertical space on back

    _maxWidthCm: 38,
    _maxHeightCm: 48,
    _printMethod: 'dtf'
  }
},

  hoodie: {
    front: {
      x: 0.27,
      y: 0.22,
      width: 0.46,
      height: 0.50,
      _maxWidthCm: 38,
      _maxHeightCm: 48,
      _printMethod: 'dtf'
    },
    back: {
      x: 0.27,
      y: 0.18,
      width: 0.46,
      height: 0.55,
      _maxWidthCm: 38,
      _maxHeightCm: 48,
      _printMethod: 'dtf'
    }
  },

  oversized_tshirt: {
    front: {
      x: 0.23,
      y: 0.16,
      width: 0.54,
      height: 0.58,
      _maxWidthCm: 40,
      _maxHeightCm: 52,
      _printMethod: 'dtf'
    },
    back: {
      x: 0.23,
      y: 0.14,
      width: 0.54,
      height: 0.60,
      _maxWidthCm: 40,
      _maxHeightCm: 52,
      _printMethod: 'dtf'
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
      black: '/mockups/hoodie-grey.jpg',
      grey: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800',
    },
    back: {
      white: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
      black: '/mockups/hoodie-grey.jpg',
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
  }
};

// Design constraints
const DESIGN_CONSTRAINTS = {
  minScale: 0.15,   // Minimum 15% of safe area
  maxScale: 1.0,    // Maximum 100% of safe area
  defaultScale: 0.6 // Default 60% of safe area
};

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
  const [selectedColor, setSelectedColor] = useState('white');

  // Design placement state (relative to safe area, 0–1 range)
  const [placement, setPlacement] = useState(
    initialPlacement || {
      x: 0.5, // Center X
      y: 0.5, // Center Y
      scale: DESIGN_CONSTRAINTS.defaultScale
    }
  );

  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [designAspectRatio, setDesignAspectRatio] = useState(1);

  // Load design image to get aspect ratio
  useEffect(() => {
    if (!designImage) return;

    const img = new Image();
    img.onload = () => {
      if (img.height > 0) {
        setDesignAspectRatio(img.width / img.height);
      }
    };
    img.src = designImage;
  }, [designImage]);

  // Update container size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({
        width: rect.width,
        height: rect.height
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
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

    let width;
    let height;

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

    const centerX =
      safeAreaBounds.x + safeAreaBounds.width * placement.x;
    const centerY =
      safeAreaBounds.y + safeAreaBounds.height * placement.y;

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
        // Convert pixel delta to relative position
        const relativeX = deltaX / safeAreaBounds.width;
        const relativeY = deltaY / safeAreaBounds.height;
        
        setPlacement(prev => {
          const designSize = calculateDesignSize();
          const halfWidthRatio = (designSize.width / 2) / safeAreaBounds.width;
          const halfHeightRatio = (designSize.height / 2) / safeAreaBounds.height;
          
          // Clamp to keep design within safe area
          const newX = Math.max(halfWidthRatio, Math.min(1 - halfWidthRatio, prev.x + relativeX));
          const newY = Math.max(halfHeightRatio, Math.min(1 - halfHeightRatio, prev.y + relativeY));
          
          return { ...prev, x: newX, y: newY };
        });
        
        setDragStart({ x: e.clientX, y: e.clientY });
      }
      
      if (isResizing) {
        // Calculate scale change based on diagonal movement
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
  
  // Reset to center
  const handleReset = () => {
    setPlacement({
      x: 0.5,
      y: 0.5,
      scale: DESIGN_CONSTRAINTS.defaultScale
    });
  };
  
  // Fit to safe area
  const handleFitToArea = () => {
    setPlacement(prev => ({
      ...prev,
      x: 0.5,
      y: 0.5,
      scale: 0.9
    }));
  };
  
  // Notify parent of placement changes
  useEffect(() => {
    if (onPlacementChange) {
      onPlacementChange({
        view: activeView,
        color: selectedColor,
        placement: { ...placement },
        // Internal metadata for production (hidden from UI)
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
        // Internal production specs (not shown to creator)
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
  
  // Available colors for this product & view
const availableColors = Object.keys(
  MOCKUP_IMAGES[productType]?.[activeView] || {}
);

const productLabel =
  productType === 'tshirt'
    ? 'T-Shirt'
    : productType === 'hoodie'
    ? 'Hoodie'
    : 'Oversized T-Shirt';

return (
  <div className="flex flex-col h-full" data-testid="mockup-editor">
    {/* Header */}
    <div className="flex items-center justify-between p-4 border-b border-border">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        data-testid="editor-back-btn"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back
      </Button>

      <h2 className="font-heading font-semibold">
        {productLabel} Editor
      </h2>

      <div className="w-20" aria-hidden /> {/* Spacer */}
    </div>

    <div className="flex flex-1 overflow-hidden">
      {/* Left sidebar - View selector */}
      <div className="w-24 border-r border-border p-3 space-y-3 bg-muted/30">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Views
        </p>

        {['front', 'back'].map((view) => {
          const previewSrc =
            MOCKUP_IMAGES[productType]?.[view]?.[selectedColor] ||
            MOCKUP_IMAGES.tshirt.front.white;

          const isActive = activeView === view;

          return (
            <button
              key={view}
              type="button"
              onClick={() => setActiveView(view)}
              className={`w-full aspect-[3/4] rounded border-2 overflow-hidden transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0047FF]/40 ${
                isActive
                  ? 'border-[#0047FF] ring-2 ring-[#0047FF]/20'
                  : 'border-border hover:border-[#0047FF]/50'
              }`}
              aria-pressed={isActive}
              data-testid={`view-${view}-btn`}
            >
              <img
                src={previewSrc}
                alt={`${view} view`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </button>
          );
        })}

        <p className="text-xs text-center text-muted-foreground capitalize">
          {activeView}
        </p>
      </div>

      {/* Main editor area */}
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Center: Canvas + helper */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mockup canvas */}
          <div className="flex-1 relative bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-8">
            <div
              ref={containerRef}
              className="relative w-full max-w-md aspect-[3/4] bg-white rounded-lg shadow-lg overflow-hidden"
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
              <div
                className="absolute border-2 border-dashed border-[#0047FF]/30 rounded pointer-events-none"
                style={{
                  left: `${safeArea.x * 100}%`,
                  top: `${safeArea.y * 100}%`,
                  width: `${safeArea.width * 100}%`,
                  height: `${safeArea.height * 100}%`
                }}
                data-testid="print-safe-area"
              >
                {/* Corner indicators */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#0047FF]/50" />
                <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#0047FF]/50" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#0047FF]/50" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#0047FF]/50" />
              </div>

              {/* Design element */}
              {designImage && containerSize.width > 0 && (
                <motion.div
                  className={`absolute select-none ${
                    isDragging ? 'cursor-grabbing' : 'cursor-move'
                  }`}
                  style={{
                    left: designPos.left,
                    top: designPos.top,
                    width: designPos.width,
                    height: designPos.height
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
                  <div className="absolute inset-0 border-2 border-[#0047FF] rounded pointer-events-none" />
                  {['nw', 'ne', 'sw', 'se'].map((corner) => {
                    const isNS = corner === 'nw' || corner === 'se';
                    return (
                      <div
                        key={corner}
                        className={`absolute w-4 h-4 bg-white border-2 border-[#0047FF] rounded-sm ${
                          isNS ? 'cursor-nwse-resize' : 'cursor-nesw-resize'
                        } transition-colors hover:bg-[#0047FF]`}
                        style={{
                          top: corner.includes('n') ? -8 : 'auto',
                          bottom: corner.includes('s') ? -8 : 'auto',
                          left: corner.includes('w') ? -8 : 'auto',
                          right: corner.includes('e') ? -8 : 'auto'
                        }}
                        onMouseDown={(e) => handleMouseDown(e, 'resize')}
                        onTouchStart={(e) => handleTouchStart(e, 'resize')}
                        data-testid={`resize-handle-${corner}`}
                      />
                    );
                  })}
                </motion.div>
              )}
            </div>
          </div>

          {/* Helper text */}
          <div className="px-4 py-2 bg-muted/50 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4 shrink-0" />
              <span>Place and resize your design within the print area</span>
            </div>
          </div>
        </div>

        {/* Right sidebar - Controls */}
        <div className="w-64 border-l border-border p-4 space-y-6 bg-white flex-shrink-0">
          {/* Color selector */}
          <div>
            <p className="text-sm font-medium mb-3">Garment Color</p>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    selectedColor === color 
                      ? 'border-[#0047FF] ring-2 ring-[#0047FF]/20 scale-110' 
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: GARMENT_COLORS[color]?.hex || '#fff' }}
                  title={GARMENT_COLORS[color]?.name || color}
                  data-testid={`color-${color}-btn`}
                />
              ))}
            </div>
          </div>
          
          {/* Placement controls */}
          <div>
            <p className="text-sm font-medium mb-3">Placement</p>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={handleReset}
                data-testid="reset-position-btn"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Center
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={handleFitToArea}
                data-testid="fit-to-area-btn"
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Fit to Print Area
              </Button>
            </div>
          </div>
          
          {/* Scale indicator (visual only, no numeric input) */}
          <div>
            <p className="text-sm font-medium mb-3">Size</p>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#0047FF] rounded-full transition-all"
                style={{ width: `${placement.scale * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Small</span>
              <span>Large</span>
            </div>
          </div>
          
          {/* Save button */}
          <div className="pt-4 border-t border-border">
            <Button 
              onClick={handleSave}
              className="w-full rounded-full bg-[#0047FF] hover:bg-[#0047FF]/90"
              size="lg"
              data-testid="save-placement-btn"
            >
              Save & Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
