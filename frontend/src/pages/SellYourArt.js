import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadDesignImage, createDesign } from '@/lib/api';
import MockupPreview from '@/components/MockupPreview';

// ── Design tokens ─────────────────────────────────────────────────────────────
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

const inputStyle = (focused) => ({
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
});

// Steps: 1 = upload, 2 = preview, 3 = details
export default function SellYourArt() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);

  // Step 1 — image
  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl]     = useState('');
  const [uploading, setUploading]   = useState(false);
  const [dragOver, setDragOver]     = useState(false);

  // Step 3 — details
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice]           = useState('');
  const [focused, setFocused]       = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);

  // ── Image handling ──────────────────────────────────────────────────────────

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP).');
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
    handleFile(e.dataTransfer.files[0]);
  };

  const uploadImage = async () => {
    if (!imageFile) return;
    setUploading(true);
    setError('');
    try {
      const res = await uploadDesignImage(imageFile);
      const url = res.data.url || res.data.image_url || '';
      setImageUrl(url);
      setStep(2); // advance to preview
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('Please enter a title.'); return; }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError('Please enter a valid price greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      await createDesign({
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        image_url: imageUrl,
      });
      setSuccess(true);
    } catch (e) {
      setError(e.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '440px' }}>
          <div style={{ fontSize: '52px', marginBottom: '24px' }}>✦</div>
          <h2 style={{ ...display, fontWeight: 700, fontSize: '40px', color: AS, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
            Design Submitted!
          </h2>
          <p style={{ ...body, fontSize: '16px', color: TS, lineHeight: 1.7, margin: '0 0 12px' }}>
            Your design is now pending admin review. Once approved, it goes live on the marketplace and Qikink handles all printing and shipping automatically.
          </p>
          <p style={{ ...mono, fontSize: '11px', color: TT, margin: '0 0 40px' }}>
            You keep 80% of every sale.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => { setSuccess(false); setStep(1); setImageFile(null); setImagePreview(null); setImageUrl(''); setTitle(''); setDescription(''); setPrice(''); }}
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
          onClick={() => step > 1 ? setStep(step - 1) : navigate('/')}
          style={{ ...body, background: 'none', border: 'none', color: TS, cursor: 'pointer', fontSize: '14px', padding: 0 }}
        >
          ← {step > 1 ? 'Back' : 'Home'}
        </button>
        <span style={{ ...mono, fontSize: '11px', color: TT, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Caesura / Sell Your Art
        </span>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {[1, 2, 3].map(s => (
            <div
              key={s}
              style={{
                width: s === step ? '20px' : '6px',
                height: '6px',
                borderRadius: '999px',
                background: s === step ? AS : s < step ? 'rgba(200,255,0,0.4)' : BS,
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 24px 80px' }}>

        {/* ── STEP 1: Upload ── */}
        {step === 1 && (
          <div>
            <span style={{ ...mono, fontSize: '11px', color: TT, letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
              Step 1 of 3 — Upload Design
            </span>
            <h1 style={{ ...display, fontWeight: 700, fontSize: 'clamp(36px, 6vw, 64px)', margin: '0 0 8px', lineHeight: 0.95, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
              Sell Your Art
            </h1>
            <p style={{ ...body, fontSize: '16px', color: TS, margin: '16px 0 48px', lineHeight: 1.6 }}>
              Upload your design — we'll show you a live mockup on actual products before you publish.
            </p>

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
                minHeight: imagePreview ? 'auto' : '280px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: imagePreview ? 'default' : 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s',
                marginBottom: '24px',
              }}
            >
              {imagePreview ? (
                <div style={{ position: 'relative', width: '100%' }}>
                  <img
                    src={imagePreview}
                    alt="Design preview"
                    style={{ width: '100%', maxHeight: '380px', objectFit: 'contain', borderRadius: '14px', display: 'block' }}
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    style={{ position: 'absolute', top: '12px', right: '12px', ...body, padding: '8px 16px', borderRadius: '999px', background: 'rgba(0,0,0,0.7)', border: `1px solid ${BS}`, color: TP, fontSize: '12px', cursor: 'pointer', backdropFilter: 'blur(8px)' }}
                  >
                    Change image
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.3 }}>⬆</div>
                  <p style={{ ...body, fontSize: '16px', color: TS, margin: '0 0 8px', fontWeight: 500 }}>
                    Drop your design here, or <span style={{ color: AS }}>browse files</span>
                  </p>
                  <p style={{ ...mono, fontSize: '11px', color: TT, margin: 0 }}>
                    PNG · JPG · WEBP · min 800×800px recommended
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])}
            />

            {error && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,61,0,0.08)', border: `1px solid rgba(255,61,0,0.2)`, marginBottom: '20px' }}>
                <p style={{ ...body, fontSize: '14px', color: ERR, margin: 0 }}>{error}</p>
              </div>
            )}

            <button
              onClick={uploadImage}
              disabled={!imageFile || uploading}
              style={{
                ...body,
                padding: '16px 48px',
                borderRadius: '999px',
                background: imageFile && !uploading ? AS : BG3,
                border: 'none',
                color: imageFile && !uploading ? BG : TS,
                fontSize: '15px',
                fontWeight: 700,
                cursor: imageFile && !uploading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              {uploading ? 'Uploading…' : 'Preview on Products →'}
            </button>
          </div>
        )}

        {/* ── STEP 2: Preview mockups ── */}
        {step === 2 && (
          <div>
            <span style={{ ...mono, fontSize: '11px', color: TT, letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
              Step 2 of 3 — Mockup Preview
            </span>
            <h1 style={{ ...display, fontWeight: 700, fontSize: 'clamp(36px, 5vw, 56px)', margin: '0 0 8px', lineHeight: 0.95, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
              Here's Your Design
            </h1>
            <p style={{ ...body, fontSize: '15px', color: TS, margin: '16px 0 40px', lineHeight: 1.6 }}>
              Preview how your design looks on different products. Qikink prints and ships every order — you never touch inventory.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
              {/* Mockup preview panel */}
              <MockupPreview designImageUrl={imageUrl} />

              {/* Info sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: BG2, borderRadius: '12px', padding: '24px', border: `1px solid ${BS}` }}>
                  <p style={{ ...mono, fontSize: '10px', color: TT, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>How it works</p>
                  {[
                    ['1', 'You upload your art', 'We put it on t-shirts, hoodies and more.'],
                    ['2', 'Admin reviews your design', 'Usually within 24 hours.'],
                    ['3', 'Customers buy from Caesura', 'Qikink prints & ships every order.'],
                    ['4', 'You earn 80%', 'Paid out monthly, zero hassle.'],
                  ].map(([num, title, desc]) => (
                    <div key={num} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ ...mono, fontSize: '11px', color: AS, width: '16px', flexShrink: 0, paddingTop: '2px' }}>{num}</div>
                      <div>
                        <p style={{ ...body, fontWeight: 600, fontSize: '14px', color: TP, margin: '0 0 2px' }}>{title}</p>
                        <p style={{ ...body, fontSize: '13px', color: TS, margin: 0 }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'rgba(200,255,0,0.04)', border: `1px solid rgba(200,255,0,0.15)`, borderRadius: '12px', padding: '16px 20px' }}>
                  <p style={{ ...mono, fontSize: '10px', color: AS, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 8px' }}>Print method</p>
                  <p style={{ ...body, fontSize: '14px', color: TP, margin: 0 }}>DTF (Direct to Film) — works on all fabric types, vibrant colours, no minimum order.</p>
                </div>

                <button
                  onClick={() => setStep(3)}
                  style={{ ...body, padding: '16px 40px', borderRadius: '999px', background: AS, border: 'none', color: BG, fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Looks good — add details →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Details & submit ── */}
        {step === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' }}>
            {/* Left: compact mockup preview */}
            <MockupPreview designImageUrl={imageUrl} compact />

            {/* Right: form */}
            <div>
              <span style={{ ...mono, fontSize: '11px', color: TT, letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                Step 3 of 3 — Details
              </span>
              <h1 style={{ ...display, fontWeight: 700, fontSize: 'clamp(28px, 4vw, 44px)', margin: '0 0 32px', lineHeight: 0.95, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                Publish Your Design
              </h1>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Title */}
                <div>
                  <label style={{ ...body, fontSize: '12px', fontWeight: 600, color: TS, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onFocus={() => setFocused('title')}
                    onBlur={() => setFocused(null)}
                    placeholder="e.g. Tokyo Nights Drop"
                    maxLength={80}
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
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onFocus={() => setFocused('desc')}
                    onBlur={() => setFocused(null)}
                    placeholder="Tell buyers about your design — the story, the vibe, the inspiration…"
                    maxLength={500}
                    rows={4}
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
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      onFocus={() => setFocused('price')}
                      onBlur={() => setFocused(null)}
                      placeholder="999"
                      min="1"
                      step="1"
                      style={{ ...inputStyle(focused === 'price'), paddingLeft: '32px' }}
                    />
                  </div>
                  <p style={{ ...mono, fontSize: '10px', color: TT, margin: '4px 0 0' }}>
                    {price && Number(price) > 0
                      ? `You earn ₹${Math.round(Number(price) * 0.8)} per sale (80%)`
                      : 'You keep 80% of every sale'}
                  </p>
                </div>

                {error && (
                  <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,61,0,0.08)', border: `1px solid rgba(255,61,0,0.2)` }}>
                    <p style={{ ...body, fontSize: '14px', color: ERR, margin: 0 }}>{error}</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '8px' }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      ...body,
                      padding: '16px 40px',
                      borderRadius: '999px',
                      background: submitting ? BG3 : AS,
                      border: 'none',
                      color: submitting ? TS : BG,
                      fontSize: '15px',
                      fontWeight: 700,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                    }}
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
