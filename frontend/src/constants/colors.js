// ── Shared color hex map ──────────────────────────────────────────────────────
// Single source of truth for color-name → hex lookups across the editor.
// Keys are lowercase, trimmed color names as they appear in the product catalog.
//
// White / off-white / light variants use the white template as-is (no tint).
// Black / charcoal variants use the black template directly.
// Grey variants use the grey template directly.
// All other colors use the white template + multiply-blend tint at runtime.
//
// Bare-name keys (navy, mustard, charcoal, stone, cream, forest, burgundy) are
// included so StitchMockupEditor's standalone-preview FALLBACK_COLORS resolve
// against the same map.
export const COLOR_HEX = {
  'white':                '#FFFFFF',
  'off white':            '#F5F0EB',
  'white black':          '#FFFFFF',
  'white lavender':       '#F5F0FF',
  'black':                '#1A1A1A',
  'black melange':        '#252525',
  'black charcoal melange':'#2D2D2D',
  'black white':          '#1A1A1A',
  'brown black':          '#2C1810',
  'green black':          '#1B3020',
  'charcoal melange':     '#4A4A4A',
  'charcoal':             '#2B2B2B',
  'grey':                 '#9E9E9E',
  'grey melange':         '#A8A8A8',
  'steel grey':           '#71797E',
  'silver':               '#C0C0C0',
  'mushroom':             '#C0A898',
  'stone':                '#A8A29E',
  'navy':                 '#0E1723',
  'navy blue':            '#1C2B4A',
  'navy melange':         '#3A4B5E',
  'royal blue':           '#2845B4',
  'petrol blue':          '#005F73',
  'orchid blue':          '#7B68EE',
  'skyblue':              '#5BB8F5',
  'baby blue':            '#B0D8F0',
  'red':                  '#C0392B',
  'brick red':            '#8B2500',
  'maroon':               '#7B1818',
  'burgundy':             '#5C0E16',
  'orange':               '#F37021',
  'coral':                '#FF6B5B',
  'flamingo':             '#FC8EAC',
  'pink':                 '#FF8FA3',
  'baby pink':            '#F9C0CB',
  'light baby pink':      '#FFCDD2',
  'peach':                '#FFCBA4',
  'purple':               '#6A1B9A',
  'purple melange':       '#7E57C2',
  'lavender':             '#B57EDC',
  'bottle green':         '#1B4332',
  'forest':               '#1F3D2B',
  'flag green':           '#138808',
  'olive green':          '#708238',
  'jade':                 '#00A36C',
  'mint':                 '#98D8C8',
  'yellow':               '#F9CB1B',
  'new yellow':           '#F9CB1B',
  'mustard':              '#B6840D',
  'mustard yellow':       '#E6AC20',
  'golden yellow':        '#FFC107',
  'khaki':                '#C3B091',
  'beige':                '#F5E6C8',
  'cream':                '#F5F1E8',
  'coffee brown':         '#6F4E37',
  'copper':               '#B87333',
  'na':                   '#CCCCCC',
};

export default COLOR_HEX;
