// ── Qikink Design Tokens ────────────────────────────────────────────────────
// Exact palette from the Qikink product creation interface

export const QK = {
  // Primary
  PRIMARY: '#FF6700',
  PRIMARY_HOVER: '#f58d36',
  PRIMARY_LIGHT: '#ff67000f',
  SELECTED_BORDER: '#f2782c',

  // Backgrounds
  BG_CREAM: '#FAF7F3',
  BG_MODAL: '#faf3ed',
  BG_WHITE: '#ffffff',

  // Text
  TEXT_DARK: '#292929',
  TEXT_MEDIUM: '#495050',
  TEXT_GRAY: '#777877',
  TEXT_MUTED: '#757575cf',

  // Borders
  BORDER: '#DDDCDC',
  BORDER_DIVIDER: '#c5c9c7',

  // Font
  FONT: '"DM Sans", "amazon ember display rg", system-ui, sans-serif',
};

// ── UV34 Configuration ──────────────────────────────────────────────────────
export const UV34_CONFIG = {
  sku: 'UV34',
  name: 'Male V Neck T-Shirt',
  printAreas: {
    front: { widthInches: 12, heightInches: 14, x: 0.300, y: 0.260, width: 0.400, height: 0.364 },
    back:  { widthInches: 14, heightInches: 15, x: 0.267, y: 0.185, width: 0.467, height: 0.390 },
  },
  sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  basePrice: 140.0,
  taxRate: 5,
};

// ── Printing Options ────────────────────────────────────────────────────────
export const PRINTING_OPTIONS = [
  { label: 'DTG Printing', value: 1 },
  { label: 'Embroidery', value: 3 },
  { label: 'DTF Printing', value: 17 },
  { label: 'Vinyl Printing', value: 'vinyl' },
];

export const VINYL_SUB_OPTIONS = [
  { label: 'Glow-In-Dark', value: 7 },
  { label: 'Rainbow Vinyl', value: 12 },
  { label: 'Gold Vinyl', value: 13 },
  { label: 'Silver Vinyl', value: 14 },
  { label: 'Reflective Grey Vinyl', value: 15 },
  { label: 'Puff-Black', value: 18 },
];
