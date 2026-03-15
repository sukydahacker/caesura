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

const CANVAS_W = 420;
const CANVAS_H = 600;

// ── Product collection groupings ────────────────────────────────────────────────
const COLLECTIONS = [
  { name: 'T-Shirts', image: '/mockups/T-shirts.PNG.webp', description: 'Crew necks, oversized, acid wash & more', keywords: ['T-Shirt', 'Tee', 'Baby Tee'] },
  { name: 'Hoodies & Jackets', image: '/mockups/Hoodies.PNG.webp', description: 'Hoodies, sweatshirts, bombers & varsity', keywords: ['Hoodie', 'Sweatshirt', 'Bomber', 'Varsity', 'Zip Hoodie'] },
  { name: 'Bottomwear', image: '/mockups/Bottomwear.PNG.webp', description: 'Joggers, shorts & sweatpants', keywords: ['Jogger', 'Short', 'Sweatpants', 'Legging'] },
  { name: 'Kids Clothing', image: '/mockups/KidsClothing.PNG.webp', description: 'Rompers, kids tees & outerwear', keywords: ['Kids', 'Romper'] },
  { name: 'Headwear', image: '/mockups/Headwear.PNG.webp', description: 'Caps, bucket hats, snapbacks & balaclava', keywords: ['Cap', 'Hat', 'Snapback', 'Trucker', 'Balaclava', 'Bucket'] },
  { name: 'Drinkware', image: '/mockups/Drink-ware.PNG.webp', description: 'Mugs, sippers, tumblers & bottles', keywords: ['Mug', 'Sipper', 'Tumbler', 'Bottle', 'Enamel'] },
  { name: 'Bags & Accessories', image: '/mockups/Bags.PNG.webp', description: 'Tote bags, drawstring bags, keychains & more', keywords: ['Tote', 'Bag', 'Keychain', 'Badge', 'Luggage', 'Fridge Magnet', 'Dog Tag', 'Phone', 'Grip', 'Pen', 'Bookmark', 'Arm Sleeves'] },
  { name: 'Home & Living', image: '/mockups/Home-and-livng.PNG.webp', description: 'Posters, cushions, coasters, puzzles & more', keywords: ['Poster', 'Canvas', 'Cushion', 'Pillow', 'Coaster', 'Mouse Pad', 'Puzzle', 'Tapestry', 'Tablerunner', 'Placemat', 'Napkin', 'Ornament', 'Acrylic', 'Gaming Pad'] },
  { name: 'Pet Products', image: '/mockups/Pet-Products.PNG-2.webp', description: 'Dog tees & pet tags', keywords: ['Dog', 'Pet'] },
];

// Product images — exact 24 T-shirt products
const PRODUCT_IMAGES = {
  'Male Classic Crew T-Shirt': '/mockups/1757067029Classiccrewtee1.webp',
  'Male Standard Crew T-Shirt | US21': '/mockups/1740544626roundnecktee.jpg',
  'Unisex Oversized Classic T-Shirt | UC22': '/mockups/1757068206OversizedClassictee1.webp',
  'Unisex Oversized Standard T-Shirt | US22': '/mockups/1740544717oversizedTee1.jpg',
  'Unisex Tie Dye Oversized T-Shirt | UT58': '/mockups/1757132558tiedyeoversizedtee1.webp',
  'Unisex Acid Wash Oversized Tee | UC61': '/mockups/1740550996AcidwashOversizedtee.jpg',
  'Unisex Terry Oversized Tee | UT27': '/mockups/1745987212terrytee.jpg',
  'Unisex Oversized Shirt | UC28': '/mockups/1757131619OversizedShirt1.webp',
  'Male Raglan T-Shirt | UR37': '/mockups/1740545359raglan.jpg',
  'Unisex Supima T-Shirt | UC23': '/mockups/1740549887Supima.jpg',
  'Unisex Basic T-Shirt PC | UB73': '/mockups/1757132404roundnecktee2.webp',
  'Unisex Cotton Stretch T-Shirt | UC48': '/mockups/1757132481CottonStretchTShirt1.webp',
  'Female Baby Tee | FT47': '/mockups/1757132726Babytee1.webp',
  'Female Crop Tank | FC40': '/mockups/1740553628croptank.jpg',
  'Boy Classic Crew T-Shirt': '/mockups/1757131987boyroundneckjpg1.webp',
  'Female T-Shirt Dress | FC43': '/mockups/1740552527TshirtDress.jpg',
  'Womens Tank Top | FT37': '/mockups/1740553193tanktop.jpg',
  'Male V Neck T-Shirt | UV34': '/mockups/1740550339Vneck.jpg',
  'Male Polo | MP25': '/mockups/1740545706Polo.jpg',
  'Male Sleeveless T-Shirt | MS36': '/mockups/1757131410Sleeveless1.webp',
  'Male Full Sleeve T-Shirt': '/mockups/1740545085mensfullsleeve.jpg',
  'Female Classic Crew T-Shirt': '/mockups/1740552082womensroundnecktee.jpg',
  'Female Crop Top | FC39': '/mockups/1740553628croptank.jpg',
  'Girl Classic Crew T-Shirt': '/mockups/1757132060Girlsroundneck1.webp',
};

// Categories to exclude from T-Shirts (matched by substring but don't belong)
const TSHIRT_EXCLUDES = ['steel water', 'dog t-shirt', 'aop', 'bike rider'];

function categorizeProduct(categoryName) {
  const lower = categoryName.toLowerCase();
  for (const col of COLLECTIONS) {
    if (col.keywords.some(kw => lower.includes(kw.toLowerCase()))) {
      // Exclude false positives from T-Shirts
      if (col.name === 'T-Shirts' && TSHIRT_EXCLUDES.some(ex => lower.includes(ex))) continue;
      return col.name;
    }
  }
  return null;
}

// Mockup templates for canvas editor
const PRODUCT_TEMPLATES = {
  'Terry Oversized Tee | UT27': { template: '/mockups/oversized-tee-white.jpg', printArea: { x: 92, y: 138, w: 236, h: 222 } },
  'Hoodie': { template: '/mockups/hoodie-white.jpg', printArea: { x: 100, y: 155, w: 220, h: 200 } },
  'Oversized Classic T-Shirt | UC22': { template: '/mockups/oversized-tee-white.jpg', printArea: { x: 92, y: 138, w: 236, h: 222 } },
  'Classic Crew T-Shirt': { template: '/mockups/crew-tee-white.jpg', printArea: { x: 94, y: 128, w: 232, h: 238 } },
  'Sweatshirt | UH26': { template: '/mockups/sweatshirt-white.jpg', printArea: { x: 97, y: 140, w: 226, h: 230 } },
};
const DEFAULT_TEMPLATE = { template: '/mockups/oversized-tee-white.jpg', printArea: { x: 92, y: 138, w: 236, h: 222 } };

const MAX_FILE_MB = 20;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

function inputStyle(focused) {
  return {
    width: '100%', padding: '14px 16px', background: BG3,
    border: `1px solid ${focused ? 'rgba(250,250,249,0.25)' : BS}`,
    borderRadius: '8px', color: TP, fontSize: '15px', outline: 'none',
    boxSizing: 'border-box', ...body, transition: 'border-color 0.15s',
  };
}

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

  // Step 1 = catalog, Step 2 = editor
  const [step, setStep] = useState(1);

  // Step 1 — product selection
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Step 2 — editor (upload + canvas + colors + sizes + details all-in-one)
  const [dragOver, setDragOver] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState('');

  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColor, setSelectedColor] = useState('');

  const [exporting, setExporting] = useState(false);
  const [mockupImageUrl, setMockupImageUrl] = useState('');
  const [placement, setPlacement] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [focused, setFocused] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // ── Load catalog on mount ────────────────────────────────────────────────────

  useEffect(() => {
    if (catalog.length === 0) {
      setCatalogLoading(true);
      getProductCatalog()
        .then(res => {
          // Expand each product into one entry per gender
          const expanded = [];
          for (const item of (res.data || [])) {
            if (item.genders && item.genders.length > 0) {
              for (const g of item.genders) {
                expanded.push({ ...item, category: `${g} ${item.category}` });
              }
            } else {
              expanded.push(item);
            }
          }
          setCatalog(expanded);
        })
        .catch(() => setCatalog([]))
        .finally(() => setCatalogLoading(false));
    }
  }, [catalog.length]);

  const GENDER_ORDER = { 'male': 0, 'unisex': 1, 'female': 2, 'womens': 3, 'boy': 4, 'girl': 5 };
  const getGenderOrder = (cat) => {
    const prefix = cat.toLowerCase().split(' ')[0];
    return GENDER_ORDER[prefix] ?? 6;
  };

  const catalogByCollection = {};
  catalog.forEach(item => {
    const col = categorizeProduct(item.category);
    if (col) {
      if (!catalogByCollection[col]) catalogByCollection[col] = [];
      catalogByCollection[col].push(item);
    }
  });
  // Sort: Male/Unisex first, then Female/Womens, then Boy/Girl
  Object.values(catalogByCollection).forEach(arr => arr.sort((a, b) => getGenderOrder(a.category) - getGenderOrder(b.category)));

  const filteredCatalog = searchQuery.trim()
    ? catalog.filter(c => c.category.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  // ── File handling ────────────────────────────────────────────────────────────

  const validateFile = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) return 'Only PNG, JPG, or WEBP files are accepted.';
    if (file.size > MAX_FILE_MB * 1024 * 1024) return `File must be smaller than ${MAX_FILE_MB}MB.`;
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

  // ── Canvas init (runs when imagePreview changes in step 2) ──────────────────

  const getProductTemplate = () => {
    if (!selectedCategory) return DEFAULT_TEMPLATE;
    return PRODUCT_TEMPLATES[selectedCategory.category] || DEFAULT_TEMPLATE;
  };

  useEffect(() => {
    if (step !== 2 || !canvasElRef.current || !imagePreview) return;

    let cancelled = false;

    const init = async () => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
        designObjRef.current = null;
      }

      const tmpl = getProductTemplate();

      const canvas = new fabric.Canvas(canvasElRef.current, {
        width: CANVAS_W, height: CANVAS_H, backgroundColor: '#111113', selection: false,
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
        const bgScale = Math.min(scaleX, scaleY);
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
      canvas.add(new fabric.Rect({
        left: pa.x, top: pa.y, width: pa.w, height: pa.h,
        fill: 'transparent', stroke: '#C8FF00', strokeWidth: 1.5,
        strokeDashArray: [8, 4], selectable: false, evented: false,
      }));
      canvas.add(new fabric.IText('PRINT AREA', {
        left: pa.x + 6, top: pa.y + 4, fontSize: 9,
        fill: 'rgba(200,255,0,0.45)', fontFamily: 'monospace',
        selectable: false, evented: false, editable: false,
      }));

      if (imagePreview) {
        const designImg = await fabric.FabricImage.fromURL(imagePreview);
        if (cancelled) return;
        const maxW = pa.w * 0.72;
        const maxH = pa.h * 0.72;
        const scale = Math.min(maxW / designImg.width, maxH / designImg.height);
        designImg.set({
          left: pa.x + pa.w / 2, top: pa.y + pa.h / 2,
          originX: 'center', originY: 'center',
          scaleX: scale, scaleY: scale, name: 'design',
          cornerSize: 9, cornerColor: '#C8FF00', cornerStrokeColor: '#0A0A0B',
          borderColor: '#C8FF00', transparentCorners: false, padding: 4,
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
      if (fabricRef.current) { fabricRef.current.dispose(); fabricRef.current = null; designObjRef.current = null; }
    };
  }, [step, imagePreview, selectedCategory]);

  // ── Submit (upload image + export mockup + create design) ───────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!imageFile) { setError('Please upload a design image.'); return; }
    if (!title.trim()) { setError('Please enter a title.'); return; }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) { setError('Please enter a valid price.'); return; }
    if (selectedSizes.length === 0) { setError('Please select at least one size.'); return; }

    setSubmitting(true);
    try {
      // 1. Upload design image
      const uploadRes = await uploadDesignImage(imageFile);
      const hostedImageUrl = uploadRes.data.url || uploadRes.data.image_url || '';

      // 2. Export canvas mockup
      let mockupUrl = '';
      let placementCoords = null;
      const canvas = fabricRef.current;
      if (canvas) {
        const tmpl = getProductTemplate();
        const pa = tmpl.printArea;
        const designObj = designObjRef.current;
        if (designObj) {
          placementCoords = {
            canvas_w: CANVAS_W, canvas_h: CANVAS_H,
            print_area: { x: pa.x, y: pa.y, w: pa.w, h: pa.h },
            left: designObj.left, top: designObj.top,
            scaleX: designObj.scaleX, scaleY: designObj.scaleY,
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
        const mockupUploadRes = await uploadDesignImage(mockupFile);
        mockupUrl = mockupUploadRes.data.url || mockupUploadRes.data.image_url;
      }

      // 3. Create design
      await createDesign({
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        image_url: hostedImageUrl,
        mockup_image_url: mockupUrl,
        product_type: selectedCategory?.category || 'Terry Oversized Tee | UT27',
        placement_coordinates: placementCoords,
        selected_sizes: selectedSizes,
        selected_color: selectedColor,
      });
      setSuccess(true);
    } catch (e) {
      setError(e.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toggle size selection ───────────────────────────────────────────────────

  const toggleSize = (size) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };

  // ── Success screen ──────────────────────────────────────────────────────────

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '440px' }}>
          <div style={{ fontSize: '52px', marginBottom: '24px' }}>✦</div>
          <h2 style={{ ...display, fontWeight: 700, fontSize: '40px', color: AS, margin: '0 0 12px', textTransform: 'uppercase' }}>Design Submitted!</h2>
          <p style={{ ...body, fontSize: '16px', color: TS, lineHeight: 1.7, margin: '0 0 12px' }}>
            Your design is pending admin review. Once approved it goes live on the marketplace.
          </p>
          <p style={{ ...mono, fontSize: '11px', color: TT, margin: '0 0 40px' }}>You keep 80% of every sale.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => { setSuccess(false); setStep(1); setImageFile(null); setImagePreview(null); setImageUrl(''); setMockupImageUrl(''); setPlacement(null); setTitle(''); setDescription(''); setPrice(''); setSelectedCategory(null); setSelectedCollection(null); setSelectedSizes([]); setSelectedColor(''); }}
              style={{ ...body, padding: '12px 28px', borderRadius: '999px', background: BG3, border: `1px solid ${BS}`, color: TP, fontWeight: 500, cursor: 'pointer', fontSize: '14px' }}
            >Upload Another</button>
            <button onClick={() => navigate('/dashboard')} style={{ ...body, padding: '12px 28px', borderRadius: '999px', background: AS, border: 'none', color: BG, fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
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
      <div style={{ padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${BS}` }}>
        <button
          onClick={() => {
            if (step === 2) { setStep(1); }
            else if (selectedCollection) { setSelectedCollection(null); setSelectedCategory(null); }
            else { navigate('/'); }
          }}
          style={{ ...body, background: 'none', border: 'none', color: TS, cursor: 'pointer', fontSize: '14px', padding: 0 }}
        >
          ← {step === 2 ? 'Products' : selectedCollection ? 'Collections' : 'Home'}
        </button>
        <span style={{ ...mono, fontSize: '11px', color: TT, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Caesura / Sell Your Art
        </span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {['Product', 'Editor'].map((label, i) => {
            const s = i + 1;
            const isActive = s === step;
            const isDone = s < step;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: isActive ? AS : isDone ? 'rgba(200,255,0,0.4)' : BG3,
                  border: `1px solid ${isActive ? AS : isDone ? 'rgba(200,255,0,0.3)' : BS}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 700, color: isActive ? BG : isDone ? AS : TT,
                  ...mono,
                }}>{isDone ? '✓' : s}</div>
                <span style={{ ...mono, fontSize: '10px', color: isActive ? TP : TT, marginRight: i < 1 ? '8px' : 0 }}>{label}</span>
                {i < 1 && <div style={{ width: '20px', height: '1px', background: isDone ? 'rgba(200,255,0,0.3)' : BS, marginRight: '4px' }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── STEP 1: Product Catalog ── */}
      {step === 1 && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px 80px' }}>
          <span style={{ ...mono, fontSize: '11px', color: TP, letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
            Step 1 — Choose Product
          </span>
          <h1 style={{ ...display, fontWeight: 700, fontSize: 'clamp(28px, 5vw, 52px)', margin: '0 0 8px', lineHeight: 0.95, textTransform: 'uppercase', letterSpacing: '-0.02em', color: TP }}>
            Product Library
          </h1>
          <p style={{ ...body, fontSize: '15px', color: TS, margin: '12px 0 28px', lineHeight: 1.6 }}>
            Choose what product to print your design on. <span style={{ color: AS }}>140+ product types</span> — apparel, accessories, home decor & more.
          </p>

          {/* Search */}
          <div style={{ maxWidth: '480px', marginBottom: '40px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: TT, fontSize: '14px', pointerEvents: 'none' }}>🔍</span>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products — e.g. hoodie, mug, poster..."
              style={{ ...inputStyle(false), paddingLeft: '44px', background: BG2 }} />
          </div>

          {catalogLoading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ ...mono, fontSize: '13px', color: TT }}>Loading product catalog...</p>
            </div>
          ) : searchQuery.trim() ? (
            <div>
              <p style={{ ...mono, fontSize: '11px', color: TT, marginBottom: '16px' }}>
                {filteredCatalog.length} result{filteredCatalog.length !== 1 ? 's' : ''} for "{searchQuery}"
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                {filteredCatalog.map(item => (
                  <ProductCard key={item.category} item={item} selected={selectedCategory?.category === item.category}
                    onSelect={() => { setSelectedCategory(item); setSearchQuery(''); setSelectedSizes([]); setSelectedColor(item.colors?.[0] || ''); setStep(2); }} />
                ))}
              </div>
            </div>
          ) : selectedCollection ? (
            <div>
              <button onClick={() => { setSelectedCollection(null); setSelectedCategory(null); }}
                style={{ ...body, background: 'none', border: 'none', color: AS, cursor: 'pointer', fontSize: '13px', padding: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ← All Collections
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <h2 style={{ ...display, fontSize: '24px', fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>{selectedCollection}</h2>
                <span style={{ ...mono, fontSize: '11px', color: TT, marginLeft: '8px' }}>{(catalogByCollection[selectedCollection] || []).length} products</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                {(catalogByCollection[selectedCollection] || []).map(item => (
                  <ProductCard key={item.category} item={item} selected={selectedCategory?.category === item.category}
                    onSelect={() => { setSelectedCategory(item); setSelectedSizes([]); setSelectedColor(item.colors?.[0] || ''); setStep(2); }} />
                ))}
              </div>
            </div>
          ) : (
            /* Collection grid — image cards like Printrove */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              {COLLECTIONS.map(col => {
                const count = (catalogByCollection[col.name] || []).length;
                if (count === 0) return null;
                return (
                  <button key={col.name} onClick={() => setSelectedCollection(col.name)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 0, textAlign: 'center', transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    {/* Image container */}
                    <div style={{
                      aspectRatio: '1', borderRadius: '16px', overflow: 'hidden',
                      background: '#F5F0EB', marginBottom: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1px solid ${BS}`, position: 'relative',
                    }}>
                      <img src={col.image} alt={col.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center' }} />
                      {/* Product count badge */}
                      <div style={{
                        position: 'absolute', bottom: '10px', right: '10px',
                        background: 'rgba(10,10,11,0.75)', backdropFilter: 'blur(8px)',
                        borderRadius: '6px', padding: '4px 8px',
                      }}>
                        <span style={{ ...mono, fontSize: '9px', color: TP, letterSpacing: '0.08em' }}>{count}</span>
                      </div>
                    </div>
                    {/* Label */}
                    <h3 style={{ ...body, fontSize: '14px', fontWeight: 600, color: TP, margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{col.name}</h3>
                    <p style={{ ...body, fontSize: '12px', color: TS, margin: 0, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{col.description}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Product Editor (all-in-one) ── */}
      {step === 2 && selectedCategory && (
        <div style={{ display: 'flex', height: 'calc(100vh - 57px)', overflow: 'hidden' }}>

          {/* Left: Canvas area */}
          <div style={{ flex: '0 0 480px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', borderRight: `1px solid ${BS}`, background: BG2 }}>
            {imagePreview ? (
              <>
                <div style={{ border: `1px solid ${BS}`, borderRadius: '12px', overflow: 'hidden', display: 'inline-block', lineHeight: 0, background: '#fff' }}>
                  <canvas ref={canvasElRef} />
                </div>
                <p style={{ ...mono, fontSize: '10px', color: TT, marginTop: '8px', textAlign: 'center' }}>
                  Drag · Scale (corners) · Rotate (top handle)
                </p>
              </>
            ) : (
              /* Upload zone when no image yet */
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{
                  width: '100%', maxWidth: '420px', aspectRatio: '7/10',
                  border: `2px dashed ${dragOver ? AS : BS}`, borderRadius: '16px',
                  background: dragOver ? 'rgba(200,255,0,0.04)' : BG3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.3 }}>⬆</div>
                  <p style={{ ...body, fontSize: '16px', color: TS, margin: '0 0 8px', fontWeight: 600 }}>
                    Drop your design here
                  </p>
                  <p style={{ ...body, fontSize: '14px', color: TS, margin: '0 0 4px' }}>
                    or <span style={{ color: AS, cursor: 'pointer' }}>browse files</span>
                  </p>
                  <p style={{ ...mono, fontSize: '11px', color: TT, margin: '12px 0 0' }}>PNG · JPG · WEBP · max 20 MB</p>
                </div>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />

            {fileError && (
              <div style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(255,61,0,0.08)', border: `1px solid rgba(255,61,0,0.2)`, marginTop: '12px', maxWidth: '420px' }}>
                <p style={{ ...body, fontSize: '13px', color: ERR, margin: 0 }}>{fileError}</p>
              </div>
            )}

            {imagePreview && (
              <button onClick={() => fileInputRef.current?.click()}
                style={{ ...body, marginTop: '12px', padding: '8px 20px', borderRadius: '999px', background: BG3, border: `1px solid ${BS}`, color: TS, fontSize: '12px', cursor: 'pointer' }}>
                Change image
              </button>
            )}
          </div>

          {/* Right: Controls panel */}
          <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px 80px' }}>
            <div style={{ maxWidth: '520px' }}>

              {/* Product header */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h2 style={{ ...display, fontSize: '28px', fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>
                    {selectedCategory.category}
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {selectedCategory.genders?.length > 0 && (
                    <span style={{ ...mono, fontSize: '10px', color: TT }}>{selectedCategory.genders.join(' / ')}</span>
                  )}
                  <span style={{ ...mono, fontSize: '10px', color: TT }}>Base ₹{Math.min(...(selectedCategory.base_prices || [0]))}</span>
                  <span style={{ ...mono, fontSize: '10px', color: TT }}>GST {selectedCategory.tax_rate || 5}%</span>
                </div>
              </div>

              {/* Colors */}
              {selectedCategory.colors?.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ ...mono, fontSize: '10px', color: TT, letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                    Colour — {selectedColor || 'select'}
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedCategory.colors.map(color => (
                      <button key={color} onClick={() => setSelectedColor(color)} title={color}
                        style={{
                          padding: '5px 12px', borderRadius: '999px', fontSize: '11px', cursor: 'pointer',
                          ...mono, textTransform: 'capitalize', transition: 'all 0.15s',
                          background: selectedColor === color ? 'rgba(200,255,0,0.1)' : 'transparent',
                          border: `1px solid ${selectedColor === color ? AS : BS}`,
                          color: selectedColor === color ? AS : TS,
                        }}>
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {selectedCategory.sizes?.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ ...mono, fontSize: '10px', color: TT, letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                    Sizes — select which sizes to offer
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedCategory.sizes.map(size => {
                      const isSelected = selectedSizes.includes(size);
                      return (
                        <button key={size} onClick={() => toggleSize(size)}
                          style={{
                            width: '44px', height: '36px', borderRadius: '6px', fontSize: '12px',
                            ...mono, cursor: 'pointer', transition: 'all 0.15s',
                            background: isSelected ? 'rgba(200,255,0,0.12)' : BG3,
                            border: `1px solid ${isSelected ? AS : BS}`,
                            color: isSelected ? AS : TS,
                            fontWeight: isSelected ? 700 : 400,
                          }}>
                          {size}
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={() => setSelectedSizes([...selectedCategory.sizes])}
                    style={{ ...mono, fontSize: '10px', color: AS, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0 0', textDecoration: 'underline' }}>
                    Select all
                  </button>
                </div>
              )}

              <div style={{ height: '1px', background: BS, margin: '8px 0 24px' }} />

              {/* Title */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ ...body, fontSize: '12px', fontWeight: 600, color: TS, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  onFocus={() => setFocused('title')} onBlur={() => setFocused(null)}
                  placeholder="e.g. Tokyo Nights Drop" maxLength={80} style={inputStyle(focused === 'title')} />
                <p style={{ ...mono, fontSize: '10px', color: TT, margin: '4px 0 0', textAlign: 'right' }}>{title.length}/80</p>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ ...body, fontSize: '12px', fontWeight: 600, color: TS, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  onFocus={() => setFocused('desc')} onBlur={() => setFocused(null)}
                  placeholder="Tell buyers about your design..." maxLength={500} rows={3}
                  style={{ ...inputStyle(focused === 'desc'), resize: 'vertical' }} />
                <p style={{ ...mono, fontSize: '10px', color: TT, margin: '4px 0 0', textAlign: 'right' }}>{description.length}/500</p>
              </div>

              {/* Price */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ ...body, fontSize: '12px', fontWeight: 600, color: TS, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Retail Price (₹) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ ...body, position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: TS, fontSize: '15px', pointerEvents: 'none' }}>₹</span>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                    onFocus={() => setFocused('price')} onBlur={() => setFocused(null)}
                    placeholder="999" min="1" step="1"
                    style={{ ...inputStyle(focused === 'price'), paddingLeft: '32px' }} />
                </div>
                <p style={{ ...mono, fontSize: '10px', color: TT, margin: '4px 0 0' }}>
                  {price && Number(price) > 0 ? `You earn ₹${Math.round(Number(price) * 0.8)} per sale (80%)` : 'You keep 80% of every sale'}
                </p>
              </div>

              {/* Print method info */}
              <div style={{ background: 'rgba(200,255,0,0.04)', border: `1px solid rgba(200,255,0,0.15)`, borderRadius: '10px', padding: '14px 18px', marginBottom: '24px' }}>
                <p style={{ ...mono, fontSize: '10px', color: AS, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 6px' }}>Print method</p>
                <p style={{ ...body, fontSize: '13px', color: TP, margin: 0, lineHeight: 1.5 }}>DTF (Direct to Film) via Qikink — vibrant colours, all fabric types, no minimums.</p>
              </div>

              {error && (
                <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,61,0,0.08)', border: `1px solid rgba(255,61,0,0.2)`, marginBottom: '16px' }}>
                  <p style={{ ...body, fontSize: '14px', color: ERR, margin: 0 }}>{error}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button onClick={handleSubmit} disabled={submitting}
                  style={{ ...body, padding: '15px 40px', borderRadius: '999px', background: submitting ? BG3 : AS, border: 'none', color: submitting ? TS : BG, fontSize: '15px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                  {submitting ? 'Submitting…' : 'Submit for Review'}
                </button>
                <p style={{ ...mono, fontSize: '10px', color: TT }}>Reviewed within 24h</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Product Card (within a collection) ──────────────────────────────────────────

function ProductCard({ item, selected, onSelect }) {
  const basePrice = item.base_prices?.length ? Math.min(...item.base_prices) : 0;
  return (
    <button onClick={onSelect}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: 0, textAlign: 'center', transition: 'transform 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Image area */}
      <div style={{
        aspectRatio: '1', borderRadius: '14px', overflow: 'hidden',
        background: '#F5F0EB', marginBottom: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: selected ? `2px solid ${AS}` : `1px solid ${BS}`,
        position: 'relative',
      }}>
        {PRODUCT_IMAGES[item.category] ? (
          <img src={PRODUCT_IMAGES[item.category]} alt={item.category}
            style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center center' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #F5F0EB 0%, #EDE8E3 100%)',
          }}>
            <span style={{ ...display, fontSize: '28px', color: 'rgba(0,0,0,0.1)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em', padding: '16px', textAlign: 'center', lineHeight: 1.1 }}>
              {item.category.split('|')[0].trim()}
            </span>
          </div>
        )}
        {/* Color dots preview */}
        {(item.colors?.length || 0) > 0 && (
          <div style={{ position: 'absolute', bottom: '10px', left: '10px', display: 'flex', gap: '3px' }}>
            {item.colors.slice(0, 5).map((c, i) => (
              <div key={i} style={{
                width: '12px', height: '12px', borderRadius: '50%',
                background: c.toLowerCase() === 'white' ? '#fff' : c.toLowerCase() === 'black' ? '#222' : c.toLowerCase() === 'navy' ? '#1a237e' : c.toLowerCase() === 'red' ? '#d32f2f' : c.toLowerCase() === 'grey' || c.toLowerCase() === 'melange grey' ? '#9e9e9e' : c.toLowerCase() === 'maroon' ? '#7b1fa2' : c.toLowerCase().includes('blue') ? '#1976d2' : c.toLowerCase().includes('green') ? '#388e3c' : c.toLowerCase().includes('yellow') ? '#fbc02d' : c.toLowerCase().includes('pink') ? '#e91e63' : '#999',
                border: '1.5px solid rgba(255,255,255,0.9)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }} />
            ))}
            {item.colors.length > 5 && (
              <div style={{
                width: '12px', height: '12px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)', border: '1.5px solid rgba(255,255,255,0.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '6px', color: '#fff', fontWeight: 700,
              }}>+{item.colors.length - 5}</div>
            )}
          </div>
        )}
        {selected && (
          <div style={{ position: 'absolute', top: '10px', right: '10px', width: '24px', height: '24px', borderRadius: '50%', background: AS, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '14px', color: BG }}>✓</span>
          </div>
        )}
      </div>
      {/* Info */}
      <h4 style={{ ...body, fontSize: '13px', fontWeight: 600, color: selected ? AS : TP, margin: '0 0 4px', lineHeight: 1.3 }}>
        {item.category}
      </h4>
      {basePrice > 0 && (
        <p style={{ ...body, fontSize: '12px', color: TT, margin: '2px 0 0', fontWeight: 500 }}>
          Starts From ₹ {basePrice}
        </p>
      )}
    </button>
  );
}
