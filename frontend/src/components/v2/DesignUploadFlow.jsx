import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Upload, Check, AlertTriangle, ChevronRight, ChevronLeft,
  Loader2, Palette, Eye, ShoppingBag, Info, AlertCircle, Edit3, X,
  Sparkles, ImagePlus
} from 'lucide-react';
import { toast } from 'sonner';
import { PRINT_PRESETS, GARMENT_COLORS, DESIGN_STATES } from '@/config/printPresets';
import MockupEditor from './MockupEditor';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// ── Validation config ──────────────────────────────────────────────
const VALIDATION_CONFIG = {
  hardFail: { minShortSide: 500 },
  softPass: { minShortSide: 2000 },
  preferred: { minWidth: 4500, minHeight: 5400 },
  embroidery: { maxColors: 4, hardMaxColors: 6 },
  allowedFormats: ['image/png', 'image/jpeg', 'image/webp']
};

const EDITOR_SUPPORTED_PRODUCTS = ['tshirt', 'hoodie', 'oversized_tshirt', 'bomber_jacket', 'sweatshirt'];

// ── Animations ─────────────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
};

// ── Warning badge (dark theme) ─────────────────────────────────────
const WarningBadge = ({ type, message }) => {
  const configs = {
    info: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-300', icon: Info },
    warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-300', icon: AlertTriangle },
    error: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-300', icon: AlertCircle },
  };
  const config = configs[type] || configs.info;
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-lg ${config.bg} ${config.border} border`}>
      <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.text}`} />
      <p className={`text-sm ${config.text}`}>{message}</p>
    </div>
  );
};

// ── Simple mockup preview ──────────────────────────────────────────
const SimpleMockup = ({ designImage, productType, garmentColor }) => {
  const preset = PRINT_PRESETS[productType];
  const mockupUrl = preset?.mockupImages?.[garmentColor] || preset?.mockupImages?.white;

  const getPrintZone = () => {
    switch (productType) {
      case 'bomber_jacket':
        return { top: '22%', left: '22%', width: '56%', height: '38%' };
      case 'sweatshirt':
        return { top: '22%', left: '25%', width: '50%', height: '38%' };
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
    <div className="relative aspect-[4/5] bg-neutral-900 overflow-hidden">
      <img
        src={mockupUrl}
        alt={`${preset?.name} mockup`}
        className="w-full h-full object-cover"
        crossOrigin="anonymous"
      />
      {designImage && (
        <div
          className="absolute pointer-events-none flex items-center justify-center"
          style={{ top: zone.top, left: zone.left, width: zone.width, height: zone.height }}
        >
          <img
            src={designImage}
            alt="Design preview"
            className="mix-blend-normal"
            style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
};

// ── Product card (dark theme) ──────────────────────────────────────
const ProductPreviewCard = ({
  productType, designImage, enabled, onToggle,
  incompatibilityReason, warningMessage,
  selectedColor, onColorChange, hasPlacement, onEditPlacement,
  index
}) => {
  const preset = PRINT_PRESETS[productType];
  const isEmbroidery = preset.printMethod === 'embroidery';
  const supportsEditor = EDITOR_SUPPORTED_PRODUCTS.includes(productType);
  const [showColors, setShowColors] = useState(false);

  return (
    <motion.div
      variants={fadeUp}
      className={`group relative overflow-hidden rounded-xl transition-all duration-300 ${
        enabled
          ? 'bg-white/[0.04] border border-white/10 hover:border-white/20'
          : 'bg-white/[0.02] border border-white/[0.05] opacity-50'
      }`}
    >
      {/* Mockup */}
      <div className="relative overflow-hidden rounded-t-xl">
        <SimpleMockup
          designImage={enabled ? designImage : null}
          productType={productType}
          garmentColor={selectedColor}
        />

        {/* Editor badge */}
        {supportsEditor && enabled && (
          <button
            onClick={onEditPlacement}
            className="absolute top-3 right-3 bg-white text-black px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 hover:bg-white/90 transition-colors shadow-lg shadow-black/20"
            data-testid={`edit-placement-${productType}`}
          >
            <Edit3 className="h-3 w-3" />
            {hasPlacement ? 'Edit' : 'Customize'}
          </button>
        )}

        {/* Incompatibility overlay */}
        {incompatibilityReason && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="text-center">
              <AlertCircle className="h-7 w-7 mx-auto mb-2 text-red-400" />
              <p className="text-sm font-medium text-red-300">{incompatibilityReason}</p>
            </div>
          </div>
        )}

        {/* Warning overlay */}
        {!incompatibilityReason && warningMessage && enabled && (
          <div className="absolute top-3 left-3 right-14">
            <div className="bg-amber-500/90 text-black px-2.5 py-1 rounded-full text-xs font-semibold text-center">
              {warningMessage}
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-white text-sm tracking-tight">{preset.name}</h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              {isEmbroidery ? 'Embroidered' : 'DTF Printed'} &middot; From &#8377;{preset.basePrice}
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={onToggle}
            disabled={!!incompatibilityReason}
            data-testid={`toggle-${productType}`}
            className="data-[state=checked]:bg-white data-[state=unchecked]:bg-neutral-700"
          />
        </div>

        {/* Color picker */}
        {enabled && (
          <div className="space-y-2">
            <button
              onClick={() => setShowColors(!showColors)}
              className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              <div
                className="w-4 h-4 rounded-full border border-white/20"
                style={{ backgroundColor: GARMENT_COLORS[selectedColor]?.hex }}
              />
              <span>{GARMENT_COLORS[selectedColor]?.name || 'Select Color'}</span>
              <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${showColors ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {showColors && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-1.5 flex-wrap overflow-hidden"
                >
                  {preset.availableColors.map(color => (
                    <button
                      key={color}
                      onClick={() => onColorChange(color)}
                      className={`w-7 h-7 rounded-full border-2 transition-all duration-200 ${
                        selectedColor === color
                          ? 'border-white scale-110 shadow-lg shadow-white/10'
                          : 'border-transparent hover:scale-105 hover:border-white/30'
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

// ── Step indicator ─────────────────────────────────────────────────
const StepIndicator = ({ currentStep, steps }) => (
  <div className="flex items-center gap-3">
    {steps.map((label, i) => {
      const stepNum = i + 1;
      const isActive = stepNum === Math.floor(currentStep);
      const isComplete = stepNum < currentStep;

      return (
        <div key={stepNum} className="flex items-center gap-3">
          {i > 0 && (
            <div className={`w-8 h-px transition-colors duration-300 ${
              isComplete ? 'bg-white/40' : 'bg-white/10'
            }`} />
          )}
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
              isActive
                ? 'bg-white text-black'
                : isComplete
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-neutral-600'
            }`}>
              {isComplete ? <Check className="h-3 w-3" /> : stepNum}
            </div>
            <span className={`text-xs font-medium tracking-wide transition-colors duration-300 hidden sm:block ${
              isActive ? 'text-white' : isComplete ? 'text-neutral-400' : 'text-neutral-600'
            }`}>
              {label}
            </span>
          </div>
        </div>
      );
    })}
  </div>
);

// ════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════
export default function DesignUploadFlow({ open, onOpenChange, onComplete }) {
  const [step, setStep] = useState(1);
  const [designFile, setDesignFile] = useState(null);
  const [designPreview, setDesignPreview] = useState(null);
  const [designAnalysis, setDesignAnalysis] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  // Editor state
  const [editorProduct, setEditorProduct] = useState(null);
  const [productPlacements, setProductPlacements] = useState({});

  const [enabledProducts, setEnabledProducts] = useState({
    tshirt: true,
    hoodie: true,
    oversized_tshirt: true,
    bomber_jacket: true,
    sweatshirt: true
  });

  const [productColors, setProductColors] = useState({
    tshirt: 'white',
    hoodie: 'black',
    oversized_tshirt: 'white',
    bomber_jacket: 'black',
    sweatshirt: 'black'
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(1);
        setDesignFile(null);
        setDesignPreview(null);
        setDesignAnalysis(null);
        setValidationResult(null);
        setIsDragActive(false);
        setEditorProduct(null);
        setProductPlacements({});
        setTitle('');
        setDescription('');
        setEnabledProducts({
          tshirt: true, hoodie: true, oversized_tshirt: true,
          bomber_jacket: true, sweatshirt: true
        });
      }, 300);
    }
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // ── Validation ───────────────────────────────────────────────────
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

  // ── File handlers ────────────────────────────────────────────────
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDesignFile(file);
    const result = await validateAndAnalyzeDesign(file);
    if (result.canProceed) {
      setStep(2);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setDesignFile(file);
    const result = await validateAndAnalyzeDesign(file);
    if (result.canProceed) {
      setStep(2);
    }
  };

  // ── Product status ───────────────────────────────────────────────
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

  // ── Editor ───────────────────────────────────────────────────────
  const handleOpenEditor = (productType) => {
    setEditorProduct(productType);
    setStep(2.5);
  };

  const handleSavePlacement = (placementData) => {
    setProductPlacements(prev => ({ ...prev, [editorProduct]: placementData }));
    setProductColors(prev => ({ ...prev, [editorProduct]: placementData.color }));
    setEditorProduct(null);
    setStep(2);
  };

  // ── Submit ───────────────────────────────────────────────────────
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

      toast.success('Design submitted for review!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to submit design');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render: MockupEditor step ────────────────────────────────────
  if (step === 2.5 && editorProduct) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-6xl h-[90vh] p-0 overflow-hidden" data-testid="mockup-editor-dialog">
          <MockupEditor
            designImage={designPreview}
            productType={editorProduct}
            initialPlacement={productPlacements[editorProduct]?.placement}
            onBack={() => { setEditorProduct(null); setStep(2); }}
            onSave={handleSavePlacement}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // ── Render: Main flow ────────────────────────────────────────────
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50"
          data-testid="design-upload-dialog"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#0A0A0A]" />

          {/* Subtle gradient atmosphere */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-radial from-blue-500/[0.04] to-transparent rounded-full" />
            <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-radial from-purple-500/[0.03] to-transparent rounded-full" />
          </div>

          {/* Content */}
          <div className="relative h-full flex flex-col">
            {/* ── Top bar ─────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-white/[0.06]">
              <StepIndicator
                currentStep={step}
                steps={['Upload', 'Products', 'Details']}
              />

              <button
                onClick={() => onOpenChange(false)}
                className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-neutral-400" />
              </button>
            </div>

            {/* ── Main content area ───────────────────────────── */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 md:py-12">
                <AnimatePresence mode="wait">

                  {/* ═══════════════════════════════════════════════ */}
                  {/* STEP 1: UPLOAD                                  */}
                  {/* ═══════════════════════════════════════════════ */}
                  {step === 1 && (
                    <motion.div key="step-1" {...fadeUp} className="space-y-8">
                      {/* Header */}
                      <div className="text-center space-y-3">
                        <motion.h1
                          className="text-4xl md:text-5xl font-bold text-white tracking-[-0.03em]"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          Upload Your Design
                        </motion.h1>
                        <motion.p
                          className="text-neutral-500 text-lg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          Drop your artwork and watch it come to life on products
                        </motion.p>
                      </div>

                      {/* Drop zone */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                      >
                        <div
                          onDrop={handleDrop}
                          onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
                          onDragLeave={() => setIsDragActive(false)}
                          onClick={() => !designPreview && fileInputRef.current?.click()}
                          className={`relative rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden ${
                            validationResult?.hardErrors?.length > 0
                              ? 'border-2 border-red-500/30 bg-red-500/[0.04]'
                              : isDragActive
                                ? 'border-2 border-white/30 bg-white/[0.04] scale-[1.01]'
                                : 'border-2 border-dashed border-white/[0.08] hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.03]'
                          }`}
                        >
                          {/* Animated gradient border on drag */}
                          {isDragActive && (
                            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                              <div className="absolute inset-[-2px] bg-gradient-conic from-blue-500 via-purple-500 via-pink-500 to-blue-500 animate-spin-slow opacity-20"
                                   style={{ animationDuration: '3s' }} />
                            </div>
                          )}

                          <div className="relative p-12 md:p-16">
                            {isValidating ? (
                              <div className="flex flex-col items-center gap-5">
                                <div className="relative">
                                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-white/60" />
                                  </div>
                                  <div className="absolute inset-0 rounded-full border-2 border-white/10 animate-ping" />
                                </div>
                                <p className="text-neutral-400 text-sm">Analyzing your design...</p>
                              </div>
                            ) : designPreview && validationResult ? (
                              <div className="flex flex-col items-center gap-6">
                                {/* Preview */}
                                <div className="relative group">
                                  <div
                                    className="w-56 h-56 md:w-64 md:h-64 rounded-xl overflow-hidden shadow-2xl shadow-black/40"
                                    style={{
                                      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'16\' height=\'16\' viewBox=\'0 0 16 16\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'8\' height=\'8\' fill=\'%23181818\'/%3E%3Crect x=\'8\' y=\'8\' width=\'8\' height=\'8\' fill=\'%23181818\'/%3E%3Crect x=\'8\' width=\'8\' height=\'8\' fill=\'%23141414\'/%3E%3Crect y=\'8\' width=\'8\' height=\'8\' fill=\'%23141414\'/%3E%3C/svg%3E")',
                                      backgroundSize: '16px 16px'
                                    }}
                                  >
                                    <img src={designPreview} alt="Preview" className="w-full h-full object-contain" />
                                  </div>
                                  {/* Glow effect */}
                                  <div className="absolute -inset-4 bg-gradient-radial from-white/[0.03] to-transparent rounded-2xl -z-10" />
                                </div>

                                {validationResult.hardErrors.length > 0 ? (
                                  <div className="space-y-4 text-center max-w-md">
                                    <div>
                                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-400" />
                                      <p className="font-semibold text-red-300">Unable to process this file</p>
                                    </div>
                                    {validationResult.hardErrors.map((err, i) => (
                                      <WarningBadge key={i} type="error" message={err} />
                                    ))}
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDesignFile(null);
                                        setDesignPreview(null);
                                        setValidationResult(null);
                                      }}
                                      variant="outline"
                                      className="mt-2 rounded-full border-white/10 text-white hover:bg-white/10 bg-transparent"
                                    >
                                      Try Another File
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="space-y-4 text-center">
                                    <div>
                                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                                        <Check className="h-5 w-5 text-emerald-400" />
                                      </div>
                                      <p className="font-semibold text-white">
                                        {validationResult.quality === 'optimal' ? 'Looking great!' : 'Design accepted'}
                                      </p>
                                      {designAnalysis && (
                                        <p className="text-sm text-neutral-500 mt-1">
                                          {designAnalysis.width} &times; {designAnalysis.height}px
                                          {designAnalysis.hasTransparency && ' \u00b7 Transparent'}
                                        </p>
                                      )}
                                    </div>

                                    {validationResult.warnings.length > 0 && (
                                      <div className="space-y-2 max-w-sm">
                                        {validationResult.warnings.map((warn, i) => (
                                          <WarningBadge key={i} type="warning" message={warn} />
                                        ))}
                                      </div>
                                    )}

                                    <Button
                                      onClick={(e) => { e.stopPropagation(); setStep(2); }}
                                      className="rounded-full bg-white text-black hover:bg-white/90 px-8 h-11 font-semibold text-sm shadow-lg shadow-white/10"
                                    >
                                      Continue to Products
                                      <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-5">
                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                                  isDragActive
                                    ? 'bg-white/10 scale-110'
                                    : 'bg-white/[0.04]'
                                }`}>
                                  <ImagePlus className={`h-9 w-9 transition-colors ${
                                    isDragActive ? 'text-white' : 'text-neutral-600'
                                  }`} />
                                </div>
                                <div className="text-center">
                                  <p className={`font-semibold text-lg transition-colors ${
                                    isDragActive ? 'text-white' : 'text-neutral-300'
                                  }`}>
                                    {isDragActive ? 'Drop it here' : 'Drop your design here'}
                                  </p>
                                  <p className="text-neutral-600 text-sm mt-1">
                                    or click to browse &middot; PNG recommended
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            data-testid="design-file-input"
                          />
                        </div>
                      </motion.div>

                      {/* Tips */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]"
                      >
                        <Sparkles className="h-5 w-5 text-neutral-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-neutral-500 space-y-1">
                          <p className="text-neutral-400 font-medium">Tips for best results</p>
                          <p>PNG with transparent background &middot; Higher resolution = sharper prints &middot; Our team optimizes every design before production</p>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* ═══════════════════════════════════════════════ */}
                  {/* STEP 2: PRODUCTS                                */}
                  {/* ═══════════════════════════════════════════════ */}
                  {step === 2 && (
                    <motion.div key="step-2" {...fadeUp} className="space-y-8">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-[-0.03em]">
                            Choose Products
                          </h1>
                          <p className="text-neutral-500 mt-2">
                            Select which products to sell with your design &middot; {enabledCount} enabled
                          </p>
                        </div>
                        <button
                          onClick={() => setStep(1)}
                          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors whitespace-nowrap pt-2"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Change Design
                        </button>
                      </div>

                      {/* Editor tip */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                      >
                        <Edit3 className="h-4 w-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-neutral-400">
                          Click <span className="text-white font-medium">Customize</span> on T-Shirts and Hoodies to precisely place your design
                        </p>
                      </motion.div>

                      {/* Product grid */}
                      <motion.div
                        variants={stagger}
                        initial="initial"
                        animate="animate"
                        className="grid grid-cols-2 lg:grid-cols-3 gap-4"
                      >
                        {Object.keys(PRINT_PRESETS).map((productType, index) => {
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
                              index={index}
                            />
                          );
                        })}
                      </motion.div>

                      {/* Continue */}
                      <div className="flex justify-end pt-2">
                        <Button
                          onClick={() => setStep(3)}
                          disabled={enabledCount === 0}
                          className="rounded-full bg-white text-black hover:bg-white/90 px-8 h-11 font-semibold text-sm shadow-lg shadow-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Continue
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* ═══════════════════════════════════════════════ */}
                  {/* STEP 3: DETAILS                                 */}
                  {/* ═══════════════════════════════════════════════ */}
                  {step === 3 && (
                    <motion.div key="step-3" {...fadeUp} className="space-y-8">
                      <h1 className="text-3xl md:text-4xl font-bold text-white tracking-[-0.03em]">
                        Final Details
                      </h1>

                      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
                        {/* Left: Preview */}
                        <div className="space-y-4">
                          <div
                            className="aspect-square rounded-xl overflow-hidden shadow-2xl shadow-black/40"
                            style={{
                              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'16\' height=\'16\' viewBox=\'0 0 16 16\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'8\' height=\'8\' fill=\'%23181818\'/%3E%3Crect x=\'8\' y=\'8\' width=\'8\' height=\'8\' fill=\'%23181818\'/%3E%3Crect x=\'8\' width=\'8\' height=\'8\' fill=\'%23141414\'/%3E%3Crect y=\'8\' width=\'8\' height=\'8\' fill=\'%23141414\'/%3E%3C/svg%3E")',
                              backgroundSize: '16px 16px'
                            }}
                          >
                            <img src={designPreview} alt="Design" className="w-full h-full object-contain" />
                          </div>

                          {/* Product chips */}
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(enabledProducts)
                              .filter(([_, enabled]) => enabled)
                              .map(([type, _]) => (
                                <span
                                  key={type}
                                  className="bg-white/[0.06] border border-white/[0.08] px-2.5 py-1 rounded-full text-xs text-neutral-300 flex items-center gap-1"
                                >
                                  {PRINT_PRESETS[type].name}
                                  {productPlacements[type] && <Check className="h-3 w-3 text-emerald-400" />}
                                </span>
                              ))}
                          </div>
                        </div>

                        {/* Right: Form */}
                        <div className="space-y-6">
                          <div>
                            <Label htmlFor="design-title" className="text-neutral-300 text-sm font-medium">
                              Design Title <span className="text-red-400">*</span>
                            </Label>
                            <Input
                              id="design-title"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder="Give your design a name"
                              className="mt-2 h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-neutral-600 focus:border-white/20 focus:ring-white/10 rounded-xl"
                              data-testid="design-title-input"
                            />
                          </div>

                          <div>
                            <Label htmlFor="design-description" className="text-neutral-300 text-sm font-medium">
                              Description <span className="text-neutral-600">(Optional)</span>
                            </Label>
                            <Textarea
                              id="design-description"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="Tell us about your design inspiration"
                              className="mt-2 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-neutral-600 focus:border-white/20 focus:ring-white/10 rounded-xl min-h-[100px]"
                              rows={4}
                              data-testid="design-description-input"
                            />
                          </div>

                          {/* What happens next */}
                          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                <Eye className="h-4 w-4 text-blue-400" />
                              </div>
                              <div>
                                <p className="font-medium text-white text-sm">What happens next?</p>
                                <p className="text-neutral-500 text-sm mt-1 leading-relaxed">
                                  Your design will be reviewed within 24-48 hours. We&apos;ll optimize it for print quality, then your products go live on the marketplace!
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-3 pt-2">
                            <Button
                              onClick={() => setStep(2)}
                              className="flex-1 rounded-full h-11 bg-transparent border border-white/10 text-white hover:bg-white/5 font-medium"
                            >
                              <ChevronLeft className="mr-2 h-4 w-4" />
                              Back
                            </Button>
                            <Button
                              onClick={handleSubmit}
                              disabled={submitting || !title.trim()}
                              className="flex-1 rounded-full h-11 bg-white text-black hover:bg-white/90 font-semibold shadow-lg shadow-white/10 disabled:opacity-30"
                              data-testid="submit-design-btn"
                            >
                              {submitting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  <ShoppingBag className="mr-2 h-4 w-4" />
                                  Submit for Approval
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
