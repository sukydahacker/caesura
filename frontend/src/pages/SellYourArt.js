import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadDesignImage, createDesign } from '@/lib/api';

const BG   = '#0A0A0B';
const BG2  = '#141416';
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

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  background: BG3,
  border: `1px solid ${BS}`,
  borderRadius: '8px',
  color: TP,
  fontSize: '15px',
  outline: 'none',
  boxSizing: 'border-box',
  ...body,
  transition: 'border-color 0.15s',
};

export default function SellYourArt() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl]     = useState('');
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice]           = useState('');
  const [uploading, setUploading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [dragOver, setDragOver]     = useState(false);

  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    setError('');
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!imageFile) return;
    setUploading(true);
    setError('');
    try {
      const res = await uploadDesignImage(imageFile);
      setImageUrl(res.data.url || res.data.image_url || '');
    } catch (e) {
      setError(e.response?.data?.detail || 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!imageFile) { setError('Please upload a design image.'); return; }
    if (!title.trim()) { setError('Please enter a title.'); return; }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) { setError('Please enter a valid price.'); return; }

    setSubmitting(true);
    try {
      let finalUrl = imageUrl;
      if (!finalUrl) {
        const res = await uploadDesignImage(imageFile);
        finalUrl = res.data.url || res.data.image_url || '';
        setImageUrl(finalUrl);
      }
      await createDesign({
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        image_url: finalUrl,
      });
      setSuccess(true);
    } catch (e) {
      setError(e.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '420px' }}>
          <div style={{ fontSize: '56px', marginBottom: '24px' }}>✦</div>
          <h2 style={{ ...display, fontWeight: 700, fontSize: '36px', color: AS, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
            Design Submitted!
          </h2>
          <p style={{ ...body, fontSize: '16px', color: TS, lineHeight: 1.6, margin: '0 0 40px' }}>
            Your design is under review. We'll notify you once it's live on the marketplace.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => { setSuccess(false); setImageFile(null); setImagePreview(null); setImageUrl(''); setTitle(''); setDescription(''); setPrice(''); }}
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
      <div style={{ padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${BS}` }}>
        <button
          onClick={() => navigate('/')}
          style={{ ...body, background: 'none', border: 'none', color: TS, cursor: 'pointer', fontSize: '14px', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          ← Back
        </button>
        <span style={{ ...mono, fontSize: '11px', color: TT, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Caesura / Upload Design
        </span>
        <div style={{ width: '60px' }} />
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px 80px' }}>
        {/* Page title */}
        <div style={{ marginBottom: '48px' }}>
          <span style={{ ...mono, fontSize: '11px', color: TT, letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
            Creator Upload
          </span>
          <h1 style={{ ...display, fontWeight: 700, fontSize: 'clamp(36px, 6vw, 64px)', margin: 0, lineHeight: 0.95, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            Sell Your Art
          </h1>
          <p style={{ ...body, fontSize: '16px', color: TS, margin: '16px 0 0', lineHeight: 1.6 }}>
            Upload your design and set your price. We handle production, shipping, and fulfilment.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Image Upload Zone */}
          <div>
            <label style={{ ...body, fontSize: '13px', fontWeight: 600, color: TS, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
              Design Image *
            </label>
            <div
              onClick={() => !imagePreview && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragOver ? AS : imagePreview ? 'transparent' : BS}`,
                borderRadius: '12px',
                background: imagePreview ? 'transparent' : dragOver ? 'rgba(200,255,0,0.04)' : BG2,
                minHeight: imagePreview ? 'auto' : '240px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: imagePreview ? 'default' : 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s',
              }}
            >
              {imagePreview ? (
                <div style={{ position: 'relative', width: '100%' }}>
                  <img
                    src={imagePreview}
                    alt="Design preview"
                    style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '10px', display: 'block' }}
                  />
                  <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ ...body, padding: '8px 16px', borderRadius: '999px', background: 'rgba(0,0,0,0.7)', border: `1px solid ${BS}`, color: TP, fontSize: '12px', cursor: 'pointer', backdropFilter: 'blur(8px)' }}
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }}>⬆</div>
                  <p style={{ ...body, fontSize: '15px', color: TS, margin: '0 0 6px', fontWeight: 500 }}>
                    Drop your image here, or <span style={{ color: AS }}>browse</span>
                  </p>
                  <p style={{ ...mono, fontSize: '11px', color: TT, margin: 0 }}>
                    PNG, JPG, WEBP · max 10 MB · min 1000×1000px recommended
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />
            {imageFile && !imageUrl && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                style={{ ...body, marginTop: '10px', padding: '8px 20px', borderRadius: '999px', background: BG3, border: `1px solid ${BS}`, color: TP, fontSize: '13px', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}
              >
                {uploading ? 'Uploading…' : 'Pre-upload image'}
              </button>
            )}
            {imageUrl && (
              <p style={{ ...mono, fontSize: '11px', color: AS, marginTop: '8px' }}>✓ Image ready</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label style={{ ...body, fontSize: '13px', fontWeight: 600, color: TS, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => setFocusedField('title')}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. Tokyo Nights Hoodie"
              maxLength={80}
              style={{ ...inputStyle, borderColor: focusedField === 'title' ? 'rgba(250,250,249,0.25)' : BS }}
            />
            <p style={{ ...mono, fontSize: '11px', color: TT, margin: '6px 0 0', textAlign: 'right' }}>{title.length}/80</p>
          </div>

          {/* Description */}
          <div>
            <label style={{ ...body, fontSize: '13px', fontWeight: 600, color: TS, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onFocus={() => setFocusedField('desc')}
              onBlur={() => setFocusedField(null)}
              placeholder="Describe your design — inspiration, style, what makes it unique…"
              maxLength={500}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', borderColor: focusedField === 'desc' ? 'rgba(250,250,249,0.25)' : BS }}
            />
            <p style={{ ...mono, fontSize: '11px', color: TT, margin: '6px 0 0', textAlign: 'right' }}>{description.length}/500</p>
          </div>

          {/* Price */}
          <div>
            <label style={{ ...body, fontSize: '13px', fontWeight: 600, color: TS, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
              Price (₹) *
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ ...body, position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: TS, fontSize: '15px', pointerEvents: 'none' }}>₹</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onFocus={() => setFocusedField('price')}
                onBlur={() => setFocusedField(null)}
                placeholder="999"
                min="1"
                step="1"
                style={{ ...inputStyle, paddingLeft: '32px', borderColor: focusedField === 'price' ? 'rgba(250,250,249,0.25)' : BS }}
              />
            </div>
            <p style={{ ...mono, fontSize: '11px', color: TT, margin: '6px 0 0' }}>
              You keep 80% · Production & shipping handled by us
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: '14px 16px', borderRadius: '8px', background: 'rgba(255,61,0,0.08)', border: `1px solid rgba(255,61,0,0.2)` }}>
              <p style={{ ...body, fontSize: '14px', color: ERR, margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '8px' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                ...body,
                padding: '16px 48px',
                borderRadius: '999px',
                background: submitting ? BG3 : AS,
                border: 'none',
                color: submitting ? TS : BG,
                fontSize: '15px',
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                letterSpacing: '0.01em',
              }}
            >
              {submitting ? 'Submitting…' : 'Submit Design'}
            </button>
            <p style={{ ...mono, fontSize: '11px', color: TT }}>
              Reviewed within 24h
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
