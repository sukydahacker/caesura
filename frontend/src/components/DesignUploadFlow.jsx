import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Upload, Check, AlertTriangle, ChevronRight, ChevronLeft, 
  Loader2, Palette, Eye, ShoppingBag, Info, AlertCircle, Edit3
} from 'lucide-react';
import { toast } from 'sonner';
import { PRINT_PRESETS, GARMENT_COLORS, DESIGN_STATES } from '@/config/printPresets';
import MockupEditor from './MockupEditor';

// Relaxed design requirements for creator-friendly validation
const VALIDATION_CONFIG = {
  hardFail: { minShortSide: 500 },
  softPass: { minShortSide: 2000 },
  preferred: { minWidth: 4500, minHeight: 5400 },
  embroidery: { maxColors: 4, hardMaxColors: 6 },
  allowedFormats: ['image/png', 'image/jpeg', 'image/webp']
};

// Products that support the mockup editor
const EDITOR_SUPPORTED_PRODUCTS = ['tshirt', 'hoodie', 'oversized_tshirt'];

// Warning badge component
const WarningBadge = ({ type, message }) => {
  const configs = {
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: Info },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: AlertTriangle },
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: AlertCircle },
  };
  const config = configs[type] || configs.info;
  const Icon = config.icon;
  
  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg ${config.bg} ${config.border} border`}>
      <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.text}`} />
      <p className={`text-sm ${config.text}`}>{message}</p>
    </div>
  );
};

// Simple mockup preview for non-editor products
const SimpleMockup = ({ designImage, productType, garmentColor }) => {
  const preset = PRINT_PRESETS[productType];
  const mockupUrl = preset?.mockupImages?.[garmentColor] || preset?.mockupImages?.white;
  
  // Each product has a defined "print zone" as % of the card:
  // top/left = where the zone starts, width/height = how big it is.
  // The design image will be contained & centred within this box.
  const getPrintZone = () => {
    switch (productType) {
      case 'varsity_jacket':
        return { top: '28%', left: '16%', width: '22%', height: '22%' };
      case 'cap':
        return { top: '32%', left: '30%', width: '40%', height: '18%' };
      case 'hoodie':
        return { top: '22%', left: '25%', width: '50%', height: '38%' };
      case 'oversized_tshirt':
        return { top: '20%', left: '25%', width: '50%', height: '38%' };
      case 'tshirt':
      default:
        return { top: '28%', left: '28%', width: '44%', height: '32%' };
    }
  };

  const zone = getPrintZone();

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
          className="absolute pointer-events-none flex items-center justify-center"
          style={{
            top: zone.top,
            left: zone.left,
            width: zone.width,
            height: zone.height,
          }}
        >
          <img 
            src={designImage} 
            alt="Design preview"
            className="mix-blend-normal"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
            }}
          />
        </div>
      )}
    </div>
  );
};

// Product card with editor integration
const ProductPreviewCard = ({ 
  productType, 
  designImage, 
  enabled, 
  onToggle, 
  incompatibilityReason,
  warningMessage,
  selectedColor,
  onColorChange,
  hasPlacement,
  onEditPlacement
}) => {
  const preset = PRINT_PRESETS[productType];
  const isEmbroidery = preset.printMethod === 'embroidery';
  const supportsEditor = EDITOR_SUPPORTED_PRODUCTS.includes(productType);
  const [showColors, setShowColors] = useState(false);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative border rounded-sm overflow-hidden transition-all ${
        enabled ? 'border-border' : 'border-border/50 opacity-60'
      }`}
    >
      <SimpleMockup 
        designImage={enabled ? designImage : null}
        productType={productType}
        garmentColor={selectedColor}
      />
      
      {/* Editor badge for supported products */}
      {supportsEditor && enabled && (
        <button
          onClick={onEditPlacement}
          className="absolute top-2 right-2 bg-[#0047FF] text-white px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-[#0047FF]/90 transition-colors"
          data-testid={`edit-placement-${productType}`}
        >
          <Edit3 className="h-3 w-3" />
          {hasPlacement ? 'Edit' : 'Customize'}
        </button>
      )}
      
      {/* Incompatibility overlay */}
      {incompatibilityReason && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
          <div className="text-center text-white">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-400" />
            <p className="text-sm font-medium">{incompatibilityReason}</p>
          </div>
        </div>
      )}
      
      {/* Warning overlay */}
      {!incompatibilityReason && warningMessage && enabled && (
        <div className="absolute top-2 left-2 right-12">
          <div className="bg-yellow-500/90 text-white px-2 py-1 rounded text-xs text-center">
            {warningMessage}
          </div>
        </div>
      )}
      
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
  const [step, setStep] = useState(1); // 1: Upload, 2: Editor, 3: Products, 4: Details
  const [designFile, setDesignFile] = useState(null);
  const [designPreview, setDesignPreview] = useState(null);
  const [designAnalysis, setDesignAnalysis] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  
  // Editor state
  const [editorProduct, setEditorProduct] = useState(null);
  const [productPlacements, setProductPlacements] = useState({});
  
  const [enabledProducts, setEnabledProducts] = useState({
    tshirt: true,
    hoodie: true,
    oversized_tshirt: true,
    varsity_jacket: true,
    cap: true
  });
  
  const [productColors, setProductColors] = useState({
    tshirt: 'white',
    hoodie: 'black',
    oversized_tshirt: 'white',
    varsity_jacket: 'black',
    cap: 'black'
  });
  
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
        setValidationResult(null);
        setEditorProduct(null);
        setProductPlacements({});
        setTitle('');
        setDescription('');
        setEnabledProducts({
          tshirt: true,
          hoodie: true,
          oversized_tshirt: true,
          varsity_jacket: true,
          cap: true
        });
      }, 300);
    }
  }, [open]);
  
  // Validation function
  const validateAndAnalyzeDesign = useCallback(async (file) => {
    setIsValidating(true);
    setValidationResult(null);
    
    const result = {
      canProceed: true,
      hardErrors: [],
      warnings: [],
      adminFlags: [],
      quality: 'optimal'
    };
    
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      result.hardErrors.push('Please upload an image file (PNG, JPEG, or WebP).');
      result.canProceed = false;
    }
    
    if (isImage && file.type !== 'image/png') {
      result.warnings.push('PNG format is recommended for best print quality.');
      result.adminFlags.push('format_conversion_needed');
    }
    
    const reader = new FileReader();
    
    return new Promise((resolve) => {
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = () => {
          const shortSide = Math.min(img.width, img.height);
          
          if (shortSide < VALIDATION_CONFIG.hardFail.minShortSide) {
            result.hardErrors.push(`Image is too small for printing. Minimum ${VALIDATION_CONFIG.hardFail.minShortSide}px required.`);
            result.canProceed = false;
          } else if (shortSide < VALIDATION_CONFIG.softPass.minShortSide) {
            result.warnings.push('Resolution is below recommended. May affect print sharpness.');
            result.adminFlags.push('low_resolution');
            result.quality = 'needs_optimization';
          } else if (img.width < VALIDATION_CONFIG.preferred.minWidth || img.height < VALIDATION_CONFIG.preferred.minHeight) {
            result.quality = 'acceptable';
          }
          
          // Analyze image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const sampleSize = Math.min(200, img.width, img.height);
          canvas.width = sampleSize;
          canvas.height = sampleSize;
          ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
          
          const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
          const analysis = analyzeImageData(imageData);
          
          if (!analysis.hasTransparency && !analysis.hasCleanBackground) {
            result.warnings.push('Background will be cleaned during print preparation.');
            result.adminFlags.push('background_cleanup_required');
          }
          
          const fullAnalysis = {
            width: img.width,
            height: img.height,
            hasTransparency: analysis.hasTransparency,
            hasCleanBackground: analysis.hasCleanBackground,
            colorCount: analysis.colorCount,
            hasGradients: analysis.hasGradients,
            quality: result.quality,
            adminFlags: result.adminFlags
          };
          
          setDesignAnalysis(fullAnalysis);
          
          // Auto-configure embroidery
          if (analysis.colorCount > VALIDATION_CONFIG.embroidery.hardMaxColors || analysis.hasGradients) {
            setEnabledProducts(prev => ({
              ...prev,
              varsity_jacket: false,
              cap: false
            }));
          }
          
          setIsValidating(false);
          setValidationResult(result);
          resolve(result);
        };
        
        img.onerror = () => {
          result.hardErrors.push('Could not read image file.');
          result.canProceed = false;
          setIsValidating(false);
          setValidationResult(result);
          resolve(result);
        };
        
        img.src = e.target.result;
        setDesignPreview(e.target.result);
      };
      
      reader.readAsDataURL(file);
    });
  }, []);
  
  // Image analysis helper
  const analyzeImageData = (imageData) => {
    const data = imageData.data;
    const colorSet = new Set();
    let transparentPixels = 0;
    let totalPixels = data.length / 4;
    let gradientCount = 0;
    
    const w = imageData.width;
    const h = imageData.height;
    const corners = [];
    const cornerPositions = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + (w - 1)) * 4];
    
    cornerPositions.forEach(pos => {
      if (pos < data.length - 3) {
        corners.push({ r: data[pos], g: data[pos + 1], b: data[pos + 2], a: data[pos + 3] });
      }
    });
    
    let hasCleanBackground = false;
    if (corners.length >= 4) {
      const first = corners[0];
      const allSimilar = corners.every(c => 
        Math.abs(c.r - first.r) < 30 && Math.abs(c.g - first.g) < 30 && Math.abs(c.b - first.b) < 30
      );
      const isLight = (first.r + first.g + first.b) / 3 > 200;
      hasCleanBackground = allSimilar && (isLight || first.a < 50);
    }
    
    let prevR = -1, prevG = -1, prevB = -1;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      
      if (a < 250) transparentPixels++;
      
      const quantized = `${Math.round(r/40)}${Math.round(g/40)}${Math.round(b/40)}`;
      colorSet.add(quantized);
      
      if (prevR !== -1 && a > 200) {
        const diff = Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB);
        if (diff > 0 && diff < 15) gradientCount++;
      }
      
      prevR = r; prevG = g; prevB = b;
    }
    
    return {
      hasTransparency: transparentPixels / totalPixels > 0.05,
      hasCleanBackground,
      colorCount: colorSet.size,
      hasGradients: gradientCount > totalPixels * 0.25
    };
  };
  
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setDesignFile(file);
    const result = await validateAndAnalyzeDesign(file);
    
    if (result.canProceed) {
      setStep(2); // Go to product selection first
    }
  };
  
  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    setDesignFile(file);
    const result = await validateAndAnalyzeDesign(file);
    
    if (result.canProceed) {
      setStep(2);
    }
  };
  
  // Product status helper
  const getProductStatus = (productType) => {
    const preset = PRINT_PRESETS[productType];
    
    if (preset.printMethod === 'embroidery' && designAnalysis) {
      if (designAnalysis.hasGradients) {
        return { incompatible: true, reason: "Not compatible with embroidery." };
      }
      if (designAnalysis.colorCount > VALIDATION_CONFIG.embroidery.hardMaxColors) {
        return { incompatible: true, reason: "Too many colors for embroidery." };
      }
      if (designAnalysis.colorCount > VALIDATION_CONFIG.embroidery.maxColors) {
        return { incompatible: false, warning: "May require color reduction." };
      }
    }
    
    return { incompatible: false, warning: null };
  };
  
  const enabledCount = Object.values(enabledProducts).filter(Boolean).length;
  
  // Open mockup editor
  const handleOpenEditor = (productType) => {
    setEditorProduct(productType);
    setStep(2.5); // Special editor step
  };
  
  // Save placement from editor
  const handleSavePlacement = (placementData) => {
    setProductPlacements(prev => ({
      ...prev,
      [editorProduct]: placementData
    }));
    setProductColors(prev => ({
      ...prev,
      [editorProduct]: placementData.color
    }));
    setEditorProduct(null);
    setStep(2); // Back to products
  };
  
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
      const productConfigs = Object.entries(enabledProducts)
        .filter(([_, enabled]) => enabled)
        .map(([productType, _]) => {
          const placement = productPlacements[productType];
          return {
            productType,
            color: productColors[productType],
            preset: PRINT_PRESETS[productType].id,
            printMethod: PRINT_PRESETS[productType].printMethod,
            basePrice: PRINT_PRESETS[productType].basePrice,
            // Include placement if customized
            placement: placement ? {
              view: placement.view,
              position: placement.placement,
              _productionSpec: placement._productionSpec
            } : null
          };
        });
      
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
  
  // Render mockup editor
  if (step === 2.5 && editorProduct) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-6xl h-[90vh] p-0 overflow-hidden" data-testid="mockup-editor-dialog">
          <MockupEditor
            designImage={designPreview}
            productType={editorProduct}
            initialPlacement={productPlacements[editorProduct]?.placement}
            onBack={() => {
              setEditorProduct(null);
              setStep(2);
            }}
            onSave={handleSavePlacement}
          />
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="design-upload-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {step === 1 && 'Upload Your Design'}
            {step === 2 && 'Choose Products'}
            {step === 3 && 'Design Details'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && 'Upload your artwork to see it on products'}
            {step === 2 && 'Select products and customize placement'}
            {step === 3 && 'Add details and submit for approval'}
          </DialogDescription>
        </DialogHeader>
        
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          {[1, 2, 3].map((s) => (
            <div 
              key={s}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                s === Math.floor(step) ? 'bg-[#0047FF]' : s < step ? 'bg-[#0047FF]/50' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        
        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-6">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                validationResult?.hardErrors?.length > 0 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-border hover:border-[#0047FF]/50 hover:bg-muted/30'
              }`}
            >
              {isValidating ? (
                <div className="space-y-4">
                  <Loader2 className="h-12 w-12 mx-auto animate-spin text-[#0047FF]" />
                  <p className="text-muted-foreground">Analyzing your design...</p>
                </div>
              ) : designPreview && validationResult ? (
                <div className="space-y-4">
                  <div 
                    className="w-48 h-48 mx-auto bg-[#f0f0f0] rounded overflow-hidden" 
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'10\' height=\'10\' fill=\'%23ddd\'/%3E%3Crect x=\'10\' y=\'10\' width=\'10\' height=\'10\' fill=\'%23ddd\'/%3E%3C/svg%3E")' }}
                  >
                    <img src={designPreview} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                  
                  {validationResult.hardErrors.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-red-600">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                        <p className="font-medium">Unable to process this file</p>
                      </div>
                      {validationResult.hardErrors.map((err, i) => (
                        <WarningBadge key={i} type="error" message={err} />
                      ))}
                      <Button
                        onClick={() => {
                          setDesignFile(null);
                          setDesignPreview(null);
                          setValidationResult(null);
                        }}
                        variant="outline"
                        className="mt-4"
                      >
                        Try Another File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-green-600">
                        <Check className="h-8 w-8 mx-auto mb-2" />
                        <p className="font-medium">
                          {validationResult.quality === 'optimal' ? 'Design looks great!' : 'Design accepted'}
                        </p>
                      </div>
                      
                      {designAnalysis && (
                        <p className="text-sm text-muted-foreground">
                          {designAnalysis.width} × {designAnalysis.height}px
                        </p>
                      )}
                      
                      {validationResult.warnings.length > 0 && (
                        <div className="space-y-2 max-w-md mx-auto">
                          {validationResult.warnings.map((warn, i) => (
                            <WarningBadge key={i} type="warning" message={warn} />
                          ))}
                        </div>
                      )}
                      
                      <Button
                        onClick={() => setStep(2)}
                        className="mt-4 rounded-full bg-[#0047FF] hover:bg-[#0047FF]/90"
                      >
                        Continue to Products
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">Drop your design here or click to browse</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      PNG recommended • Transparent background preferred
                    </p>
                  </div>
                </div>
              )}
              
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                data-testid="design-file-input"
              />
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground space-y-2">
                  <p className="font-medium text-foreground">Tips for best results</p>
                  <ul className="space-y-1">
                    <li>• PNG with transparent background works best</li>
                    <li>• Higher resolution = sharper prints</li>
                    <li>• Our team will optimize your design before production</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 2: Product Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {enabledCount} product{enabledCount !== 1 ? 's' : ''} enabled
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Change Design
              </Button>
            </div>
            
            {/* Editor tip */}
            <div className="bg-[#0047FF]/5 border border-[#0047FF]/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Edit3 className="h-4 w-4 text-[#0047FF] mt-0.5" />
                <p className="text-sm text-[#0047FF]">
                  Click <strong>Customize</strong> on T-Shirts and Hoodies to precisely place your design
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.keys(PRINT_PRESETS).map((productType) => {
                const status = getProductStatus(productType);
                return (
                  <ProductPreviewCard
                    key={productType}
                    productType={productType}
                    designImage={designPreview}
                    enabled={enabledProducts[productType] && !status.incompatible}
                    onToggle={(enabled) => setEnabledProducts(prev => ({ ...prev, [productType]: enabled }))}
                    incompatibilityReason={status.incompatible ? status.reason : null}
                    warningMessage={status.warning}
                    selectedColor={productColors[productType]}
                    onColorChange={(color) => setProductColors(prev => ({ ...prev, [productType]: color }))}
                    hasPlacement={!!productPlacements[productType]}
                    onEditPlacement={() => handleOpenEditor(productType)}
                  />
                );
              })}
            </div>
            
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
            <div className="flex gap-6">
              <div 
                className="w-32 h-32 bg-muted rounded overflow-hidden flex-shrink-0" 
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'10\' height=\'10\' fill=\'%23ddd\'/%3E%3Crect x=\'10\' y=\'10\' width=\'10\' height=\'10\' fill=\'%23ddd\'/%3E%3C/svg%3E")' }}
              >
                <img src={designPreview} alt="Design" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm text-muted-foreground">Products enabled</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(enabledProducts)
                    .filter(([_, enabled]) => enabled)
                    .map(([type, _]) => (
                      <span key={type} className="bg-muted px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        {PRINT_PRESETS[type].name}
                        {productPlacements[type] && <Check className="h-3 w-3 text-green-600" />}
                      </span>
                    ))}
                </div>
              </div>
            </div>
            
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
            
            <div className="bg-[#0047FF]/5 border border-[#0047FF]/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-[#0047FF] mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">What happens next?</p>
                  <p className="text-muted-foreground">
                    Your design will be reviewed within 24-48 hours. We'll optimize it for print quality, then your products go live!
                  </p>
                </div>
              </div>
            </div>
            
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
