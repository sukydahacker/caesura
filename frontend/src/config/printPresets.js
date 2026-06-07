/**
 * Internal Print Presets Configuration
 * These presets define the print constraints for different product types.
 * IMPORTANT: These are internal specifications - never expose to creators.
 */

export const PRINT_PRESETS = {
  tshirt: {
    id: 'tshirt',
    name: 'Classic T-Shirt',
    printMethod: 'dtf',
    placements: {
      front: { maxWidth: 38, maxHeight: 48, scaleRatio: 0.85, position: 'center' },
      back:  { maxWidth: 38, maxHeight: 48, scaleRatio: 0.85, position: 'center' }
    },
    basePrice: 799,
    availableColors: ['white', 'black', 'yellow', 'grey'],
    mockupImages: {
      white: '/mockups/tshirt-whitefront.jpg',
      black: '/mockups/tshirt-black.jpg',
      yellow: '/mockups/tshirt-yellow.jpg',
      grey: '/mockups/tshirt-grey.jpg',
    }
  },
  hoodie: {
    id: 'hoodie',
    name: 'Premium Hoodie',
    printMethod: 'dtf',
    placements: {
      front: { maxWidth: 38, maxHeight: 48, scaleRatio: 0.85, position: 'center' },
      back:  { maxWidth: 38, maxHeight: 48, scaleRatio: 0.85, position: 'center' }
    },
    basePrice: 1499,
    availableColors: ['white', 'black', 'yellow', 'grey'],
    mockupImages: {
      white: '/mockups/tshirt-white.jpg',
      black: '/mockups/hoodie-grey.jpg',
      yellow: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800',
      grey: 'https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=800'
    }
  },
  oversized_tshirt: {
    id: 'oversized_tshirt',
    name: 'Oversized T-Shirt',
    printMethod: 'dtf',
    placements: {
      front: { maxWidth: 40, maxHeight: 52, scaleRatio: 0.82, position: 'center' },
      back:  { maxWidth: 40, maxHeight: 52, scaleRatio: 0.82, position: 'center' }
    },
    basePrice: 999,
    availableColors: ['white', 'black', 'grey'],
    mockupImages: {
      white: 'https://images.unsplash.com/photo-1627225793904-a2f900a6e4cf?w=800',
      black: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800',
      grey: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'
    }
  },
  bomber_jacket: {
    id: 'bomber_jacket',
    name: 'Bomber Jacket',
    printMethod: 'dtf',
    placements: {
      front: { maxWidth: 30, maxHeight: 35, scaleRatio: 0.8,  position: 'center' },
      back:  { maxWidth: 36, maxHeight: 42, scaleRatio: 0.85, position: 'center' }
    },
    basePrice: 1899,
    availableColors: ['black', 'white', 'grey'],
    mockupImages: {
      black: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
      white: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800',
      grey:  'https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=800'
    }
  },
  sweatshirt: {
    id: 'sweatshirt',
    name: 'Sweatshirt',
    printMethod: 'dtf',
    placements: {
      front: { maxWidth: 36, maxHeight: 44, scaleRatio: 0.85, position: 'center' },
      back:  { maxWidth: 36, maxHeight: 44, scaleRatio: 0.85, position: 'center' }
    },
    basePrice: 1299,
    availableColors: ['white', 'black', 'grey'],
    mockupImages: {
      white: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800',
      black: 'https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=800',
      grey:  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'
    }
  }
};

export const DESIGN_REQUIREMENTS = {
  hardMinShortSide: 1500,
  softMinShortSide: 3000,
  preferredWidth: 4500,
  preferredHeight: 5400,
  preferredFormat: 'image/png',
  allowedFormats: ['image/png', 'image/jpeg', 'image/webp'],
  embroideryMaxColors: 4,
  embroideryHardMaxColors: 6,
};

export const GARMENT_COLORS = {
  white:  { hex: '#FFFFFF', name: 'White',         contrastWarning: 'light' },
  black:  { hex: '#1a1a1a', name: 'Black',         contrastWarning: 'dark'  },
  grey:   { hex: '#6b7280', name: 'Heather Grey',  contrastWarning: null    },
  yellow: { hex: '#FACC15', name: 'Yellow',        contrastWarning: 'light' },
};

export const DESIGN_STATES = {
  DRAFT:     'draft',
  SUBMITTED: 'submitted',
  APPROVED:  'approved',
  LIVE:      'live',
  REJECTED:  'rejected'
};

export const checkEmbroideryCompatibility = (designAnalysis) => {
  const issues = [];
  if (designAnalysis.hasGradients)   issues.push("Contains gradients or smooth transitions");
  if (designAnalysis.colorCount > 3) issues.push("Contains more than 3 distinct colors");
  if (designAnalysis.hasThinStrokes) issues.push("Contains very fine details that may not embroider well");
  return { compatible: issues.length === 0, issues };
};

export const calculateMockupDimensions = (preset, placement, designWidth, designHeight) => {
  const placementConfig = preset.placements[placement];
  if (!placementConfig || !designWidth || !designHeight) return null;
  const aspectRatio = designWidth / designHeight;
  const { maxWidth, maxHeight, scaleRatio } = placementConfig;
  let finalWidth, finalHeight;
  if (aspectRatio > maxWidth / maxHeight) {
    finalWidth  = maxWidth * scaleRatio;
    finalHeight = finalWidth / aspectRatio;
  } else {
    finalHeight = maxHeight * scaleRatio;
    finalWidth  = finalHeight * aspectRatio;
  }
  return { width: finalWidth, height: finalHeight, position: placementConfig.position };
};

export default PRINT_PRESETS;
