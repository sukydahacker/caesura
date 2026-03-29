import React, { useState, useRef, useEffect } from 'react';

/*
 * QikinkRightPane — exact replica of the Qikink "Create Product" right-side panel.
 * Colors, spacing, fonts, and layout match the Qikink HTML pixel-for-pixel.
 */

const F = '"DM Sans", "amazon ember display rg", Arial, sans-serif';
const ORANGE = '#FF6700';
const BORDER = '#DDDCDC';
const TEXT = '#292929';
const GRAY = '#777877';
const MUTED = '#757575cf';

const UV34_COLORS = [
  { name: 'Black', hex: '#151515' },
  { name: 'Navy Blue', hex: '#000b17' },
  { name: 'Bottle Green', hex: '#073717' },
  { name: 'Royal Blue', hex: '#131b4f' },
  { name: 'Red', hex: '#8f0001' },
  { name: 'Maroon', hex: '#290005' },
  { name: 'Purple', hex: '#270f33' },
  { name: 'Golden Yellow', hex: '#ffa100' },
  { name: 'Petrol Blue', hex: '#092b2f' },
  { name: 'Olive Green', hex: '#252509' },
  { name: 'Mustard Yellow', hex: '#b5830d' },
  { name: 'Light Baby Pink', hex: '#ffd3e9' },
  { name: 'Lavender', hex: '#dfd1fb' },
  { name: 'Coral', hex: '#b34945' },
  { name: 'Mint', hex: '#adffef' },
  { name: 'Baby Blue', hex: '#adffef' },
  { name: 'Grey', hex: '#b3b5b9' },
  { name: 'White', hex: '#f5f7f9' },
];

const UV34_SIZES = ['S', 'L', 'XL', 'XXL', '3XL'];

/* ── Color Swatch with visible tooltip ── */
function ColorSwatch({ name, hex, isSelected, onClick }) {
  const [hovered, setHovered] = useState(false);
  const isLight = ['#f5f7f9','#ffd3e9','#dfd1fb','#adffef','#b3b5b9','#ffa100','#b5830d'].includes(hex?.toLowerCase());
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button onClick={onClick}
        style={{
          width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', padding: 0,
          background: hex || '#999',
          border: isSelected ? '2px solid #FF6700' : (isLight ? '1px solid #ddd' : '1px solid transparent'),
          boxShadow: isSelected ? 'rgba(0,0,0,0.5) 0px 3px 3px' : 'none',
          outline: isSelected ? '2px solid #FF6700' : 'none',
          outlineOffset: '2px',
        }} />
      {hovered && (
        <div style={{
          position: 'absolute', bottom: '36px', left: '50%', transform: 'translateX(-50%)',
          background: '#292929', color: '#fff', fontSize: '11px', padding: '4px 8px',
          borderRadius: '4px', whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          {name}
          <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #292929' }} />
        </div>
      )}
    </div>
  );
}

function ColorSwatchGrid({ colors, selectedColor, onColorChange }) {
  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label style={{ fontSize: '14px', fontWeight: 500 }}>Product Colors</label>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {colors.map(c => (
          <ColorSwatch
            key={c.name}
            name={c.name}
            hex={c.hex}
            isSelected={selectedColor === c.name}
            onClick={() => onColorChange?.(c.name)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Product Details sub-component (Quill-style rich text) ── */
function ProductDetailsContent({ productTitle, onProductTitleChange, descriptionHtml, onDescriptionChange, tags, onTagsChange, onSave, onDownloadMockups, submitting }) {
  const editorRef = useRef(null);
  const [tagInput, setTagInput] = useState('');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  const execCmd = (cmd, val) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  };

  const defaultContent = `<p><strong>Fabric:</strong> 100% cotton with 180 GSM for lightweight comfort.</p><p><strong>Fit:</strong> Perfect unisex regular fit – your go-to everyday tee.</p><p><strong>Care:</strong> Wash inside-out in cold water, dry on low heat. Flip it inside out before ironing.</p>`;

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML.trim()) {
      editorRef.current.innerHTML = descriptionHtml || defaultContent;
    }
  }, []);

  const F = '"DM Sans", "amazon ember display rg", Arial, sans-serif';
  const ORANGE = '#FF6700';
  const BORDER = '#DDDCDC';
  const GRAY = '#777877';

  const tbBtn = (active) => ({
    background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
    fontSize: '16px', color: active ? ORANGE : '#292929', fontWeight: active ? 700 : 400,
  });

  return (
    <div style={{ padding: '16px' }}>

      {/* Description with toolbar */}
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: '6px', marginBottom: '20px', overflow: 'hidden' }}>
        {/* Label */}
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, background: '#fafafa' }}>
          <span style={{ fontSize: '13px', color: GRAY }}>Description</span>
        </div>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '6px 8px', borderBottom: `1px solid ${BORDER}`, flexWrap: 'wrap' }}>
          {/* Normal dropdown */}
          <select onChange={(e) => execCmd('formatBlock', e.target.value)} defaultValue=""
            style={{ padding: '4px 8px', border: `1px solid ${BORDER}`, borderRadius: '3px', fontSize: '13px', fontFamily: F, cursor: 'pointer', color: '#292929', background: '#fff' }}>
            <option value="">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
          <div style={{ width: '1px', height: '20px', background: '#DDDCDC', margin: '0 4px' }} />
          <button onClick={() => { execCmd('bold'); setIsBold(!isBold); }} style={tbBtn(isBold)} title="Bold"><strong>B</strong></button>
          <button onClick={() => { execCmd('italic'); setIsItalic(!isItalic); }} style={tbBtn(isItalic)} title="Italic"><em>I</em></button>
          <div style={{ width: '1px', height: '20px', background: '#DDDCDC', margin: '0 4px' }} />
          <button onClick={() => execCmd('justifyLeft')} style={tbBtn(false)} title="Align Left">≡</button>
          <button onClick={() => execCmd('justifyCenter')} style={tbBtn(false)} title="Align Center">≡</button>
          <button onClick={() => execCmd('justifyRight')} style={tbBtn(false)} title="Align Right">≡</button>
          <button onClick={() => execCmd('justifyFull')} style={tbBtn(false)} title="Justify">≡</button>
          <div style={{ width: '1px', height: '20px', background: '#DDDCDC', margin: '0 4px' }} />
          <button onClick={() => execCmd('insertOrderedList')} style={tbBtn(false)} title="Ordered List">1.</button>
          <button onClick={() => execCmd('insertUnorderedList')} style={tbBtn(false)} title="Unordered List">•</button>
        </div>
        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => onDescriptionChange?.(editorRef.current?.innerHTML || '')}
          style={{ minHeight: '140px', padding: '12px', fontSize: '14px', fontFamily: F, color: '#292929', outline: 'none', lineHeight: 1.6 }}
        />
      </div>

      {/* Tags */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: '6px', overflow: 'hidden' }}>
          <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
            placeholder="Enter Your Product Tags Here..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const v = tagInput.trim();
                if (v && !tags.includes(v)) onTagsChange?.([...tags, v]);
                setTagInput('');
              }
            }}
            style={{ width: '100%', padding: '10px 12px', border: 'none', outline: 'none', fontSize: '14px', fontFamily: F, color: '#292929', boxSizing: 'border-box', borderBottom: tags.length > 0 ? `1px solid ${BORDER}` : 'none' }} />
          {tags.length > 0 && (
            <div style={{ padding: '10px 12px', display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '40px' }}>
              {tags.map((tag, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', background: '#f0f0f0', borderRadius: '4px', padding: '4px 10px', gap: '6px', fontSize: '13px', color: '#292929' }}>
                  {tag}
                  <button onClick={() => onTagsChange?.(tags.filter((_, idx) => idx !== i))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: GRAY, padding: 0, lineHeight: 1 }}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save Product + Download Mockups */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={onSave} disabled={submitting}
          style={{ flex: 1, maxWidth: '300px', margin: '0 auto', padding: '14px', background: ORANGE, color: '#fff', border: 'none', borderRadius: '30px', fontSize: '15px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1, fontFamily: F, display: 'block' }}>
          {submitting ? 'Saving...' : 'Save Product'}
        </button>
      </div>
      <div style={{ textAlign: 'right', marginTop: '8px' }}>
        <a href="#" onClick={(e) => { e.preventDefault(); onDownloadMockups?.(); }}
          style={{ fontSize: '13px', color: '#f2782c', textDecoration: 'none', fontFamily: F }}>
          ⬇ Download Mockups
        </a>
      </div>
    </div>
  );
}

export default function QikinkRightPane({
  // product
  productName = '',
  colors = [],            // [{name, hex}]
  selectedColor = '',
  onColorChange,
  sizes = [],             // ['S','M','L','XL','XXL']
  basePrice = 140,
  taxRate = 5,

  // state handlers
  selectedSizes = [],
  onToggleSize,
  sizePrices = {},
  onSizePriceChange,
  selectedColors = [],
  onToggleColor,

  // design
  imagePreview,
  onAddDesign,
  onDeleteDesign,
  designDimensions = { width: 0, height: 0, dpi: 0 },
  designAngle = 0,
  onAngleChange,
  onWidthChange,
  onHeightChange,

  // printing
  printType = 1,
  onPrintTypeChange,
  vinylSubOption = '',
  onVinylSubChange,

  // toggles
  plainProduct = false,
  onPlainProductChange,
  onShowSizeChart,

  // background
  bgColor = '#FAF7F3',
  onBgColorChange,

  // tabs
  activeTab = 'design',
  onTabChange,

  // product details
  productTitle = '',
  onProductTitleChange,
  descriptionHtml = '',
  onDescriptionChange,
  tags = [],
  onTagsChange,

  // actions
  onSave,
  onDownloadMockups,
  submitting = false,
}) {
  const [applyAllPrice, setApplyAllPrice] = useState('');
  const [tagInput, setTagInput] = useState('');

  const printingPrice = 0;
  const handlingPrice = 0;
  const gst = (basePrice * taxRate / 100);
  const totalPrice = (basePrice + printingPrice + handlingPrice + gst).toFixed(2);

  // Always use UV34 hardcoded data
  const effectiveColors = UV34_COLORS;
  const effectiveSizes = UV34_SIZES;

  return (
    <div style={{ fontFamily: F, color: TEXT, background: '#fff', height: '100%', overflow: 'auto' }}>

      {/* ── Product name + Default Color ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${BORDER}`, flexWrap: 'wrap', gap: '8px' }}>
        <p style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{productName}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px' }}>Default Color</span>
          <span style={{ fontSize: '13px', color: MUTED, cursor: 'pointer' }} title="This color will be used as the primary display image in the store.">ⓘ</span>
          <div style={{ position: 'relative' }}>
            <select value={selectedColor} onChange={(e) => onColorChange?.(e.target.value)}
              style={{ appearance: 'none', padding: '6px 28px 6px 34px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '4px', fontSize: '13px', cursor: 'pointer', minWidth: '140px', fontFamily: F }}>
              {effectiveColors.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            <div style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '3px', background: (effectiveColors.find(c => c.name === selectedColor)?.hex) || '#999', border: `1px solid ${BORDER}`, pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      {/* ── Design / Product Details tabs (underline) ── */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, padding: '0 16px' }}>
        {['Design', 'Product Details'].map(label => {
          const key = label === 'Design' ? 'design' : 'details';
          const active = activeTab === key;
          return (
            <button key={label} onClick={() => onTabChange?.(key)}
              style={{ fontFamily: F, padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: active ? 600 : 400, color: active ? TEXT : GRAY, borderBottom: active ? `2px solid ${ORANGE}` : '2px solid transparent', marginBottom: '-1px' }}>
              {label}
            </button>
          );
        })}
      </div>

      {/* ══════════ DESIGN TAB ══════════ */}
      {activeTab === 'design' && (
        <div style={{ padding: '0' }}>

          {/* Two sub-columns side by side */}
          <div style={{ display: 'flex' }}>

            {/* ── LEFT sub-column ── */}
            <div style={{ flex: 1, padding: '12px 16px', borderRight: `3px solid #c5c9c7` }}>

              {/* Plain Product */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                <label style={{ fontSize: '14px' }}>Plain Product</label>
                <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                  <input type="checkbox" checked={plainProduct} onChange={(e) => onPlainProductChange?.(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, borderRadius: '28px', transition: '0.3s', background: plainProduct ? ORANGE : '#ccc' }}>
                    <span style={{ position: 'absolute', height: '22px', width: '22px', left: plainProduct ? '24px' : '3px', bottom: '3px', background: '#fff', borderRadius: '50%', transition: '0.3s' }} />
                  </span>
                </label>
              </div>

              {/* Add Size Chart */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                <label style={{ fontSize: '14px' }}>Add Size Chart</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span onClick={onShowSizeChart} style={{ cursor: 'pointer', color: ORANGE, fontSize: '20px', boxShadow: '0px 4px 8px rgba(0,0,0,0.2)', borderRadius: '2px', padding: '1px', lineHeight: 1 }}>👁</span>
                  <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, borderRadius: '28px', transition: '0.3s', background: '#ccc' }}>
                      <span style={{ position: 'absolute', height: '22px', width: '22px', left: '3px', bottom: '3px', background: '#fff', borderRadius: '50%', transition: '0.3s' }} />
                    </span>
                  </label>
                </div>
              </div>

              {/* Printing Options */}
              <div style={{ padding: '8px 0' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>Printing Options</label>
                {[
                  { label: 'DTG Printing', value: 1 },
                  { label: 'Embroidery', value: 3 },
                  { label: 'DTF Printing', value: 17 },
                  { label: 'Vinyl Printing', value: 'vinyl' },
                ].map(opt => (
                  <div key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                    <input type="radio" name="printType" checked={printType === opt.value}
                      onChange={() => onPrintTypeChange?.(opt.value)}
                      style={{ accentColor: ORANGE, width: '16px', height: '16px', cursor: 'pointer' }} />
                    <label style={{ fontSize: '13px', cursor: 'pointer' }}>{opt.label}</label>
                  </div>
                ))}

                {/* Vinyl sub-dropdown */}
                {printType === 'vinyl' && (
                  <select value={vinylSubOption} onChange={(e) => onVinylSubChange?.(e.target.value)}
                    style={{ marginTop: '8px', width: '100%', padding: '6px 8px', border: `1px solid ${BORDER}`, borderRadius: '4px', fontSize: '13px', fontFamily: F }}>
                    <option value="">Select Vinyl</option>
                    <option value="7">Glow-In-Dark</option>
                    <option value="12">Rainbow Vinyl</option>
                    <option value="13">Gold Vinyl</option>
                    <option value="14">Silver Vinyl</option>
                    <option value="15">Reflective Grey Vinyl</option>
                    <option value="18">Puff-Black</option>
                  </select>
                )}
              </div>
            </div>

            {/* ── RIGHT sub-column ── */}
            <div style={{ flex: 1, padding: '12px 16px' }}>

              {/* Add Your Design button */}
              <button onClick={onAddDesign}
                style={{ width: '100%', padding: '12px', background: ORANGE, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: F, marginBottom: imagePreview ? '6px' : '12px' }}>
                {imagePreview ? 'Change Design' : 'Add Your Design'}
              </button>
              {imagePreview && (
                <button onClick={onDeleteDesign}
                  style={{ width: '100%', padding: '8px', background: '#fff', color: '#FF3D00', border: '1px solid #FF3D00', borderRadius: '4px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: F, marginBottom: '12px' }}>
                  ✕ Remove Design
                </button>
              )}

              {/* Image Dimensions */}
              <div style={{ fontSize: '13px' }}>
                {[
                  { label: 'Width', value: designDimensions.width ? designDimensions.width.toFixed(2) : '', suffix: 'In', editable: true, onChange: (v) => onWidthChange?.(Number(v) || 0) },
                  { label: 'Height', value: designDimensions.height ? designDimensions.height.toFixed(2) : '', suffix: 'In', editable: true, onChange: (v) => onHeightChange?.(Number(v) || 0) },
                  { label: 'Image DPI', value: designDimensions.dpi || '', suffix: '', editable: false },
                  { label: 'Design File', value: designDimensions.dpi >= 150 ? 'Good' : (designDimensions.dpi > 0 ? 'Low' : ''), suffix: '', editable: false },
                  { label: 'Design Angle', value: designAngle, suffix: '', editable: true, onChange: (v) => onAngleChange?.(Number(v) || 0) },
                ].map(field => (
                  <div key={field.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                    <label style={{ color: TEXT }}>{field.label}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="text"
                        value={field.value}
                        readOnly={!field.editable}
                        onChange={field.editable && field.onChange ? (e) => field.onChange(e.target.value) : undefined}
                        style={{ border: 'none', borderBottom: `1px solid #c5c9c7`, textAlign: 'right', width: '70px', padding: '2px 4px', fontSize: '13px', background: '#fff', fontFamily: F, outline: 'none' }}
                      />
                      {field.suffix && <span style={{ fontSize: '12px', color: GRAY }}>{field.suffix}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Choose Background ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', flexWrap: 'wrap', gap: '8px' }}>
            <label style={{ fontSize: '14px' }}>Choose Background</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="color" value={bgColor} onChange={(e) => onBgColorChange?.(e.target.value)}
                style={{ width: '32px', height: '32px', border: `1px solid ${BORDER}`, borderRadius: '4px', cursor: 'pointer', padding: 0 }} />
              <input type="text" value={bgColor} onChange={(e) => onBgColorChange?.(e.target.value)}
                placeholder="# Color Code"
                style={{ padding: '6px 8px', border: `1px solid ${BORDER}`, borderRadius: '4px', fontSize: '13px', width: '120px', fontFamily: F }} />
            </div>
          </div>

          {/* ── Available Sizes ── */}
          <div style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500 }}>Available Sizes</label>
              <span onClick={() => { effectiveSizes.forEach(s => { if (!selectedSizes.includes(s)) onToggleSize?.(s); }); }}
                style={{ fontSize: '13px', color: GRAY, cursor: 'pointer' }}>Select all</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-start' }}>
              {/* Apply to All */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button onClick={() => {
                  if (applyAllPrice) {
                    effectiveSizes.forEach(s => onSizePriceChange?.(s, Number(applyAllPrice)));
                  }
                }} style={{ minWidth: '60px', minHeight: '40px', border: `1px solid ${BORDER}`, borderRadius: '4px', background: '#fff', cursor: 'pointer', fontSize: '11px', fontFamily: F, padding: '4px 6px' }}>
                  Apply to All
                </button>
                <div style={{ position: 'relative', marginTop: '4px' }}>
                  <input type="text" value={applyAllPrice} onChange={(e) => setApplyAllPrice(e.target.value)}
                    style={{ width: '60px', height: '26px', textAlign: 'right', fontSize: '12px', border: `1px solid ${BORDER}`, borderRadius: '3px', padding: '2px 6px 2px 18px', fontFamily: F }} />
                  <span style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#333' }}>₹</span>
                </div>
              </div>

              {/* Size buttons */}
              {effectiveSizes.map(size => {
                const isSelected = selectedSizes.includes(size);
                return (
                  <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <button onClick={() => onToggleSize?.(size)}
                      style={{
                        minWidth: '50px', minHeight: '40px', border: `1px solid ${isSelected ? ORANGE : BORDER}`,
                        borderRadius: '4px', background: isSelected ? 'rgba(255,103,0,0.05)' : '#fff',
                        cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: F, padding: '4px 8px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                      }}
                      title={`Product Price: ₹ ${basePrice.toFixed(2)}\nPrinting Price: ₹ ${printingPrice.toFixed(2)}\nHandling Price: ₹ ${handlingPrice.toFixed(2)}\nGST: ₹ ${gst.toFixed(2)}\nTotal: ₹ ${totalPrice}`}>
                      {size}
                      <span style={{ fontSize: '10px', fontWeight: 400, color: GRAY }}>₹ {totalPrice}</span>
                    </button>
                    <input type="number" step="0.01" min="0" placeholder="₹"
                      value={sizePrices[size] || ''}
                      onChange={(e) => onSizePriceChange?.(size, Number(e.target.value))}
                      style={{ width: '50px', fontSize: '11px', textAlign: 'center', border: `1px solid ${BORDER}`, borderRadius: '3px', marginTop: '4px', padding: '2px', fontFamily: F }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Product Colors (single select with tooltip) ── */}
          <ColorSwatchGrid
            colors={effectiveColors}
            selectedColor={selectedColor}
            onColorChange={onColorChange}
          />

          {/* ── Save Product + Download Mockups ── */}
          <div style={{ padding: '16px' }}>
            <button onClick={onSave} disabled={submitting}
              style={{ width: '100%', padding: '14px', background: ORANGE, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '15px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1, fontFamily: F }}>
              {submitting ? 'Saving...' : 'Save Product'}
            </button>
            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); onDownloadMockups?.(); }}
                style={{ fontSize: '13px', color: '#f2782c', textDecoration: 'none', fontFamily: F }}>
                ⬇ Download Mockups
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ PRODUCT DETAILS TAB ══════════ */}
      {activeTab === 'details' && (
        <ProductDetailsContent
          productTitle={productTitle}
          onProductTitleChange={onProductTitleChange}
          descriptionHtml={descriptionHtml}
          onDescriptionChange={onDescriptionChange}
          tags={tags}
          onTagsChange={onTagsChange}
          onSave={onSave}
          onDownloadMockups={onDownloadMockups}
          submitting={submitting}
        />
      )}
    </div>
  );
}
