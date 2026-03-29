import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as fabric from 'fabric';
import { uploadDesignImage, createDesign, getProductCatalog, getDesignLibrary } from '@/lib/api';
import { QK, UV34_CONFIG, PRINTING_OPTIONS, VINYL_SUB_OPTIONS } from '@/config/qikinkTheme';
import PrintingOptions from '@/components/qikink/PrintingOptions';
import DesignUploadModal from '@/components/qikink/DesignUploadModal';
import ImageDimensionsPanel from '@/components/qikink/ImageDimensionsPanel';
import SizeSelector from '@/components/qikink/SizeSelector';
import ColorSelector from '@/components/qikink/ColorSelector';
import ProductDetailsTab from '@/components/qikink/ProductDetailsTab';
import BackgroundColorPicker from '@/components/qikink/BackgroundColorPicker';
import QikinkRightPane from '@/components/qikink/QikinkRightPane';

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG   = '#0A0A0B';
const BG2  = '#111113';
const BG3  = '#1A1A1C';
const TP   = '#FAFAF9';
const TS   = 'rgba(250,250,249,0.55)';
const TT   = 'rgba(250,250,249,0.25)';
const BS   = 'rgba(250,250,249,0.08)';
const AS   = '#C8FF00';
const AW   = '#FF9500';
const ERR  = '#FF3D00';
const body    = { fontFamily: '"DM Sans", system-ui, sans-serif' };
const display = { fontFamily: '"Clash Display", "Bebas Neue", sans-serif' };
const mono    = { fontFamily: '"JetBrains Mono", monospace' };

const CANVAS_W = 620;
const CANVAS_H = 796;

// ── Qikink color hex map ─────────────────────────────────────────────────────
// Every color name that appears in the catalog mapped to its exact hex.
// White / off-white / light variants use the white template as-is (no tint).
// Black / charcoal variants use the black template directly.
// Grey variants use the grey template directly.
// All other colors use the white template + multiply-blend tint at runtime.
const COLOR_HEX = {
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
  'grey':                 '#9E9E9E',
  'grey melange':         '#A8A8A8',
  'steel grey':           '#71797E',
  'silver':               '#C0C0C0',
  'mushroom':             '#C0A898',
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
  'flag green':           '#138808',
  'olive green':          '#708238',
  'jade':                 '#00A36C',
  'mint':                 '#98D8C8',
  'yellow':               '#F9CB1B',
  'new yellow':           '#F9CB1B',
  'mustard yellow':       '#E6AC20',
  'golden yellow':        '#FFC107',
  'khaki':                '#C3B091',
  'beige':                '#F5E6C8',
  'coffee brown':         '#6F4E37',
  'copper':               '#B87333',
  'na':                   '#CCCCCC',
};

// ── Product collection groupings ────────────────────────────────────────────────
const COLLECTIONS = [
  { name: 'T-Shirts', image: '/mockups/T-shirts.PNG.webp', description: 'Crew necks, oversized, acid wash & more', keywords: ['T-Shirt', 'Tee', 'Baby Tee'] },
  { name: 'Hoodies & Jackets', image: '/mockups/Hoodies.PNG.webp', description: 'Hoodies, sweatshirts, bombers & varsity', keywords: ['Hoodie', 'Sweatshirt', 'Bomber', 'Varsity', 'Zip Hoodie'] },
  { name: 'Bottomwear', image: '/mockups/Bottomwear.PNG.webp', description: 'Joggers, shorts & sweatpants', keywords: ['Jogger', 'Short', 'Sweatpants', 'Legging'] },
  { name: 'Headwear', image: '/mockups/Headwear.PNG.webp', description: 'Caps, bucket hats, snapbacks & balaclava', keywords: ['Cap', 'Hat', 'Snapback', 'Trucker', 'Balaclava', 'Bucket'] },
  { name: 'Drinkware', image: '/mockups/Drink-ware.PNG.webp', description: 'Mugs, sippers, tumblers & bottles', keywords: ['Mug', 'Sipper', 'Tumbler', 'Bottle', 'Enamel'] },
  { name: 'Bags & Accessories', image: '/mockups/Bags.PNG.webp', description: 'Tote bags, drawstring bags, keychains & more', keywords: ['Tote', 'Bag', 'Keychain', 'Badge', 'Luggage', 'Fridge Magnet', 'Dog Tag', 'Phone', 'Grip', 'Pen', 'Bookmark', 'Arm Sleeves'] },
];

// Product images — specific product mockups (keyed by expanded category name)
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
  'Female Womens Tank Top | FT37': '/mockups/1740553193tanktop.jpg',
  'Male V Neck T-Shirt | UV34': '/mockups/1740550339Vneck.jpg',
  'Male Polo | MP25': '/mockups/1740545706Polo.jpg',
  'Male Sleeveless T-Shirt | MS36': '/mockups/1757131410Sleeveless1.webp',
  'Male Full Sleeve T-Shirt': '/mockups/1740545085mensfullsleeve.jpg',
  'Female Classic Crew T-Shirt': '/mockups/1740552082womensroundnecktee.jpg',
  'Female Crop Top | FC39': '/mockups/1740553628croptank.jpg',
  'Girl Classic Crew T-Shirt': '/mockups/1757132060Girlsroundneck1.webp',
};

// Fallback images by keyword — covers all product types not in PRODUCT_IMAGES above
function getProductImage(category) {
  if (PRODUCT_IMAGES[category]) return PRODUCT_IMAGES[category];
  const lower = category.toLowerCase();
  if (/hoodie/.test(lower))                                                         return '/mockups/hoodie-white.jpg';
  if (/sweatshirt|pullover/.test(lower))                                            return '/mockups/sweatshirt-white.jpg';
  if (/varsity|bomber|jacket/.test(lower))                                          return '/mockups/wearable-art-model.jpg';
  if (/jogger|sweatpant|short/.test(lower))                                         return '/mockups/joggers-model.jpg';
  if (/cap|hat|snapback|trucker|bucket|balaclava/.test(lower))                      return '/mockups/cap-model.jpg';
  if (/mug|tumbler|sipper|bottle|enamel/.test(lower))                               return '/mockups/mug-product.jpg';
  if (/tote|bag|drawstring/.test(lower))                                            return '/mockups/tote-model.jpg';
  if (/poster|canvas|tapestry|coaster|cushion|pillow|puzzle|mouse|placemat|tablerunner|acrylic|metal|ornament|magnet|apron|napkin|gaming/.test(lower)) return '/mockups/home-living-model.jpg';
  if (/phone|mobile|case|grip/.test(lower))                                         return '/mockups/phone-case-model.jpg';
  if (/notebook|planner|pen|bookmark|sticker|card|notepad|sketchbook|postcard|tattoo|badge|keychain|patch|luggage|tag/.test(lower)) return '/mockups/stationery-model.jpg';
  if (/romper/.test(lower) || /^(kids|boy|girl)/.test(lower))                       return '/mockups/kids-model.jpg';
  if (/dog|pet/.test(lower))                                                        return '/mockups/pet-wear-model.jpg';
  if (/aop/.test(lower))                                                            return '/mockups/aop-model.jpg';
  if (/kaftan|skirt|scrunch|bandana/.test(lower))                                   return '/mockups/womens-model.jpg';
  if (/t-shirt|tee|tank|sleeve|polo|raglan|supima|shirt|dress/.test(lower))        return '/mockups/oversized-tee-white.jpg';
  return null;
}

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

// ── PSD mockup map: SKU → { colorKey: '/mockups/SKU/color.png' } ─────────────
// Extracted from official Qikink PSD files. Each color variant is a real PNG.
const PSD_MOCKUPS = {
  'UT27': { base_white:'/mockups/UT27/base_white.png', jade:'/mockups/UT27/jade.png', flamingo:'/mockups/UT27/flamingo.png', bottle_green:'/mockups/UT27/bottle_green.png', baby_blue:'/mockups/UT27/baby_blue.png', lavender:'/mockups/UT27/lavender.png', maroon:'/mockups/UT27/maroon.png', navy_blue:'/mockups/UT27/navy_blue.png', black:'/mockups/UT27/black.png', white:'/mockups/UT27/white_full_turn_off_texture.png' },
  'UH24': { base_white:'/mockups/UH24/base_white.png', grey:'/mockups/UH24/grey_full.png', grey_melange:'/mockups/UH24/grey_full.png', baby_blue:'/mockups/UH24/baby_blue.png', mint:'/mockups/UH24/mint.png', coral:'/mockups/UH24/coral.png', lavender:'/mockups/UH24/lavender.png', light_baby_pink:'/mockups/UH24/light_baby_pink.png', mustard_yellow:'/mockups/UH24/mustard_yellow.png', olive_green:'/mockups/UH24/olive_green.png', maroon:'/mockups/UH24/maroon.png', red:'/mockups/UH24/red.png', royal_blue:'/mockups/UH24/royal_blue.png', bottle_green:'/mockups/UH24/bottle_green.png', navy_blue:'/mockups/UH24/navy_blue.png', black:'/mockups/UH24/black.png', white:'/mockups/UH24/white_fullturn_off_texture.png' },
  'UH32': { navy:'/mockups/UH32/navy.png', navy_blue:'/mockups/UH32/navy.png', green:'/mockups/UH32/green.png', maroon:'/mockups/UH32/maroon.png', light_pink:'/mockups/UH32/light_pink.png', light_baby_pink:'/mockups/UH32/light_pink.png', lavender:'/mockups/UH32/lavender.png', black:'/mockups/UH32/black.png', white:'/mockups/UH32/white.png' },
  'UH26': { light_baby_pink:'/mockups/UH26/light_baby_pink.png', navy_blue:'/mockups/UH26/navy_blue.png', black:'/mockups/UH26/black.png', olive_green:'/mockups/UH26/olive_green.png', lavender:'/mockups/UH26/lavender.png', coral:'/mockups/UH26/coral.png', white:'/mockups/UH26/white.png', maroon:'/mockups/UH26/maroon.png', mint:'/mockups/UH26/mint.png', grey_melange:'/mockups/UH26/grey_melange.png', grey:'/mockups/UH26/grey_melange.png' },
  'UH35': { navy:'/mockups/UH35/navy.png', navy_blue:'/mockups/UH35/navy.png', green:'/mockups/UH35/green.png', maroon:'/mockups/UH35/maroon.png', light_pink:'/mockups/UH35/light_pink.png', light_baby_pink:'/mockups/UH35/light_pink.png', lavender:'/mockups/UH35/lavender.png', black:'/mockups/UH35/black.png', white:'/mockups/UH35/white.png' },
  'UC22': { base_white:'/mockups/UC22/base_white.png', white:'/mockups/UC22/white_full.png', grey:'/mockups/UC22/grey_full.png', off_white:'/mockups/UC22/offwhite_full.png', baby_blue:'/mockups/UC22/baby_blue.png', mint:'/mockups/UC22/mint.png', coral:'/mockups/UC22/coral.png', lavender:'/mockups/UC22/lavender.png', light_baby_pink:'/mockups/UC22/light_baby_pink.png', mustard_yellow:'/mockups/UC22/mustard_yellow_copy.png', olive_green:'/mockups/UC22/olive_green.png', petrol_blue:'/mockups/UC22/petrol_blue.png', golden_yellow:'/mockups/UC22/golden_yellow.png', purple:'/mockups/UC22/purple.png', maroon:'/mockups/UC22/maroon.png', red:'/mockups/UC22/red.png', royal_blue:'/mockups/UC22/royal_blue.png', bottle_green:'/mockups/UC22/bottle_green.png', navy_blue:'/mockups/UC22/navy_blue.png', black:'/mockups/UC22/black.png' },
  'US22': { navy:'/mockups/US22/navy.png', navy_blue:'/mockups/US22/navy.png', grey_melange:'/mockups/US22/grey_melange.png', grey:'/mockups/US22/grey_melange.png', light_pink:'/mockups/US22/light_pink.png', light_baby_pink:'/mockups/US22/light_pink.png', lavender:'/mockups/US22/lavender.png', black:'/mockups/US22/black.png', white:'/mockups/US22/white.png', beige:'/mockups/US22/beige.png' },
  'BC01': { base_white:'/mockups/BC01/base_white.png', mustard_yellow:'/mockups/BC01/mustard_yellow.png', olive_green:'/mockups/BC01/olive_green.png', grey:'/mockups/BC01/slteel_grey.png', brick_red:'/mockups/BC01/brick_red.png', petrol_blue:'/mockups/BC01/petrol_blue.png', coffee_brown:'/mockups/BC01/coffee_brown.png', golden_yellow:'/mockups/BC01/golden_yellow.png', orange:'/mockups/BC01/orange.png', yellow:'/mockups/BC01/new_yellow.png', flag_green:'/mockups/BC01/flag_green.png', purple:'/mockups/BC01/purple.png', maroon:'/mockups/BC01/maroon.png', red:'/mockups/BC01/red.png', royal_blue:'/mockups/BC01/royal_blue.png', bottle_green:'/mockups/BC01/bottle_green.png', sky_blue:'/mockups/BC01/sky_blue.png', navy_blue:'/mockups/BC01/navy_blue.png', black:'/mockups/BC01/black.png' },
  'MP25': { grey_melange:'/mockups/MP25/grey_melange.png', grey:'/mockups/MP25/grey_melange.png', mustard_yellow:'/mockups/MP25/mustard_yellow.png', brick_red:'/mockups/MP25/brick_red.png', petrol_blue:'/mockups/MP25/petrol_blue.png', coffee_brown:'/mockups/MP25/coffee_brown.png', purple:'/mockups/MP25/purple.png', maroon:'/mockups/MP25/maroon.png', royal_blue:'/mockups/MP25/royal_blue.png', navy_blue:'/mockups/MP25/navy_blue.png', black:'/mockups/MP25/black.png', white:'/mockups/MP25/full_white_turn_off_texture.png' },
  'MS36': { white:'/mockups/MS36/white.png', black:'/mockups/MS36/black.png', grey_melange:'/mockups/MS36/grey_melange.png', grey:'/mockups/MS36/grey_melange.png', charcoal_melange:'/mockups/MS36/charcoal_melange.png', maroon:'/mockups/MS36/maroon.png', olive_green:'/mockups/MS36/olive_green.png', lavender:'/mockups/MS36/lavender.png' },
  'UC28': { black:'/mockups/UC28/black.png', lavender:'/mockups/UC28/lavender.png', maroon:'/mockups/UC28/maroon.png', pink:'/mockups/UC28/pink_turn_off_texture.png', baby_blue:'/mockups/UC28/baby_blue.png', navy:'/mockups/UC28/navy.png', navy_blue:'/mockups/UC28/navy.png', white:'/mockups/UC28/whiteturn_off_texture.png' },
  'MT45': { lavender:'/mockups/MT45/lavender.png', black:'/mockups/MT45/black.png', white:'/mockups/MT45/white.png', flamingo:'/mockups/MT45/flamingo.png' },
  'FT37': { base_white:'/mockups/FT37/base.png', white:'/mockups/FT37/white.png', navy:'/mockups/FT37/navy.png', navy_blue:'/mockups/FT37/navy.png', grey_melange:'/mockups/FT37/gray_melange.png', grey:'/mockups/FT37/gray_melange.png', black:'/mockups/FT37/black.png', pink:'/mockups/FT37/pink.png', charcoal_melange:'/mockups/FT37/charcoal_melange.png' },
  'UJ31': { lavender:'/mockups/UJ31/lavender.png', red:'/mockups/UJ31/red.png', bottle_green:'/mockups/UJ31/bottle_green.png', maroon:'/mockups/UJ31/maroon.png', navy:'/mockups/UJ31/navy.png', navy_blue:'/mockups/UJ31/navy.png', black:'/mockups/UJ31/black.png' },
  'FC32': { base_white:'/mockups/FC32/base.png', white:'/mockups/FC32/base.png', maroon:'/mockups/FC32/maroon.png', mustard_yellow:'/mockups/FC32/mustard_yellow.png', light_pink:'/mockups/FC32/light_pink.png', light_baby_pink:'/mockups/FC32/light_pink.png', black:'/mockups/FC32/black.png' },
  'FC39': { white:'/mockups/FC39/white.png' },
};

// Print areas for PSD-backed products (pixel coords on 420×600 Fabric canvas)
// Spec: 12"×14" print area, centered horizontally on each garment.
// Derived from PSD garment bounds (canvas_x = png_x*0.75 - 90, canvas_y = png_y*0.75)
// and physical garment widths for px-per-inch calibration.
//   UT27 Terry Oversized Tee  → 26" wide, ppi≈20  (PSD 1500×1500, garment x100-1400 y73-1427)
//   UH24 Unisex Hoodie        → 24" wide, ppi≈16  (PSD 1000×1000, garment x178-822 y92-924)
//   UH26 Unisex Sweatshirt    → 24" wide, ppi≈22  (PSD 1500×1500, garment x78-1387 y153-1334)
const PSD_PRINT_AREAS = {
  'UT27': { x: 136, y: 191, w: 347, h: 366 },  // 12"×14" scaled from 420×600 → 620×796
  'UH24': { x: 174, y: 303, w: 273, h: 303 },  // 11"×13" scaled
  'UH26': { x: 161, y: 207, w: 298, h: 350 },  // 12"×14" scaled
};

// Normalize a color name to a PSD map key
function normColorKey(name) {
  return (name || '').toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

// Look up PSD mockup URL for a category string + color name.
// Returns null if no PSD mockup available.
function getPsdMockup(categoryStr, colorName) {
  const skuMatch = categoryStr && categoryStr.match(/\|\s*([A-Z0-9]+)\s*$/);
  if (!skuMatch) return null;
  const sku = skuMatch[1];
  const map = PSD_MOCKUPS[sku];
  if (!map) return null;

  const key = normColorKey(colorName);
  if (map[key]) return { url: map[key], printArea: PSD_PRINT_AREAS[sku] };

  // Try first word of color (e.g., "navy" matches "navy_blue")
  const firstWord = key.split('_')[0];
  const fuzzy = Object.keys(map).find(k => k === firstWord || k.startsWith(firstWord + '_') || k.endsWith('_' + firstWord));
  if (fuzzy) return { url: map[fuzzy], printArea: PSD_PRINT_AREAS[sku] };

  // Fallback: white/base variant
  const fallbackKey = ['white', 'base_white', 'base'].find(k => map[k]);
  const fallback = fallbackKey || Object.keys(map)[0];
  return { url: map[fallback], printArea: PSD_PRINT_AREAS[sku] };
}

// Canvas editor templates — keyed by keyword pattern, checked in order
// All print areas 12"×14" (w:h = 1:1.167). JPG templates are 700×1000 at scale 0.6.
const KEYWORD_TEMPLATES = [
  { test: /hoodie/,                  template: '/mockups/hoodie-white.jpg',      printArea: { x: 174, y: 303, w: 273, h: 303 } },
  { test: /sweatshirt|pullover/,     template: '/mockups/sweatshirt-white.jpg',  printArea: { x: 161, y: 207, w: 298, h: 350 } },
  { test: /classic crew|standard crew|basic t-shirt|supima|cotton stretch/, template: '/mockups/crew-tee-white.jpg', printArea: { x: 161, y: 207, w: 298, h: 350 } },
];
const DEFAULT_TEMPLATE = { template: '/mockups/oversized-tee-white.jpg', printArea: { x: 136, y: 191, w: 347, h: 366 } };

// Specific per-SKU overrides for products without PSD mockups
// US21: 700×1000 JPG at scale 0.6 → 420×600 canvas. Garment 22" wide (ppi≈12.3). 12"×14" print.
const PRODUCT_TEMPLATES = {
  'Male Classic Crew T-Shirt':                  { template: '/mockups/crew-tee-white.jpg',      printArea: { x: 161, y: 207, w: 298, h: 350 } },
  'Female Classic Crew T-Shirt':                { template: '/mockups/crew-tee-white.jpg',      printArea: { x: 161, y: 207, w: 298, h: 350 } },
  'Boy Classic Crew T-Shirt':                   { template: '/mockups/crew-tee-white.jpg',      printArea: { x: 161, y: 207, w: 298, h: 350 } },
  'Girl Classic Crew T-Shirt':                  { template: '/mockups/crew-tee-white.jpg',      printArea: { x: 161, y: 207, w: 298, h: 350 } },
  'Male Standard Crew T-Shirt | US21':          { template: '/mockups/crew-tee-white.jpg',      printArea: { x: 161, y: 207, w: 298, h: 350 } },
  'Unisex Hoodie | UH24':                       { template: '/mockups/hoodie-white.jpg',        printArea: { x: 174, y: 303, w: 273, h: 303 } },
  'Unisex Zip Hoodie | UH38':                   { template: '/mockups/hoodie-white.jpg',        printArea: { x: 174, y: 303, w: 273, h: 303 } },
  'Unisex Pullover Hoodie | UH83':              { template: '/mockups/hoodie-white.jpg',        printArea: { x: 174, y: 303, w: 273, h: 303 } },
  'Unisex Acid Wash Hoodie | UH62':             { template: '/mockups/hoodie-white.jpg',        printArea: { x: 174, y: 303, w: 273, h: 303 } },
  'Kids Hoodie':                                { template: '/mockups/hoodie-white.jpg',        printArea: { x: 174, y: 303, w: 273, h: 303 } },
};

// ── UV34 view configs (template + print area per view on 620×796 canvas) ─────
// Print areas derived from PSD layer bounds (1000×1000 PSD → 620×796 canvas)
const UV34_VIEWS = {
  front:        { template: '/mockups/UV34/front_base.png',         printArea: { x: 161, y: 206, w: 297, h: 350 }, tintable: true },
  back:         { template: '/mockups/UV34/back_base.png',          printArea: { x: 161, y: 143, w: 297, h: 398 }, tintable: true },
  left_pocket:  { template: '/mockups/UV34/left_pocket_base.png',   printArea: { x: 341, y: 278, w: 111, h: 111 }, tintable: true },
  right_pocket: { template: '/mockups/UV34/right_pocket_base.png',  printArea: { x: 167, y: 278, w: 111, h: 111 }, tintable: true },
  left_sleeve:  { template: '/mockups/UV34/left_sleeve_base.png',   printArea: { x: 241, y: 238, w: 136, h: 159 }, tintable: false },
  right_sleeve: { template: '/mockups/UV34/right_sleeve_base.png',  printArea: { x: 241, y: 238, w: 136, h: 159 }, tintable: false },
};

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

  // Step 2 — editor
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

  // Qikink-style Step 2 state
  const [activeTab, setActiveTab] = useState('design');
  const [printType, setPrintType] = useState(1);
  const [vinylSubOption, setVinylSubOption] = useState('');
  const [plainProduct, setPlainProduct] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [activeView, setActiveView] = useState('front');
  const [designAngle, setDesignAngle] = useState(0);
  const [designDimensions, setDesignDimensions] = useState({ width: 0, height: 0, dpi: 0 });
  const [sizePrices, setSizePrices] = useState({});
  const [selectedColors, setSelectedColors] = useState([]);
  const [bgColor, setBgColor] = useState('#FAF7F3');
  const [productName, setProductName] = useState('');
  const [descriptionHtml, setDescriptionHtml] = useState('');
  const [productTags, setProductTags] = useState([]);
  const [designLibrary, setDesignLibrary] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [viewDesigns, setViewDesigns] = useState({}); // { front: { dataUrl, left, top, scaleX, scaleY, angle }, ... }

  // Load design library when upload modal opens
  useEffect(() => {
    if (showUploadModal && designLibrary.length === 0) {
      setLibraryLoading(true);
      getDesignLibrary()
        .then(res => setDesignLibrary(res.data || []))
        .catch(() => setDesignLibrary([]))
        .finally(() => setLibraryLoading(false));
    }
  }, [showUploadModal, designLibrary.length]);

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

  const normalizeSearch = (s) => s.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
  const filteredCatalog = searchQuery.trim()
    ? (() => {
        const q = normalizeSearch(searchQuery);
        // Also try alternative forms: "t-shirt" ↔ "t shirt", strip SKU codes
        const qHyphen = q.replace(/\s/g, '-');
        return catalog.filter(c => {
          const cat = normalizeSearch(c.category);
          const catNoSku = normalizeSearch(c.category.split('|')[0]);
          return cat.includes(q) || catNoSku.includes(q) || cat.includes(qHyphen);
        });
      })()
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

  // Map selected color → template color suffix (white/black/grey)
  const getTemplateColorSuffix = () => {
    const l = (selectedColor || '').toLowerCase();
    if (l.includes('black') || l.includes('charcoal')) return 'black';
    if (l.includes('grey') || l.includes('gray') || l.includes('melange')) return 'grey';
    return 'white';
  };

  // Swap template file to the color variant if one exists on disk
  const colorizeTemplate = (tmpl) => {
    const colorSuffix = getTemplateColorSuffix();
    if (colorSuffix === 'white') return tmpl;
    // Replace "-white" with the color suffix, or append it
    const colored = tmpl.template.replace(/-white\./, `-${colorSuffix}.`);
    // Only use the colored version if it's a known available file
    const available = [
      '/mockups/hoodie-black.jpg', '/mockups/hoodie-grey.jpg',
      '/mockups/sweatshirt-black.jpg', '/mockups/sweatshirt-grey.jpg',
      '/mockups/crew-tee-black.jpg', '/mockups/crew-tee-grey.jpg',
      '/mockups/oversized-tee-black.jpg',
    ];
    return { ...tmpl, template: available.includes(colored) ? colored : tmpl.template };
  };

  const getProductTemplate = () => {
    if (!selectedCategory) return colorizeTemplate(DEFAULT_TEMPLATE);
    const cat = selectedCategory.category;
    // 1. PSD mockup (real extracted PNG per color)
    const psd = getPsdMockup(cat, selectedColor);
    if (psd) return { template: psd.url, printArea: psd.printArea || PSD_PRINT_AREAS['UT27'], isPsd: true };
    // 2. Exact fallback template match
    if (PRODUCT_TEMPLATES[cat]) return colorizeTemplate(PRODUCT_TEMPLATES[cat]);
    // 3. Keyword match
    const lower = cat.toLowerCase();
    const kwMatch = KEYWORD_TEMPLATES.find(k => k.test.test(lower));
    if (kwMatch) return colorizeTemplate({ template: kwMatch.template, printArea: kwMatch.printArea });
    // 4. Default
    return colorizeTemplate(DEFAULT_TEMPLATE);
  };

  // Save current view's design placement before switching
  const saveCurrentViewDesign = useCallback(() => {
    const d = designObjRef.current;
    if (!d || !imagePreview) return;
    setViewDesigns(prev => ({
      ...prev,
      [activeView]: { dataUrl: imagePreview, left: d.left, top: d.top, scaleX: d.scaleX, scaleY: d.scaleY, angle: d.angle || 0 },
    }));
  }, [activeView, imagePreview]);

  // Update live dimensions from canvas design object
  const updateDimensionsFromCanvas = useCallback((obj) => {
    if (!obj) return;
    const viewConfig = UV34_VIEWS[activeView] || UV34_VIEWS.front;
    const pa = viewConfig.printArea;
    // Approximate: print area width in inches (front = 12"), px per inch
    const printWidthInches = activeView.includes('pocket') ? 5 : activeView.includes('sleeve') ? 6 : 12;
    const pxPerInch = pa.w / printWidthInches;
    const widthInches = (obj.width * obj.scaleX) / pxPerInch;
    const heightInches = (obj.height * obj.scaleY) / pxPerInch;
    const dpi = Math.round(obj.width / widthInches);
    setDesignDimensions({ width: parseFloat(widthInches.toFixed(2)), height: parseFloat(heightInches.toFixed(2)), dpi });
    setDesignAngle(Math.round(obj.angle || 0));
  }, [activeView]);

  // UV34 color lookup helper
  const UV34_COLOR_MAP = {
    'black': '#151515', 'navy blue': '#000b17', 'bottle green': '#073717',
    'royal blue': '#131b4f', 'red': '#8f0001', 'maroon': '#290005',
    'purple': '#270f33', 'golden yellow': '#ffa100', 'petrol blue': '#092b2f',
    'olive green': '#252509', 'mustard yellow': '#b5830d', 'light baby pink': '#ffd3e9',
    'lavender': '#dfd1fb', 'coral': '#b34945', 'mint': '#adffef',
    'baby blue': '#adffef', 'grey': '#b3b5b9', 'white': '#f5f7f9',
  };

  // ── Canvas init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 2 || !canvasElRef.current) return;

    let cancelled = false;
    let keyHandler = null;

    const init = async () => {
      // Save previous view design
      if (fabricRef.current && designObjRef.current) saveCurrentViewDesign();
      if (fabricRef.current) { fabricRef.current.dispose(); fabricRef.current = null; designObjRef.current = null; }

      const viewConfig = UV34_VIEWS[activeView] || UV34_VIEWS.front;
      const tmpl = { template: viewConfig.template, printArea: viewConfig.printArea };
      const pa = tmpl.printArea;

      const canvas = new fabric.Canvas(canvasElRef.current, {
        width: CANVAS_W, height: CANVAS_H, backgroundColor: '#F8F8F6', selection: false,
      });
      if (cancelled) { canvas.dispose(); return; }
      fabricRef.current = canvas;

      // ── 1. Load garment template + apply color tint ──
      try {
        const bgDataUrl = await toDataURL(tmpl.template);
        if (cancelled) return;
        const bgImg = await fabric.FabricImage.fromURL(bgDataUrl);
        if (cancelled) return;
        const bgScale = Math.max(CANVAS_W / bgImg.width, CANVAS_H / bgImg.height);
        bgImg.set({
          originX: 'center', originY: 'center',
          left: CANVAS_W / 2, top: CANVAS_H / 2,
          scaleX: bgScale, scaleY: bgScale,
          selectable: false, evented: false, name: 'garment',
        });

        // Color tinting — only on tintable views (front/back), skip sleeve/pocket
        const colorKey = (selectedColor || '').toLowerCase().trim();
        const tintHex = UV34_COLOR_MAP[colorKey] || COLOR_HEX[colorKey];
        const skipTint = !tintHex || colorKey === 'white' || colorKey === '' || tintHex === '#f5f7f9' || !viewConfig.tintable;

        if (!skipTint) {
          const isLightColor = ['#ffd3e9','#dfd1fb','#adffef','#b3b5b9','#ffa100','#b5830d'].includes(tintHex);
          bgImg.filters = [new fabric.filters.BlendColor({
            color: tintHex,
            mode: isLightColor ? 'tint' : 'multiply',
            alpha: isLightColor ? 0.6 : 0.8,
          })];
          bgImg.applyFilters();
        }

        canvas.add(bgImg);
        canvas.renderAll();
      } catch (_) {}

      // ── 2. Clamping: keep design fully inside print area ──
      const clampDesign = (obj) => {
        // Use simple center+half-size math (works without rotation)
        const w = obj.width * obj.scaleX;
        const h = obj.height * obj.scaleY;
        let l = obj.left, t = obj.top;
        if (l - w / 2 < pa.x)          l = pa.x + w / 2;
        if (t - h / 2 < pa.y)          t = pa.y + h / 2;
        if (l + w / 2 > pa.x + pa.w)   l = pa.x + pa.w - w / 2;
        if (t + h / 2 > pa.y + pa.h)   t = pa.y + pa.h - h / 2;
        obj.set({ left: l, top: t });
        obj.setCoords();
      };

      // ── 3. Canvas event handlers ──
      canvas.on('object:moving', (e) => {
        if (e.target?.name === 'design') { clampDesign(e.target); updateDimensionsFromCanvas(e.target); }
      });
      canvas.on('object:scaling', (e) => {
        const obj = e.target;
        if (!obj || obj.name !== 'design') return;
        // Cap scale so design can't exceed print area
        const maxScaleX = pa.w / obj.width;
        const maxScaleY = pa.h / obj.height;
        const maxScale = Math.min(maxScaleX, maxScaleY);
        if (obj.scaleX > maxScale) obj.scaleX = maxScale;
        if (obj.scaleY > maxScale) obj.scaleY = maxScale;
        obj.setCoords();
        clampDesign(obj);
        updateDimensionsFromCanvas(obj);
      });
      canvas.on('object:rotating', (e) => {
        if (e.target?.name === 'design') updateDimensionsFromCanvas(e.target);
      });
      canvas.on('object:modified', (e) => {
        if (e.target?.name === 'design') { clampDesign(e.target); updateDimensionsFromCanvas(e.target); }
      });

      // ── 4. Delete key handler ──
      keyHandler = (e) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && designObjRef.current && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          canvas.remove(designObjRef.current);
          canvas.getObjects().filter(o => o.name === 'printArea').forEach(o => canvas.remove(o));
          designObjRef.current = null;
          setDesignDimensions({ width: 0, height: 0, dpi: 0 });
          setDesignAngle(0);
          setImageFile(null); setImagePreview(null);
          canvas.renderAll();
        }
      };
      document.addEventListener('keydown', keyHandler);

      // ── 5. Place design + print area boundary (only if design uploaded) ──
      const savedDesign = viewDesigns[activeView];
      const designDataUrl = savedDesign?.dataUrl || imagePreview;

      if (designDataUrl) {
        // Red dashed print area boundary
        const printAreaRect = new fabric.Rect({
          left: pa.x + pa.w / 2,
          top: pa.y + pa.h / 2,
          width: pa.w,
          height: pa.h,
          originX: 'center', originY: 'center',
          fill: 'transparent',
          stroke: '#FF0000',
          strokeWidth: 2,
          strokeDashArray: [10, 5],
          strokeUniform: true,
          selectable: false,
          evented: false,
          name: 'printArea',
          objectCaching: false,
        });
        canvas.add(printAreaRect);

        // Load and place design
        try {
          const designImg = await fabric.FabricImage.fromURL(designDataUrl);
          if (cancelled) return;

          if (savedDesign) {
            designImg.set({
              left: savedDesign.left, top: savedDesign.top,
              originX: 'center', originY: 'center',
              scaleX: savedDesign.scaleX, scaleY: savedDesign.scaleY,
              angle: savedDesign.angle || 0,
            });
          } else {
            const scale = Math.min((pa.w * 0.8) / designImg.width, (pa.h * 0.8) / designImg.height);
            designImg.set({
              left: pa.x + pa.w / 2, top: pa.y + pa.h / 2,
              originX: 'center', originY: 'center',
              scaleX: scale, scaleY: scale,
            });
          }

          // Common design object settings
          designImg.set({
            name: 'design',
            cornerSize: 10,
            cornerColor: '#FF0000',
            cornerStrokeColor: '#ffffff',
            borderColor: '#FF0000',
            transparentCorners: false,
            padding: 5,
            borderScaleFactor: 1.5,
            lockRotation: false,
          });

          // Add delete control (red × circle) at top-right corner
          designImg.controls.deleteControl = new fabric.Control({
            x: 0.5, y: -0.5,
            offsetX: 14, offsetY: -14,
            cursorStyle: 'pointer',
            mouseUpHandler: () => {
              canvas.remove(designImg);
              canvas.getObjects().filter(o => o.name === 'printArea').forEach(o => canvas.remove(o));
              designObjRef.current = null;
              setDesignDimensions({ width: 0, height: 0, dpi: 0 });
              setDesignAngle(0);
              setImageFile(null); setImagePreview(null);
              canvas.renderAll();
              return true;
            },
            render: (ctx, left, top) => {
              const size = 22;
              ctx.save();
              ctx.translate(left, top);
              // Red circle
              ctx.beginPath();
              ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
              ctx.fillStyle = '#FF0000';
              ctx.fill();
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 1.5;
              ctx.stroke();
              // White × icon
              ctx.fillStyle = '#fff';
              ctx.font = 'bold 14px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('×', 0, 1);
              ctx.restore();
            },
          });

          canvas.add(designImg);
          canvas.setActiveObject(designImg);
          designObjRef.current = designImg;
          updateDimensionsFromCanvas(designImg);
        } catch (_) {}
      }

      canvas.renderAll();
    };

    init();
    return () => {
      cancelled = true;
      if (keyHandler) document.removeEventListener('keydown', keyHandler);
      if (fabricRef.current) { fabricRef.current.dispose(); fabricRef.current = null; designObjRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, imagePreview, selectedCategory, selectedColor, activeView]);

  // ── Sync angle input → canvas ──
  useEffect(() => {
    const d = designObjRef.current;
    const c = fabricRef.current;
    if (!d || !c) return;
    if (Math.round(d.angle || 0) !== designAngle) {
      d.set({ angle: designAngle });
      d.setCoords();
      c.renderAll();
    }
  }, [designAngle]);

  // ── Submit (upload image + export mockup + create design) ───────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!imageFile) { setError('Please upload a design image.'); return; }
    const effectiveTitle = (productName || title).trim();
    if (!effectiveTitle) { setError('Please enter a product name.'); return; }
    // Validate pricing: either per-size prices or single price
    const hasSizePrices = Object.keys(sizePrices).length > 0 && Object.values(sizePrices).some(v => v > 0);
    if (!hasSizePrices && (!price || isNaN(Number(price)) || Number(price) <= 0)) { setError('Please set pricing for at least one size.'); return; }
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

      // Determine effective print type label
      const printTypeLabel = printType === 'vinyl' ? `vinyl_${vinylSubOption}` : PRINTING_OPTIONS.find(o => o.value === printType)?.label || 'dtf';

      // 3. Create design with Qikink-style fields
      await createDesign({
        title: (productName || title).trim(),
        description: description.trim(),
        description_html: descriptionHtml,
        price: Object.keys(sizePrices).length > 0 ? Math.min(...Object.values(sizePrices).filter(v => v > 0)) : (Number(price) || 0),
        size_prices: Object.keys(sizePrices).length > 0 ? sizePrices : undefined,
        image_url: hostedImageUrl,
        mockup_image_url: mockupUrl,
        product_type: selectedCategory?.category || 'V Neck T-Shirt | UV34',
        placement_coordinates: placementCoords,
        placement_view: activeView,
        selected_sizes: selectedSizes,
        selected_color: selectedColors[0] || selectedColor,
        selected_colors: [selectedColor],
        print_type: printTypeLabel,
        tags: productTags,
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

      {/* ── STEP 2: Product Editor (exact Qikink replica) ── */}
      {step === 2 && selectedCategory && (
        <div style={{ background: '#FAF7F3', minHeight: '100vh', color: '#292929', fontFamily: '"DM Sans", "amazon ember display rg", sans-serif' }}>

          {/* Hidden file input */}
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])} />

          {/* ═══ TOP NAV BAR (Back + 3 steps + Save Product) ═══ */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: '#fff', borderBottom: '1px solid #DDDCDC' }}>
            <button onClick={() => setStep(1)} style={{ background: '#FF6700', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              {['Choose Collections', 'Select Products', 'Create Product'].map((label, i) => {
                const isActive = i === 2;
                return (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isActive ? '#FF6700' : (i < 2 ? '#FF6700' : '#ccc'), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                      {i < 2 ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: '13px', color: isActive ? '#FF6700' : '#777877', fontWeight: isActive ? 600 : 400 }}>{label}</span>
                  </div>
                );
              })}
            </div>
            <button onClick={handleSubmit} disabled={submitting}
              style={{ background: '#FF6700', color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 20px', fontSize: '14px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1, fontFamily: 'inherit' }}>
              {submitting ? 'Saving...' : 'Save Product'}
            </button>
          </div>

          {/* ═══ MAIN CONTENT: Left (canvas) | Right (controls) ═══ */}
          <div style={{ display: 'flex', minHeight: 'calc(100vh - 50px)' }}>

            {/* ═══ LEFT HALF: View thumbs + Canvas ═══ */}
            <div style={{ flex: '0 0 50%', padding: '16px 20px', background: '#FAF7F3' }}>

              {/* Product name */}
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#292929', margin: '0 0 12px', fontFamily: 'inherit' }}>
                {selectedCategory.category}
              </p>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
              {/* View Thumbnails (vertical strip) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginRight: '12px', paddingTop: '12px' }}>
                <button style={{ background: 'none', border: 'none', color: '#777877', cursor: 'pointer', fontSize: '14px', padding: '4px' }}>▲</button>

                {[
                  { label: 'Front', key: 'front', img: '/mockups/UV34/front_base.png' },
                  { label: 'Back', key: 'back', img: '/mockups/UV34/back_base.png' },
                  { label: 'Left Pocket', key: 'left_pocket', img: '/mockups/UV34/left_pocket_base.png' },
                  { label: 'Right Pocket', key: 'right_pocket', img: '/mockups/UV34/right_pocket_base.png' },
                  { label: 'Left Sleeve', key: 'left_sleeve', img: '/mockups/UV34/left_sleeve_base.png' },
                  { label: 'Right Sleeve', key: 'right_sleeve', img: '/mockups/UV34/right_sleeve_base.png' },
                ].map((view) => {
                  const isViewActive = activeView === view.key;
                  return (
                    <div key={view.key} onClick={() => { saveCurrentViewDesign(); setActiveView(view.key); }}
                      style={{ cursor: 'pointer', textAlign: 'center', marginBottom: '6px' }}>
                      <div style={{
                        width: '81px', height: '81px', overflow: 'hidden',
                        border: isViewActive ? '2px solid #FF6700' : '1px solid #DDDCDC',
                        background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <img src={view.img} alt={view.label}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                      <span style={{ fontSize: '10px', color: isViewActive ? '#FF6700' : '#777877', display: 'block', marginTop: '2px' }}>{view.label}</span>
                    </div>
                  );
                })}

                <button style={{ background: 'none', border: 'none', color: '#777877', cursor: 'pointer', fontSize: '14px', padding: '4px' }}>▼</button>
              </div>

              {/* Canvas */}
              <div style={{ position: 'relative' }}>
                <div style={{ border: '1px solid #DDDCDC', overflow: 'hidden', display: 'inline-block', lineHeight: 0 }}>
                  <canvas ref={canvasElRef} />
                </div>

                {/* Alignment floating pill below canvas */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '10px 24px', borderRadius: '30px', boxShadow: '2px 2px 10px rgba(0,0,0,0.15)', background: '#fff', width: 'fit-content', margin: '16px auto 0' }}>
                  {[
                    { label: 'Center Vertically', icon: '⇕', action: () => { const d = designObjRef.current; const c = fabricRef.current; if (!d || !c) return; const pa = (UV34_VIEWS[activeView] || UV34_VIEWS.front).printArea; d.set({ left: pa.x + pa.w / 2 }); d.setCoords(); c.renderAll(); }},
                    { label: 'Center Horizontally', icon: '⇔', action: () => { const d = designObjRef.current; const c = fabricRef.current; if (!d || !c) return; const pa = (UV34_VIEWS[activeView] || UV34_VIEWS.front).printArea; d.set({ top: pa.y + pa.h / 2 }); d.setCoords(); c.renderAll(); }},
                    { label: 'Flip Horizontal', icon: '⇄', action: () => { const d = designObjRef.current; if (!d) return; d.set({ flipX: !d.flipX }); fabricRef.current?.renderAll(); }},
                    { label: 'Flip Vertical', icon: '⇅', action: () => { const d = designObjRef.current; if (!d) return; d.set({ flipY: !d.flipY }); fabricRef.current?.renderAll(); }},
                    { label: 'Center Both', icon: '⊕', action: () => { const d = designObjRef.current; const c = fabricRef.current; if (!d || !c) return; const pa = (UV34_VIEWS[activeView] || UV34_VIEWS.front).printArea; d.set({ left: pa.x + pa.w / 2, top: pa.y + pa.h / 2 }); d.setCoords(); c.renderAll(); }},
                    { label: 'Undo', icon: '↺', action: () => { fabricRef.current?.undo?.(); }},
                  ].map((btn) => (
                    <button key={btn.label} onClick={btn.action} title={btn.label}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF6700', fontSize: '22px', padding: '2px 4px', lineHeight: 1 }}>
                      {btn.icon}
                    </button>
                  ))}
                </div>
              </div>
              </div>
            </div>

            {/* ═══ RIGHT HALF: QikinkRightPane ═══ */}
            <div style={{ flex: '0 0 50%', borderLeft: '1px solid #DDDCDC', background: '#fff', overflow: 'auto', maxHeight: 'calc(100vh - 50px)' }}>
              <QikinkRightPane
                productName={selectedCategory.category}
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
                basePrice={140}
                taxRate={5}
                selectedSizes={selectedSizes}
                onToggleSize={toggleSize}
                sizePrices={sizePrices}
                onSizePriceChange={(size, p) => setSizePrices(prev => ({ ...prev, [size]: p }))}
                selectedColors={[selectedColor]}
                imagePreview={imagePreview}
                onAddDesign={() => fileInputRef.current?.click()}
                onDeleteDesign={() => {
                  // Clear all design state — useEffect will re-render canvas clean
                  setImageFile(null); setImagePreview(null); setImageUrl('');
                  setDesignDimensions({ width: 0, height: 0, dpi: 0 }); setDesignAngle(0);
                  setViewDesigns({});
                }}
                designDimensions={designDimensions}
                designAngle={designAngle}
                onAngleChange={setDesignAngle}
                onWidthChange={(v) => setDesignDimensions(d => ({ ...d, width: v }))}
                onHeightChange={(v) => setDesignDimensions(d => ({ ...d, height: v }))}
                printType={printType}
                onPrintTypeChange={setPrintType}
                vinylSubOption={vinylSubOption}
                onVinylSubChange={setVinylSubOption}
                plainProduct={plainProduct}
                onPlainProductChange={setPlainProduct}
                onShowSizeChart={() => setShowSizeChart(true)}
                bgColor={bgColor}
                onBgColorChange={setBgColor}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                productTitle={productName}
                onProductTitleChange={setProductName}
                descriptionHtml={descriptionHtml}
                onDescriptionChange={setDescriptionHtml}
                tags={productTags}
                onTagsChange={setProductTags}
                onSave={handleSubmit}
                onDownloadMockups={() => {
                  if (!fabricRef.current) return;
                  fabricRef.current.discardActiveObject(); fabricRef.current.renderAll();
                  const link = document.createElement('a'); link.download = 'mockup.png';
                  link.href = fabricRef.current.toDataURL({ format: 'png', multiplier: 2 }); link.click();
                }}
                submitting={submitting}
              />
            </div>
          </div>

          {/* ═══ Modals ═══ */}
          {showSizeChart && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowSizeChart(false)}>
              <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#292929' }}>Size Chart</h3>
                  <button onClick={() => setShowSizeChart(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#777877' }}>×</button>
                </div>
                <img src="/mockups/sizechart-uv34.webp" alt="Size Chart" style={{ width: '100%', borderRadius: '4px' }} />
              </div>
            </div>
          )}

          {error && (
            <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', padding: '12px 24px', borderRadius: '8px', background: '#FFF3E0', border: '1px solid #FFB74D', zIndex: 1000 }}>
              <p style={{ fontSize: '14px', color: '#E65100', margin: 0 }}>{error}</p>
            </div>
          )}
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
        {getProductImage(item.category) ? (
          <img src={getProductImage(item.category)} alt={item.category}
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
            {item.colors.slice(0, 5).map((c, i) => {
                const hex = COLOR_HEX[c.toLowerCase().trim()] || '#999999';
                const isLight = hex === '#FFFFFF' || hex === '#F5F0EB' || hex === '#F5F0FF' || hex === '#FFCDD2' || hex === '#F8F8F6';
                return (
                  <div key={i} title={c} style={{
                    width: '12px', height: '12px', borderRadius: '50%',
                    background: hex,
                    border: isLight ? '1.5px solid rgba(0,0,0,0.2)' : '1.5px solid rgba(255,255,255,0.9)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  }} />
                );
              })}
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
