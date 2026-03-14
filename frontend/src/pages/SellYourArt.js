import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as fabric from 'fabric';
import { uploadDesignImage, createDesign, getProductCatalog } from '@/lib/api';

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG   = '#0A0A0B';
const BG2  = '#111113';
const BG3  = '#1A1A1C';
const TP   = '#FAFAF9';
const TS   = 'rgba(250,250,249,0.55)';
const TT   = 'rgba(250,250,249,0.25)';
const BS   = 'rgba(250,250,249,0.08)';
const AS   = '#C8FF00';
const ERR  = '#FF3D00';
const body    = { fontFamily: '"DM Sans", system-ui, sans-serif' };
const display = { fontFamily: '"Clash Display", "Bebas Neue", sans-serif' };
const mono    = { fontFamily: '"JetBrains Mono", monospace' };

const CANVAS_W = 480;
const CANVAS_H = 572;

// ── Product collection groupings ────────────────────────────────────────────────
const COLLECTIONS = [
  {
    name: 'T-Shirts',
    icon: '👕',
    description: 'Crew necks, oversized, acid wash & more',
    keywords: ['T-Shirt', 'Tee', 'Baby Tee'],
  },
  {
    name: 'Hoodies & Jackets',
    icon: '🧥',
    description: 'Hoodies, sweatshirts, bombers & varsity',
    keywords: ['Hoodie', 'Sweatshirt', 'Bomber', 'Varsity', 'Zip Hoodie'],
  },
  {
    name: 'Bottomwear',
    icon: '👖',
    description: 'Joggers, shorts & sweatpants',
    keywords: ['Jogger', 'Short', 'Sweatpants', 'Legging'],
  },
  {
    name: 'Women\'s Wear',
    icon: '👗',
    description: 'Crop tops, dresses, skirts, tanks & more',
    keywords: ['Crop', 'Dress', 'Tank Top', 'Maternity', 'Kaftan', 'Skirt', 'Tube Top', 'Scrunchie', 'Bodycon', 'A Line', 'Womens'],
  },
  {
    name: 'Kids & Baby',
    icon: '🧒',
    description: 'Rompers, kids tees & outerwear',
    keywords: ['Kids', 'Romper'],
  },
  {
    name: 'Headwear',
    icon: '🧢',
    description: 'Caps, bucket hats, snapbacks & balaclava',
    keywords: ['Cap', 'Hat', 'Snapback', 'Trucker', 'Balaclava', 'Bucket'],
  },
  {
    name: 'Drinkware',
    icon: '☕',
    description: 'Mugs, sippers, tumblers & bottles',
    keywords: ['Mug', 'Sipper', 'Tumbler', 'Bottle', 'Enamel'],
  },
  {
    name: 'Bags & Accessories',
    icon: '👜',
    description: 'Tote bags, drawstring bags, keychains & more',
    keywords: ['Tote', 'Bag', 'Keychain', 'Badge', 'Luggage', 'Fridge Magnet', 'Dog Tag', 'Phone', 'Grip', 'Pen', 'Bookmark', 'Arm Sleeves'],
  },
  {
    name: 'Home & Living',
    icon: '🏠',
    description: 'Posters, cushions, coasters, puzzles & more',
    keywords: ['Poster', 'Canvas', 'Cushion', 'Pillow', 'Coaster', 'Mouse Pad', 'Puzzle', 'Tapestry', 'Tablerunner', 'Placemat', 'Napkin', 'Ornament', 'Acrylic', 'Gaming Pad'],
  },
  {
    name: 'Stationery',
    icon: '📓',
    description: 'Notebooks, planners, stickers & greeting cards',
    keywords: ['Sticker', 'NotePad', 'Notebook', 'Planner', 'Sketchbook', 'Greeting', 'Postcard'],
  },
  {
    name: 'Phone Cases',
    icon: '📱',
    description: 'iPhone, Samsung, OnePlus & Redmi cases',
    keywords: ['IPHONE', 'iPhone', 'OnePlus', 'Samsung', 'Redmi', 'Mobile Case', 'Glass Case', 'Hard Clear'],
  },
  {
    name: 'Pet Wear',
    icon: '🐕',
    description: 'Dog tees & pet tags',
    keywords: ['Dog', 'Pet'],
  },
  {
    name: 'AOP (All-Over Print)',
    icon: '🎨',
    description: 'Full all-over print apparel & accessories',
    keywords: ['AOP'],
  },
  {
    name: 'Wearable Art',
    icon: '✨',
    description: 'Tattoos, patches, bandanas & scarves',
    keywords: ['Tattoo', 'Patch', 'Bandana', 'Scarf', 'Stole', 'Apron'],
  },
];

// Map a catalog category to a collection
function categorizeProduct(categoryName) {
  for (const col of COLLECTIONS) {
    if (col.keywords.some(kw => categoryName.toLowerCase().includes(kw.toLowerCase()))) {
      return col.name;
    }
  }
  return null; // uncategorized
}

// Products that have mockup templates for the canvas editor
const PRODUCT_TEMPLATES = {
  'Terry Oversized Tee | UT27': {
    template: '/mockups/tshirt-offwhitefront.png',
    printArea: { x: 96, y: 122, w: 288, h: 278 },
  },
  'Hoodie': {
    template: '/mockups/tshirt-whitefront.jpg',
    printArea: { x: 110, y: 158, w: 260, h: 226 },
  },
};

// Default print area for products without a specific template
const DEFAULT_TEMPLATE = {
  template: '/mockups/tshirt-offwhitefront.png',
  printArea: { x: 96, y: 122, w: 288, h: 278 },
};

const MAX_FILE_MB = 20;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

function inputStyle(focused) {
  return {
    width: '100%',
    padding: '14px 16px',
    background: BG3,
    border: `1px solid ${focused ? 'rgba(250,250,249,0.25)' : BS}`,
    borderRadius: '8px',
    color: TP,
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    ...body,
    transition: 'border-color 0.15s',
  };
}

// Convert a URL (same-origin) to dataURL to avoid canvas taint issues
async function toDataURL(src) {
  const resp = await fetch(src);
  const blob = await resp.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export default function SellYourArt() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);
  const designObjRef = useRef(null);

  const [step, setStep] = useState(1);
  const [dragOver, setDragOver] = useState(false);

  // Step 1 — product selection
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Step 2 — file upload
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState('');

  // Step 3 — canvas editor
  const [exporting, setExporting] = useState(false);
  const [mockupImageUrl, setMockupImageUrl] = useState('');
  const [placement, setPlacement] = useState(null);

  // Step 4 — details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [focused, setFocused] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const TOTAL_STEPS = 4;

  // ── Load catalog ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (step === 1 && catalog.length === 0) {
      setCatalogLoading(true);
      getProductCatalog()
        .then(res => setCatalog(res.data || []))
        .catch(() => setCatalog([]))
        .finally(() => setCatalogLoading(false));
    }
  }, [step, catalog.length]);

  // Group catalog by collection
  const catalogByCollection = {};
  const uncategorized = [];
  catalog.forEach(item => {
    const col = categorizeProduct(item.category);
    if (col) {
      if (!catalogByCollection[col]) catalogByCollection[col] = [];
      catalogByCollection[col].push(item);
    } else {
      uncategorized.push(item);
    }
  });

  // Filter products by search
  const filteredCatalog = searchQuery.trim()
    ? catalog.filter(c => c.category.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  // ── File validation ────────────────────────────────────────────────────────

  const validateFile = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Only PNG, JPG, or WEBP files are accepted.';
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      return `File must be smaller than ${MAX_FILE_MB}MB.`;
    }
    return null;
  };

  const handleFile = (file) => {
    if (!file) return;
    const err = validateFile(file);
    if (err) { setFileError(err); return; }
    setFileError('');
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const uploadAndProceed = async () => {
    if (!imageFile) return;
    setUploading(true);
    setFileError('');
    try {
      const res = await uploadDesignImage(imageFile);
      setImageUrl(res.data.url || res.data.image_url || '');
      setStep(3);
    } catch (e) {
      setFileError(e.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Get template for selected product ────────────────────────────────────────

  const getProductTemplate = () => {
    if (!selectedCategory) return DEFAULT_TEMPLATE;
    return PRODUCT_TEMPLATES[selectedCategory.category] || DEFAULT_TEMPLATE;
  };

  // ── Canvas initialisation ──────────────────────────────────────────────────

  useEffect(() => {
    if (step !== 3 || !canvasElRef.current) return;

    let cancelled = false;

    const init = async () => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
        designObjRef.current = null;
      }

      const tmpl = getProductTemplate();

      const canvas = new fabric.Canvas(canvasElRef.current, {
        width: CANVAS_W,
        height: CANVAS_H,
        backgroundColor: '#111113',
        selection: false,
      });
      if (cancelled) { canvas.dispose(); return; }
      fabricRef.current = canvas;

      try {
        const bgDataUrl = await toDataURL(tmpl.template);
        if (cancelled) return;
        const bgImg = await fabric.FabricImage.fromURL(bgDataUrl);
        if (cancelled) return;
        const scaleX = CANVAS_W / bgImg.width;
        const scaleY = CANVAS_H / bgImg.height;
        const bgScale = Math.max(scaleX, scaleY);
        bgImg.set({
          originX: 'center', originY: 'center',
          left: CANVAS_W / 2, top: CANVAS_H / 2,
          scaleX: bgScale, scaleY: bgScale,
          selectable: false, evented: false,
        });
        canvas.backgroundImage = bgImg;
        canvas.renderAll();
      } catch (_) {}

      const pa = tmpl.printArea;
      const boundary = new fabric.Rect({
        left: pa.x, top: pa.y,
        width: pa.w, height: pa.h,
        fill: 'transparent',
        stroke: '#C8FF00',
        strokeWidth: 1.5,
        strokeDashArray: [8, 4],
        selectable: false, evented: false,
        name: 'printArea',
      });
      canvas.add(boundary);

      const label = new fabric.IText('PRINT AREA', {
        left: pa.x + 6, top: pa.y + 4,
        fontSize: 9,
        fill: 'rgba(200,255,0,0.45)',
        fontFamily: 'monospace',
        selectable: false, evented: false,
        editable: false,
        name: 'printAreaLabel',
      });
      canvas.add(label);

      if (imagePreview) {
        const designImg = await fabric.FabricImage.fromURL(imagePreview);
        if (cancelled) return;
        const maxW = pa.w * 0.72;
        const maxH = pa.h * 0.72;
        const scale = Math.min(maxW / designImg.width, maxH / designImg.height);
        designImg.set({
          left: pa.x + pa.w / 2,
          top: pa.y + pa.h / 2,
          originX: 'center', originY: 'center',
          scaleX: scale, scaleY: scale,
          name: 'design',
          cornerSize: 9,
          cornerColor: '#C8FF00',
          cornerStrokeColor: '#0A0A0B',
          borderColor: '#C8FF00',
          transparentCorners: false,
          padding: 4,
        });
        canvas.add(designImg);
        canvas.setActiveObject(designImg);
        designObjRef.current = designImg;
      }

      canvas.renderAll();
    };

    init();

    return () => {
      cancelled = true;
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
        designObjRef.current = null;
      }
    };
  }, [step, selectedCategory, imagePreview]);

  // ── Export mockup ─────────────────────────────────────────────────────────

  const handleExportAndProceed = async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    setExporting(true);
    setError('');

    try {
      const tmpl = getProductTemplate();
      const pa = tmpl.printArea;
      const designObj = designObjRef.current;

      let placementCoords = null;
      if (designObj) {
        placementCoords = {
          canvas_w: CANVAS_W,
          canvas_h: CANVAS_H,
          print_area: { x: pa.x, y: pa.y, w: pa.w, h: pa.h },
          left: designObj.left,
          top: designObj.top,
          scaleX: designObj.scaleX,
          scaleY: designObj.scaleY,
          angle: designObj.angle || 0,
          left_pct: parseFloat(((designObj.left - pa.x) / pa.w).toFixed(4)),
          top_pct: parseFloat(((designObj.top - pa.y) / pa.h).toFixed(4)),
          width_pct: parseFloat((designObj.width * designObj.scaleX / pa.w).toFixed(4)),
          height_pct: parseFloat((designObj.height * designObj.scaleY / pa.h).toFixed(4)),
        };
      }

      canvas.discardActiveObject();
      canvas.renderAll();

      const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 1 });

      const fetchRes = await fetch(dataUrl);
      const blob = await fetchRes.blob();
      const mockupFile = new File([blob], 'mockup.png', { type: 'image/png' });
      const uploadRes = await uploadDesignImage(mockupFile);
      const mockupUrl = uploadRes.data.url || uploadRes.data.image_url;

      setMockupImageUrl(mockupUrl);
      setPlacement(placementCoords);
      setStep(4);
    } catch (e) {
      setError('Failed to export mockup. Please try again.');
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  // ── Submit design ──────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('Please enter a title.'); return; }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError('Please enter a valid price greater than 0.'); return;
    }

    setSubmitting(true);
    try {
      await createDesign({
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        image_url: imageUrl,
        mockup_image_url: mockupImageUrl,
        product_type: selectedCategory?.category || 'Terry Oversized Tee | UT27',
        placement_coordinates: placement,
      });
      setSuccess(true);
    } catch (e) {
      setError(e.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step labels ──────────────────────────────────────────────────────────────

  const STEP_LABELS = ['Product', 'Upload', 'Position', 'Details'];

  // ── Success ────────────────────────────────────────────────────────────────

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '440px' }}>
          <div style={{ fontSize: '52px', marginBottom: '24px' }}>✦</div>
          <h2 style={{ ...display, fontWeight: 700, fontSize: '40px', color: AS, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
            Design Submitted!
          </h2>
          <p style={{ ...body, fontSize: '16px', color: TS, lineHeight: 1.7, margin: '0 0 12px' }}>
            Your design is pending admin review. Once approved it goes live on the marketplace — Qikink handles all printing and shipping automatically.
          </p>
          <p style={{ ...mono, fontSize: '11px', color: TT, margin: '0 0 40px' }}>You keep 80% of every sale.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => { setSuccess(false); setStep(1); setImageFile(null); setImagePreview(null); setImageUrl(''); setMockupImageUrl(''); setPlacement(null); setTitle(''); setDescription(''); setPrice(''); setSelectedCategory(null); setSelectedCollection(null); }}
              style={{ ...body, padding: '12px 28px', borderRadius: '999px', background: BG3, border: `1px solid ${BS}`, color: TP, fontWeight: 500, cursor: 'pointer', fontSize: '14px' }}
            >
              Upload Another
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              style={{ ...body, padding: '12px 28px', borderRadius: '999px', background: AS, border: 'none', color: BG, fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TP }}>
      {/* Header */}
      <div style={{ padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${BS}` }}>
        <button
          onClick={() => {
            if (step === 1 && selectedCollection) {
              setSelectedCollection(null);
              setSelectedCategory(null);
            } else if (step > 1) {
              setStep(step - 1);
            } else {
              navigate('/');
            }
          }}
          style={{ ...body, background: 'none', border: 'none', color: TS, cursor: 'pointer', fontSize: '14px', padding: 0 }}
        >
          ← {step > 1 ? 'Back' : (selectedCollection ? 'Collections' : 'Home')}
        </button>
        <span style={{ ...mono, fontSize: '11px', color: TT, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Caesura / Sell Your Art
        </span>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {STEP_LABELS.map((label, i) => {
            const s = i + 1;
            const isActive = s === step;
            const isDone = s < step;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: isActive ? AS : isDone ? 'rgba(200,255,0,0.4)' : BG3,
                  border: `1px solid ${isActive ? AS : isDone ? 'rgba(200,255,0,0.3)' : BS}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 700, color: isActive ? BG : isDone ? AS : TT,
                  ...mono, transition: 'all 0.3s',
                }}>
                  {isDone ? '✓' : s}
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div style={{ width: '16px', height: '1px', background: isDone ? 'rgba(200,255,0,0.3)' : BS }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* ── STEP 1: Choose Product ── */}
        {step === 1 && (
          <div>
            <span style={{ ...mono, fontSize: '11px', color: TT, letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
              Step 1 of {TOTAL_STEPS} — Choose Product
            </span>
            <h1 style={{ ...display, fontWeight: 700, fontSize: 'clamp(28px, 5vw, 52px)', margin: '0 0 8px', lineHeight: 0.95, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
              Product Library
            </h1>
            <p style={{ ...body, fontSize: '15px', color: TS, margin: '12px 0 28px', lineHeight: 1.6 }}>
              Choose what product to print your design on. We support <span style={{ color: AS }}>140+ product types</span> across apparel, accessories, home decor & more.
            </p>

            {/* Search bar */}
            <div style={{ maxWidth: '480px', marginBottom: '32px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: TT, fontSize: '16px', pointerEvents: 'none' }}>🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products — e.g. hoodie, mug, poster..."
                style={{ ...inputStyle(false), paddingLeft: '44px', background: BG2 }}
              />
            </div>

            {catalogLoading ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <p style={{ ...mono, fontSize: '13px', color: TT }}>Loading product catalog...</p>
              </div>
            ) : searchQuery.trim() ? (
              /* Search results */
              <div>
                <p style={{ ...mono, fontSize: '11px', color: TT, marginBottom: '16px' }}>
                  {filteredCatalog.length} result{filteredCatalog.length !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                  {filteredCatalog.map(item => (
                    <ProductCard
                      key={item.category}
                      item={item}
                      selected={selectedCategory?.category === item.category}
                      onSelect={() => {
                        setSelectedCategory(item);
                        setSearchQuery('');
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : selectedCollection ? (
              /* Products within a collection */
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '28px' }}>
                    {COLLECTIONS.find(c => c.name === selectedCollection)?.icon}
                  </span>
                  <h2 style={{ ...display, fontSize: '24px', fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>
                    {selectedCollection}
                  </h2>
                  <span style={{ ...mono, fontSize: '11px', color: TT, marginLeft: '8px' }}>
                    {(catalogByCollection[selectedCollection] || []).length} products
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                  {(catalogByCollection[selectedCollection] || []).map(item => (
                    <ProductCard
                      key={item.category}
                      item={item}
                      selected={selectedCategory?.category === item.category}
                      onSelect={() => setSelectedCategory(item)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Collection grid */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                {COLLECTIONS.map(col => {
                  const count = (catalogByCollection[col.name] || []).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={col.name}
                      onClick={() => setSelectedCollection(col.name)}
                      style={{
                        background: BG2,
                        border: `1px solid ${BS}`,
                        borderRadius: '16px',
                        padding: '28px 24px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(200,255,0,0.3)';
                        e.currentTarget.style.background = 'rgba(200,255,0,0.04)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = BS;
                        e.currentTarget.style.background = BG2;
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ fontSize: '36px', lineHeight: 1 }}>{col.icon}</div>
                      <div>
                        <h3 style={{ ...body, fontSize: '16px', fontWeight: 700, color: TP, margin: '0 0 4px' }}>
                          {col.name}
                        </h3>
                        <p style={{ ...body, fontSize: '13px', color: TS, margin: '0 0 8px', lineHeight: 1.4 }}>
                          {col.description}
                        </p>
                        <span style={{ ...mono, fontSize: '10px', color: TT, letterSpacing: '0.1em' }}>
                          {count} PRODUCT{count !== 1 ? 'S' : ''}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected product confirmation bar */}
            {selectedCategory && (
              <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                background: BG2, borderTop: `1px solid rgba(200,255,0,0.2)`,
                padding: '16px 40px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                zIndex: 50,
                backdropFilter: 'blur(20px)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    background: 'rgba(200,255,0,0.1)', border: `1px solid rgba(200,255,0,0.2)`,
                    borderRadius: '10px', padding: '8px 16px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <span style={{ ...mono, fontSize: '11px', color: AS }}>SELECTED</span>
                  </div>
                  <div>
                    <p style={{ ...body, fontSize: '15px', fontWeight: 600, color: TP, margin: 0 }}>
                      {selectedCategory.category}
                    </p>
                    <p style={{ ...mono, fontSize: '11px', color: TT, margin: 0 }}>
                      {selectedCategory.sizes?.length || 0} sizes · {selectedCategory.colors?.length || 0} colors · Base ₹{Math.min(...(selectedCategory.base_prices || [0]))}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    style={{ ...body, padding: '10px 20px', borderRadius: '999px', background: 'transparent', border: `1px solid ${BS}`, color: TS, fontSize: '13px', cursor: 'pointer' }}
                  >
                    Change
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    style={{ ...body, padding: '12px 32px', borderRadius: '999px', background: AS, border: 'none', color: BG, fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Upload Design →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Upload Design ── */}
        {step === 2 && (
          <div style={{ maxWidth: '640px' }}>
            <span style={{ ...mono, fontSize: '11px', color: TT, letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
              Step 2 of {TOTAL_STEPS} — Upload Design
            </span>
            <h1 style={{ ...display, fontWeight: 700, fontSize: 'clamp(36px, 6vw, 64px)', margin: '0 0 8px', lineHeight: 0.95, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
              Upload Your Art
            </h1>
            <p style={{ ...body, fontSize: '16px', color: TS, margin: '16px 0 12px', lineHeight: 1.6 }}>
              Upload your design — we'll put it on our editor where you can position it on your <span style={{ color: AS }}>{selectedCategory?.category || 'product'}</span>.
            </p>

            {/* Selected product badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(200,255,0,0.08)', border: `1px solid rgba(200,255,0,0.2)`, borderRadius: '999px', padding: '6px 14px', marginBottom: '32px' }}>
              <span style={{ ...mono, fontSize: '10px', color: AS, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {selectedCategory?.category || 'T-Shirt'}
              </span>
            </div>

            {/* Guidelines */}
            <div style={{ background: BG2, border: `1px solid ${BS}`, borderRadius: '10px', padding: '16px 20px', marginBottom: '28px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              {[
                ['Format', 'PNG, JPG, WEBP'],
                ['Max size', '20 MB'],
                ['Resolution', '300 DPI recommended'],
                ['Background', 'Transparent PNG ideal'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p style={{ ...mono, fontSize: '9px', color: TT, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 2px' }}>{k}</p>
                  <p style={{ ...body, fontSize: '13px', color: TS, margin: 0 }}>{v}</p>
                </div>
              ))}
            </div>

            {/* Drop zone */}
            <div
              onClick={() => !imagePreview && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragOver ? AS : imagePreview ? 'transparent' : BS}`,
                borderRadius: '16px',
                background: imagePreview ? 'transparent' : dragOver ? 'rgba(200,255,0,0.04)' : BG2,
                minHeight: imagePreview ? 'auto' : '240px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: imagePreview ? 'default' : 'pointer',
                overflow: 'hidden',
                transition: 'all 0.2s',
                marginBottom: '20px',
              }}
            >
              {imagePreview ? (
                <div style={{ position: 'relative', width: '100%' }}>
                  <img src={imagePreview} alt="Design preview" style={{ width: '100%', maxHeight: '320px', objectFit: 'contain', borderRadius: '14px', display: 'block' }} />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    style={{ position: 'absolute', top: '12px', right: '12px', ...body, padding: '7px 14px', borderRadius: '999px', background: 'rgba(0,0,0,0.7)', border: `1px solid ${BS}`, color: TP, fontSize: '12px', cursor: 'pointer', backdropFilter: 'blur(8px)' }}
                  >
                    Change image
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.3 }}>⬆</div>
                  <p style={{ ...body, fontSize: '15px', color: TS, margin: '0 0 6px', fontWeight: 500 }}>
                    Drop your design here, or <span style={{ color: AS }}>browse files</span>
                  </p>
                  <p style={{ ...mono, fontSize: '11px', color: TT, margin: 0 }}>PNG · JPG · WEBP · max 20 MB</p>
                </div>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />

            {fileError && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,61,0,0.08)', border: `1px solid rgba(255,61,0,0.2)`, marginBottom: '16px' }}>
                <p style={{ ...body, fontSize: '14px', color: ERR, margin: 0 }}>{fileError}</p>
              </div>
            )}

            <button
              onClick={uploadAndProceed}
              disabled={!imageFile || uploading}
              style={{ ...body, padding: '15px 48px', borderRadius: '999px', background: imageFile && !uploading ? AS : BG3, border: 'none', color: imageFile && !uploading ? BG : TS, fontSize: '15px', fontWeight: 700, cursor: imageFile && !uploading ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
            >
              {uploading ? 'Uploading…' : 'Position on Product →'}
            </button>
          </div>
        )}

        {/* ── STEP 3: Canvas Editor ── */}
        {step === 3 && (
          <div>
            <span style={{ ...mono, fontSize: '11px', color: TT, letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
              Step 3 of {TOTAL_STEPS} — Position Your Design
            </span>
            <h1 style={{ ...display, fontWeight: 700, fontSize: 'clamp(28px, 5vw, 52px)', margin: '0 0 8px', lineHeight: 0.95, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
              Design Editor
            </h1>
            <p style={{ ...body, fontSize: '15px', color: TS, margin: '12px 0 28px', lineHeight: 1.6 }}>
              Drag, resize, and rotate your design. Keep it inside the <span style={{ color: AS }}>dashed print area</span>.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: `${CANVAS_W}px 1fr`, gap: '40px', alignItems: 'start' }}>
              {/* Canvas */}
              <div>
                <div style={{ border: `1px solid ${BS}`, borderRadius: '12px', overflow: 'hidden', display: 'inline-block', lineHeight: 0 }}>
                  <canvas ref={canvasElRef} />
                </div>
                <p style={{ ...mono, fontSize: '10px', color: TT, marginTop: '8px', textAlign: 'center' }}>
                  Scroll to zoom · Drag to reposition · Corner handles to resize/rotate
                </p>
              </div>

              {/* Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '8px' }}>
                <div style={{ background: BG2, borderRadius: '12px', padding: '20px', border: `1px solid ${BS}` }}>
                  <p style={{ ...mono, fontSize: '10px', color: TT, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>Product</p>
                  <p style={{ ...body, fontWeight: 600, fontSize: '15px', color: TP, margin: '0 0 4px' }}>
                    {selectedCategory?.category || 'T-Shirt'}
                  </p>
                  <p style={{ ...mono, fontSize: '10px', color: TT, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '12px 0 6px' }}>Available sizes</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(selectedCategory?.sizes || ['S', 'M', 'L', 'XL', 'XXL']).map(s => (
                      <span key={s} style={{ ...mono, fontSize: '11px', color: TS, background: BG3, border: `1px solid ${BS}`, borderRadius: '4px', padding: '3px 8px' }}>{s}</span>
                    ))}
                  </div>
                  {selectedCategory?.colors?.length > 0 && (
                    <>
                      <p style={{ ...mono, fontSize: '10px', color: TT, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '12px 0 6px' }}>Available colors</p>
                      <p style={{ ...body, fontSize: '12px', color: TS, margin: 0 }}>
                        {selectedCategory.colors.slice(0, 8).join(', ')}
                        {selectedCategory.colors.length > 8 ? ` +${selectedCategory.colors.length - 8} more` : ''}
                      </p>
                    </>
                  )}
                </div>

                <div style={{ background: 'rgba(200,255,0,0.04)', border: `1px solid rgba(200,255,0,0.15)`, borderRadius: '12px', padding: '16px 20px' }}>
                  <p style={{ ...mono, fontSize: '10px', color: AS, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 8px' }}>Print method</p>
                  <p style={{ ...body, fontSize: '14px', color: TP, margin: 0 }}>DTF (Direct to Film) via Qikink — vibrant colours, works on all fabric types, no minimum order.</p>
                </div>

                <div style={{ background: BG2, borderRadius: '12px', padding: '20px', border: `1px solid ${BS}` }}>
                  <p style={{ ...mono, fontSize: '10px', color: TT, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>Tips</p>
                  {[
                    'Stay within the dashed yellow-green boundary',
                    'Use a PNG with transparent background for best results',
                    'Rotate using the corner handle',
                  ].map((tip, i) => (
                    <p key={i} style={{ ...body, fontSize: '13px', color: TS, margin: '0 0 8px', paddingLeft: '12px', borderLeft: `2px solid ${BS}` }}>{tip}</p>
                  ))}
                </div>

                {error && (
                  <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,61,0,0.08)', border: `1px solid rgba(255,61,0,0.2)` }}>
                    <p style={{ ...body, fontSize: '14px', color: ERR, margin: 0 }}>{error}</p>
                  </div>
                )}

                <button
                  onClick={handleExportAndProceed}
                  disabled={exporting}
                  style={{ ...body, padding: '15px 40px', borderRadius: '999px', background: exporting ? BG3 : AS, border: 'none', color: exporting ? TS : BG, fontSize: '15px', fontWeight: 700, cursor: exporting ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                >
                  {exporting ? 'Generating mockup…' : 'Looks Good — Add Details →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Details & submit ── */}
        {step === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'start', maxWidth: '900px' }}>
            {/* Left: mockup preview */}
            <div>
              <p style={{ ...mono, fontSize: '10px', color: TT, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>Your mockup</p>
              {mockupImageUrl ? (
                <img src={mockupImageUrl} alt="Mockup preview" style={{ width: '100%', borderRadius: '12px', border: `1px solid ${BS}`, display: 'block' }} />
              ) : (
                <div style={{ aspectRatio: '1', background: BG2, borderRadius: '12px', border: `1px solid ${BS}` }} />
              )}
              <p style={{ ...mono, fontSize: '10px', color: TT, marginTop: '8px', textAlign: 'center' }}>Preview only — final print may vary slightly</p>
            </div>

            {/* Right: form */}
            <div>
              <span style={{ ...mono, fontSize: '11px', color: TT, letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                Step 4 of {TOTAL_STEPS} — Details
              </span>
              <h1 style={{ ...display, fontWeight: 700, fontSize: 'clamp(28px, 4vw, 44px)', margin: '0 0 28px', lineHeight: 0.95, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                Publish Your Design
              </h1>

              {/* Product type badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(200,255,0,0.08)', border: `1px solid rgba(200,255,0,0.2)`, borderRadius: '999px', padding: '6px 14px', marginBottom: '24px' }}>
                <span style={{ ...mono, fontSize: '10px', color: AS, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {selectedCategory?.category || 'T-Shirt'}
                </span>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {/* Title */}
                <div>
                  <label style={{ ...body, fontSize: '12px', fontWeight: 600, color: TS, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Title *
                  </label>
                  <input
                    type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    onFocus={() => setFocused('title')} onBlur={() => setFocused(null)}
                    placeholder="e.g. Tokyo Nights Drop" maxLength={80}
                    style={inputStyle(focused === 'title')}
                  />
                  <p style={{ ...mono, fontSize: '10px', color: TT, margin: '4px 0 0', textAlign: 'right' }}>{title.length}/80</p>
                </div>

                {/* Description */}
                <div>
                  <label style={{ ...body, fontSize: '12px', fontWeight: 600, color: TS, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Description
                  </label>
                  <textarea
                    value={description} onChange={(e) => setDescription(e.target.value)}
                    onFocus={() => setFocused('desc')} onBlur={() => setFocused(null)}
                    placeholder="Tell buyers about your design — the story, the vibe, the inspiration…"
                    maxLength={500} rows={4}
                    style={{ ...inputStyle(focused === 'desc'), resize: 'vertical' }}
                  />
                  <p style={{ ...mono, fontSize: '10px', color: TT, margin: '4px 0 0', textAlign: 'right' }}>{description.length}/500</p>
                </div>

                {/* Price */}
                <div>
                  <label style={{ ...body, fontSize: '12px', fontWeight: 600, color: TS, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Retail Price (₹) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ ...body, position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: TS, fontSize: '15px', pointerEvents: 'none' }}>₹</span>
                    <input
                      type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                      onFocus={() => setFocused('price')} onBlur={() => setFocused(null)}
                      placeholder="999" min="1" step="1"
                      style={{ ...inputStyle(focused === 'price'), paddingLeft: '32px' }}
                    />
                  </div>
                  <p style={{ ...mono, fontSize: '10px', color: TT, margin: '4px 0 0' }}>
                    {price && Number(price) > 0 ? `You earn ₹${Math.round(Number(price) * 0.8)} per sale (80%)` : 'You keep 80% of every sale'}
                  </p>
                </div>

                {error && (
                  <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,61,0,0.08)', border: `1px solid rgba(255,61,0,0.2)` }}>
                    <p style={{ ...body, fontSize: '14px', color: ERR, margin: 0 }}>{error}</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '4px' }}>
                  <button
                    type="submit" disabled={submitting}
                    style={{ ...body, padding: '15px 40px', borderRadius: '999px', background: submitting ? BG3 : AS, border: 'none', color: submitting ? TS : BG, fontSize: '15px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                  >
                    {submitting ? 'Submitting…' : 'Submit for Review'}
                  </button>
                  <p style={{ ...mono, fontSize: '10px', color: TT }}>Reviewed within 24h</p>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Product Card Component ──────────────────────────────────────────────────────

function ProductCard({ item, selected, onSelect }) {
  const basePrice = item.base_prices?.length ? Math.min(...item.base_prices) : 0;
  const sizeCount = item.sizes?.length || 0;
  const colorCount = item.colors?.length || 0;
  const genders = item.genders?.join(', ') || '';

  return (
    <button
      onClick={onSelect}
      style={{
        background: selected ? 'rgba(200,255,0,0.06)' : BG2,
        border: `1.5px solid ${selected ? AS : BS}`,
        borderRadius: '12px',
        padding: '18px 20px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = 'rgba(250,250,249,0.2)';
          e.currentTarget.style.background = BG3;
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = BS;
          e.currentTarget.style.background = BG2;
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{
          ...body, fontSize: '14px', fontWeight: 600, color: selected ? AS : TP,
          margin: 0, lineHeight: 1.3,
        }}>
          {item.category}
        </h4>
        {selected && (
          <div style={{
            width: '20px', height: '20px', borderRadius: '50%', background: AS,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', color: BG, fontWeight: 700, flexShrink: 0,
          }}>✓</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {sizeCount > 0 && (
          <span style={{ ...mono, fontSize: '10px', color: TT }}>{sizeCount} sizes</span>
        )}
        {colorCount > 0 && (
          <span style={{ ...mono, fontSize: '10px', color: TT }}>{colorCount} colors</span>
        )}
        {basePrice > 0 && (
          <span style={{ ...mono, fontSize: '10px', color: TT }}>from ₹{basePrice}</span>
        )}
      </div>
      {genders && (
        <span style={{ ...mono, fontSize: '9px', color: TT, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {genders}
        </span>
      )}
    </button>
  );
}
