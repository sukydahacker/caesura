import { useState } from 'react';

/**
 * CSS-based mockup preview: overlays a design image on product template photos.
 * Qikink has no mockup generation API — this is the on-brand alternative.
 */

const TEMPLATES = [
  {
    id: 'tshirt-white',
    label: 'White Tee',
    template: '/mockups/tshirt-whitefront.jpg',
    apparelType: 'tshirt',
    color: 'white',
    // Design sits roughly in the chest/front area of the shirt
    area: { top: '26%', left: '30%', width: '40%', height: '30%' },
  },
  {
    id: 'tshirt-black',
    label: 'Black Tee',
    template: '/mockups/tshirt-blackfront.jpg',
    apparelType: 'tshirt',
    color: 'black',
    area: { top: '26%', left: '30%', width: '40%', height: '30%' },
  },
  {
    id: 'tshirt-grey',
    label: 'Grey Tee',
    template: '/mockups/tshirt-grey.jpg',
    apparelType: 'tshirt',
    color: 'grey',
    area: { top: '26%', left: '30%', width: '40%', height: '30%' },
  },
  {
    id: 'tshirt-offwhite',
    label: 'Off-White Tee',
    template: '/mockups/tshirt-offwhitefront.png',
    apparelType: 'tshirt',
    color: 'offwhite',
    area: { top: '26%', left: '30%', width: '40%', height: '30%' },
  },
];

const BG2  = '#111113';
const BG3  = '#1A1A1C';
const TP   = '#FAFAF9';
const TS   = 'rgba(250,250,249,0.55)';
const TT   = 'rgba(250,250,249,0.25)';
const BS   = 'rgba(250,250,249,0.08)';
const AS   = '#C8FF00';
const body = { fontFamily: '"DM Sans", system-ui, sans-serif' };
const mono = { fontFamily: '"JetBrains Mono", monospace' };

export default function MockupPreview({ designImageUrl, compact = false }) {
  const [active, setActive] = useState(TEMPLATES[0].id);
  const tpl = TEMPLATES.find(t => t.id === active);

  return (
    <div style={{ width: '100%' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            style={{
              ...mono,
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '6px 12px',
              borderRadius: '999px',
              border: `1px solid ${active === t.id ? AS : BS}`,
              background: active === t.id ? 'rgba(200,255,0,0.08)' : 'transparent',
              color: active === t.id ? AS : TS,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Mockup frame */}
      <div
        style={{
          position: 'relative',
          background: BG2,
          borderRadius: '12px',
          overflow: 'hidden',
          aspectRatio: '1 / 1',
          maxHeight: compact ? '280px' : '420px',
        }}
      >
        {/* Product template */}
        <img
          src={tpl.template}
          alt={tpl.label}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />

        {/* Design overlay */}
        {designImageUrl && (
          <img
            src={designImageUrl}
            alt="Your design"
            style={{
              position: 'absolute',
              top: tpl.area.top,
              left: tpl.area.left,
              width: tpl.area.width,
              height: tpl.area.height,
              objectFit: 'contain',
              pointerEvents: 'none',
              // multiply blend mode makes white design areas transparent on coloured shirts
              mixBlendMode: tpl.color === 'white' ? 'multiply' : 'normal',
            }}
          />
        )}

        {/* "Preview" badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            ...mono,
            fontSize: '9px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: TT,
          }}
        >
          Preview only
        </div>
      </div>

      {!compact && (
        <p style={{ ...mono, fontSize: '10px', color: TT, marginTop: '8px', textAlign: 'center' }}>
          Final print may vary slightly. Powered by Qikink DTF printing.
        </p>
      )}
    </div>
  );
}

// Export template list so other components can reference it
export { TEMPLATES };
