import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Upload, X, Check, AlertTriangle, ChevronRight, ChevronLeft, 
  Loader2, Palette, Eye, ShoppingBag, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { PRINT_PRESETS, GARMENT_COLORS, DESIGN_REQUIREMENTS, DESIGN_STATES } from '@/config/printPresets';

// Mockup canvas component for generating product previews
const MockupCanvas = ({ designImage, productType, garmentColor, placement = 'front' }) => {
  const canvasRef = useRef(null);
  const [mockupReady, setMockupReady] = useState(false);
  
  const preset = PRINT_PRESETS[productType];
  const mockupUrl = preset?.mockupImages?.[garmentColor] || preset?.mockupImages?.white;
  
  useEffect(() => {
    if (!canvasRef.current || !designImage || !mockupUrl) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Load mockup image
    const mockupImg = new Image();
    mockupImg.crossOrigin = 'anonymous';
    
    const designImg = new Image();
    designImg.crossOrigin = 'anonymous';
    
    let mounted = true;
    
    mockupImg.onload = () => {
      if (!mounted) return;
      
      canvas.width = 600;
      canvas.height = 750;
      
      // Draw mockup
      ctx.drawImage(mockupImg, 0, 0, canvas.width, canvas.height);
      
      // Load and draw design
      designImg.onload = () => {
        if (!mounted) return;
        
        // Calculate design position and size based on product type
        const placementConfig = getPlacementConfig(productType, placement);
        
        // Design overlay position (percentage-based for flexibility)
        const designX = canvas.width * placementConfig.x;
        const designY = canvas.height * placementConfig.y;
        const designW = canvas.width * placementConfig.width;
        const designH = (designImg.height / designImg.width) * designW;
        
        // Center the design
        const offsetX = designX - (designW / 2);
        const offsetY = designY - (designH / 2);
        
        ctx.drawImage(designImg, offsetX, offsetY, designW, designH);
        setMockupReady(true);
      };
      
      designImg.src = designImage;
    };
    
    mockupImg.src = mockupUrl;
    
    return () => {
      mounted = false;
    };
  }, [designImage, mockupUrl, productType, placement]);
  
  // Placement configurations for different products
  const getPlacementConfig = (type, placement) => {
    const configs = {
      tshirt: { front: { x: 0.5, y: 0.42, width: 0.45 } },
      hoodie: { front: { x: 0.5, y: 0.42, width: 0.42 } },
      oversized_tshirt: { front: { x: 0.5, y: 0.4, width: 0.5 } },
      varsity_jacket: { left_chest: { x: 0.35, y: 0.35, width: 0.15 } },
      cap: { front: { x: 0.5, y: 0.45, width: 0.35 } }
    };
    return configs[type]?.[placement] || configs.tshirt.front;
  };
  
  return (
    <div className="relative aspect-[4/5] bg-muted overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full object-contain"
        style={{ display: mockupReady ? 'block' : 'none' }}
      />
      {!mockupReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

// Simple mockup using CSS overlay (fallback)
const SimpleMockup = ({ designImage, productType, garmentColor }) => {
  const preset = PRINT_PRESETS[productType];
  const mockupUrl = preset?.mockupImages?.[garmentColor] || preset?.mockupImages?.white;
  const colorInfo = GARMENT_COLORS[garmentColor];
  
  // Get positioning based on product type
  const getOverlayStyle = () => {
    switch (productType) {
      case 'varsity_jacket':
        return { top: '28%', left: '25%', width: '18%', transform: 'translateX(-50%)' };
      case 'cap':
        return { top: '35%', left: '50%', width: '40%', transform: 'translateX(-50%)' };
      default:
        return { top: '25%', left: '50%', width: '50%', transform: 'translateX(-50%)' };
    }
  };
  
  return (
    <div className="relative aspect-[4/5] bg-muted overflow-hidden rounded-sm">
      <img 
        src={mockupUrl} 
        alt={`${preset?.name} mockup`}
        className="w-full h-full object-cover"
        crossOrigin="anonymous"
      />
      {designImage && (
        <div 
          className="absolute pointer-events-none"
          style={getOverlayStyle()}
        >
          <img 
            src={designImage} 
            alt="Design preview"
            className="w-full h-auto mix-blend-multiply"
            style={{ 
              filter: colorInfo?.contrastWarning === 'dark' ? 'brightness(1.1)' : 'none'
            }}
          />
        </div>
      )}
    </div>
  );
};

// Product card for the preview grid
const ProductPreviewCard = ({ 
  productType, 
  designImage, 
  enabled, 
  onToggle, 
  incompatibilityReason,
  selectedColor,
  onColorChange 
}) => {
  const preset = PRINT_PRESETS[productType];
  const isEmbroidery = preset.printMethod === 'embroidery';
  const [showColors, setShowColors] = useState(false);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative border rounded-sm overflow-hidden transition-all ${
        enabled ? 'border-border' : 'border-border/50 opacity-60'
      }`}
    >
      {/* Product mockup */}
      <SimpleMockup 
        designImage={enabled ? designImage : null}
        productType={productType}
        garmentColor={selectedColor}
      />
      
      {/* Incompatibility overlay */}
      {incompatibilityReason && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
          <div className="text-center text-white">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
            <p className="text-sm font-medium">{incompatibilityReason}</p>
          </div>
        </div>
      )}
      
      {/* Product info */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-heading font-semibold">{preset.name}</h4>
            <p className="text-sm text-muted-foreground">
              {isEmbroidery ? 'Embroidered' : 'Printed'} • From ₹{preset.basePrice}
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={onToggle}
            disabled={!!incompatibilityReason}
            data-testid={`toggle-${productType}`}
          />
        </div>
        
        {/* Color selector */}
        {enabled && (
          <div className="space-y-2">
            <button
              onClick={() => setShowColors(!showColors)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Palette className="h-4 w-4" />
              <span>{GARMENT_COLORS[selectedColor]?.name || 'Select Color'}</span>
              <ChevronRight className={`h-4 w-4 transition-transform ${showColors ? 'rotate-90' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showColors && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex gap-2 flex-wrap overflow-hidden"
                >
                  {preset.availableColors.map(color => (
                    <button
                      key={color}
                      onClick={() => onColorChange(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor === color ? 'border-[#0047FF] scale-110' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: GARMENT_COLORS[color]?.hex }}
                      title={GARMENT_COLORS[color]?.name}
                      data-testid={`color-${productType}-${color}`}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Main Upload Design Flow Component
export default function DesignUploadFlow({ open, onOpenChange, onComplete }) {
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Details
  const [designFile, setDesignFile] = useState(null);
  const [designPreview, setDesignPreview] = useState(null);
  const [designAnalysis, setDesignAnalysis] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  
  // Product configuration
  const [enabledProducts, setEnabledProducts] = useState({
    tshirt: true,
    hoodie: true,
    oversized_tshirt: true,
    varsity_jacket: false,
    cap: false
  });
  
  const [productColors, setProductColors] = useState({
    tshirt: 'white',
    hoodie: 'black',
    oversized_tshirt: 'white',
    varsity_jacket: 'black',
    cap: 'black'
  });
  
  // Design details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(1);
        setDesignFile(null);
        setDesignPreview(null);
        setDesignAnalysis(null);
        setValidationErrors([]);
        setTitle('');
        setDescription('');
        setEnabledProducts({
          tshirt: true,
          hoodie: true,
          oversized_tshirt: true,
          varsity_jacket: false,
          cap: false
        });
      }, 300);
    }
  }, [open]);
  
  // File validation and analysis
  const validateAndAnalyzeDesign = useCallback(async (file) => {
    setIsValidating(true);
    setValidationErrors([]);
    
    const errors = [];
    
    // Check file type
    if (!DESIGN_REQUIREMENTS.allowedFormats.includes(file.type)) {
      errors.push('Please upload a PNG file. Other formats are not supported.');
    }
    
    // Load and analyze image
    const reader = new FileReader();
    
    return new Promise((resolve) => {
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = () => {
          // Check dimensions
          if (img.width < DESIGN_REQUIREMENTS.minWidth || img.height < DESIGN_REQUIREMENTS.minHeight) {
            errors.push(`Design resolution is too low. Minimum required: ${DESIGN_REQUIREMENTS.minWidth} × ${DESIGN_REQUIREMENTS.minHeight} pixels.`);
          }
          
          // Analyze image for embroidery compatibility
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = Math.min(img.width, 200); // Sample at smaller size
          canvas.height = Math.min(img.height, 200);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const analysis = analyzeImageData(imageData);
          
          // Check for transparency
          if (!analysis.hasTransparency) {
            errors.push('Design must have a transparent background.');
          }
          
          setDesignAnalysis({
            width: img.width,
            height: img.height,
            hasTransparency: analysis.hasTransparency,
            colorCount: analysis.colorCount,
            hasGradients: analysis.hasGradients,
            dominantColors: analysis.dominantColors
          });
          
          // Auto-disable embroidery products if incompatible
          if (analysis.hasGradients || analysis.colorCount > 5) {
            setEnabledProducts(prev => ({
              ...prev,
              varsity_jacket: false,
              cap: false
            }));
          }
          
          setIsValidating(false);
          setValidationErrors(errors);
          resolve(errors.length === 0);
        };
        
        img.src = e.target.result;
        setDesignPreview(e.target.result);
      };
      
      reader.readAsDataURL(file);
    });
  }, []);
  
  // Analyze image data for color count, gradients, transparency
  const analyzeImageData = (imageData) => {
    const data = imageData.data;
    const colorSet = new Set();
    let hasTransparency = false;
    let hasGradients = false;
    let prevR = -1, prevG = -1, prevB = -1;
    let gradientCount = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // Check transparency
      if (a < 255) {
        hasTransparency = true;
      }
      
      // Quantize colors for counting
      const quantized = `${Math.round(r/32)}${Math.round(g/32)}${Math.round(b/32)}`;
      colorSet.add(quantized);
      
      // Detect gradients (smooth color transitions)
      if (prevR !== -1) {
        const diff = Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB);
        if (diff > 0 && diff < 20) {
          gradientCount++;
        }
      }
      
      prevR = r; prevG = g; prevB = b;
    }
    
    // If many small transitions, likely has gradients
    hasGradients = gradientCount > (data.length / 4) * 0.3;
    
    return {
      hasTransparency,
      colorCount: colorSet.size,
      hasGradients,
      dominantColors: Array.from(colorSet).slice(0, 5)
    };
  };
  
  // Handle file drop/select
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setDesignFile(file);
    const isValid = await validateAndAnalyzeDesign(file);
    
    if (isValid) {
      setStep(2);
    }
  };
  
  // Handle drag and drop
  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    setDesignFile(file);
    const isValid = await validateAndAnalyzeDesign(file);
    
    if (isValid) {
      setStep(2);
    }
  };
  
  // Get incompatibility reason for a product
  const getIncompatibilityReason = (productType) => {
    const preset = PRINT_PRESETS[productType];
    
    if (preset.printMethod === 'embroidery' && designAnalysis) {
      if (designAnalysis.hasGradients) {
        return "This design isn't compatible with embroidery.";
      }
      if (designAnalysis.colorCount > 5) {
        return "Too many colors for embroidery.";
      }
    }
    
    return null;
  };
  
  // Count enabled products
  const enabledCount = Object.values(enabledProducts).filter(Boolean).length;
  
  // Submit design
  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a design title');
      return;
    }
    
    if (enabledCount === 0) {
      toast.error('Please enable at least one product');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Prepare product configurations
      const productConfigs = Object.entries(enabledProducts)
        .filter(([_, enabled]) => enabled)
        .map(([productType, _]) => ({
          productType,
          color: productColors[productType],
          preset: PRINT_PRESETS[productType].id,
          printMethod: PRINT_PRESETS[productType].printMethod,
          basePrice: PRINT_PRESETS[productType].basePrice
        }));
      
      // Call onComplete with all data
      await onComplete({
        file: designFile,
        preview: designPreview,
        title,
        description,
        analysis: designAnalysis,
        products: productConfigs,
        status: DESIGN_STATES.SUBMITTED
      });
      
      toast.success('Design submitted successfully!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to submit design');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="design-upload-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {step === 1 && 'Upload Your Design'}
            {step === 2 && 'Preview Products'}
            {step === 3 && 'Design Details'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && 'Upload a high-quality PNG with transparent background'}
            {step === 2 && 'See how your design looks on different products'}
            {step === 3 && 'Add details and submit for approval'}
          </DialogDescription>
        </DialogHeader>
        
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          {[1, 2, 3].map((s) => (
            <div 
              key={s}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                s === step ? 'bg-[#0047FF]' : s < step ? 'bg-[#0047FF]/50' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        
        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                validationErrors.length > 0 ? 'border-red-500 bg-red-50' : 'border-border hover:border-[#0047FF]/50'
              }`}
            >
              {isValidating ? (
                <div className="space-y-4">
                  <Loader2 className="h-12 w-12 mx-auto animate-spin text-[#0047FF]" />
                  <p className="text-muted-foreground">Analyzing your design...</p>
                </div>
              ) : designPreview ? (
                <div className="space-y-4">
                  <div className="w-48 h-48 mx-auto bg-[#f0f0f0] rounded overflow-hidden" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'10\' height=\'10\' fill=\'%23ddd\'/%3E%3Crect x=\'10\' y=\'10\' width=\'10\' height=\'10\' fill=\'%23ddd\'/%3E%3C/svg%3E")' }}>
                    <img src={designPreview} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                  {validationErrors.length > 0 ? (
                    <div className="text-red-600 space-y-2">
                      <AlertTriangle className="h-8 w-8 mx-auto" />
                      <p className="font-medium">This design does not meet Caesura print standards.</p>
                      <ul className="text-sm space-y-1">
                        {validationErrors.map((err, i) => (
                          <li key={i}>• {err}</li>
                        ))}
                      </ul>
                      <Button
                        onClick={() => {
                          setDesignFile(null);
                          setDesignPreview(null);
                          setValidationErrors([]);
                        }}
                        variant="outline"
                        className="mt-4"
                      >
                        Try Another Design
                      </Button>
                    </div>
                  ) : (
                    <div className="text-green-600 space-y-2">
                      <Check className="h-8 w-8 mx-auto" />
                      <p className="font-medium">Design meets requirements!</p>
                      {designAnalysis && (
                        <p className="text-sm text-muted-foreground">
                          {designAnalysis.width} × {designAnalysis.height}px • {designAnalysis.colorCount} colors detected
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">Drop your design here or click to browse</p>
                    <p className="text-sm text-muted-foreground mt-1">PNG only • Transparent background • Min 4500 × 5400px</p>
                  </div>
                </div>
              )}
              
              <input
                type="file"
                accept="image/png"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                data-testid="design-file-input"
              />
            </div>
            
            {/* Requirements info */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Design Requirements</p>
                  <ul className="space-y-1">
                    <li>• PNG format with transparent background</li>
                    <li>• Minimum 4500 × 5400 pixels at 300 DPI</li>
                    <li>• Flat colors work best for all products</li>
                    <li>• Avoid very thin lines for embroidered items</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 2: Product Preview Grid */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Preview info */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {enabledCount} product{enabledCount !== 1 ? 's' : ''} enabled
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Change Design
              </Button>
            </div>
            
            {/* Product grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.keys(PRINT_PRESETS).map((productType) => (
                <ProductPreviewCard
                  key={productType}
                  productType={productType}
                  designImage={designPreview}
                  enabled={enabledProducts[productType] && !getIncompatibilityReason(productType)}
                  onToggle={(enabled) => setEnabledProducts(prev => ({ ...prev, [productType]: enabled }))}
                  incompatibilityReason={getIncompatibilityReason(productType)}
                  selectedColor={productColors[productType]}
                  onColorChange={(color) => setProductColors(prev => ({ ...prev, [productType]: color }))}
                />
              ))}
            </div>
            
            {/* Contrast warnings */}
            {Object.entries(enabledProducts).some(([type, enabled]) => {
              if (!enabled) return false;
              const color = productColors[type];
              return GARMENT_COLORS[color]?.contrastWarning === 'light';
            }) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Contrast Warning</p>
                    <p className="text-yellow-700">
                      Some designs may have low visibility on light-colored garments. 
                      Consider using darker colors for better results.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Next button */}
            <Button
              onClick={() => setStep(3)}
              disabled={enabledCount === 0}
              className="w-full rounded-full"
              size="lg"
            >
              Continue
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}
        
        {/* Step 3: Details & Submit */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Design summary */}
            <div className="flex gap-6">
              <div className="w-32 h-32 bg-muted rounded overflow-hidden flex-shrink-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'10\' height=\'10\' fill=\'%23ddd\'/%3E%3Crect x=\'10\' y=\'10\' width=\'10\' height=\'10\' fill=\'%23ddd\'/%3E%3C/svg%3E")' }}>
                <img src={designPreview} alt="Design" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm text-muted-foreground">Products enabled</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(enabledProducts)
                    .filter(([_, enabled]) => enabled)
                    .map(([type, _]) => (
                      <span key={type} className="bg-muted px-3 py-1 rounded-full text-sm">
                        {PRINT_PRESETS[type].name}
                      </span>
                    ))}
                </div>
              </div>
            </div>
            
            {/* Title */}
            <div>
              <Label htmlFor="design-title">Design Title *</Label>
              <Input
                id="design-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your design a name"
                className="mt-2"
                data-testid="design-title-input"
              />
            </div>
            
            {/* Description */}
            <div>
              <Label htmlFor="design-description">Description (Optional)</Label>
              <Textarea
                id="design-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about your design inspiration"
                className="mt-2"
                rows={3}
                data-testid="design-description-input"
              />
            </div>
            
            {/* Submission info */}
            <div className="bg-[#0047FF]/5 border border-[#0047FF]/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-[#0047FF] mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">What happens next?</p>
                  <p className="text-muted-foreground">
                    Your design will be reviewed by our team within 24-48 hours. 
                    Once approved, your products will go live on the marketplace.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 rounded-full"
              >
                <ChevronLeft className="mr-2 h-5 w-5" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !title.trim()}
                className="flex-1 rounded-full bg-[#0047FF] hover:bg-[#0047FF]/90"
                data-testid="submit-design-btn"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Submit for Approval
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
