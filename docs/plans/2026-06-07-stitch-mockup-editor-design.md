# Stitch Mockup Editor — Design

**Date:** 2026-06-07
**Status:** Approved
**Owner:** Caesura

## Goal

Replace the current orange Qikink-style Step-2 editor (in the "Sell Your Art" flow)
with a pixel-faithful, interactive reproduction of the **Caesura Studio – Mockup
Editor** Stitch design, and trim the product catalog to exactly **3 t-shirts**.

Source design: `.tmp/stitch/mockup-editor.html` (Stitch project "Caesura Studio
Mockup Editor", screen "Caesura Mockup Editor").

## Scope

### In scope
1. New React component reproducing the Stitch UI exactly, made interactive.
2. Wire the existing Fabric.js canvas + color-tinting pipeline into it.
3. Trim the backend catalog to the 3 tees.
4. Publish → quick-details prompt → save via existing backend flow.

### Out of scope (for now)
- Text / Graphics / Draw / Templates rail tools (no existing logic) — rendered
  exactly as designed but **inert**, clearly flagged.
- Restyling Step 1 (Product Library) beyond the natural effect of fewer products.

## The 3 tees

Trimmed in `backend/services/qikink_service.py` so `get_product_catalog()` returns
only these (Classic Crew forced to Male-only):

| Display | Catalog key | Gender | Mockup assets |
|---|---|---|---|
| Male Classic Crew T-Shirt | `Classic Crew T-Shirt` | Male | front only (`/mockups/1757067029Classiccrewtee1.webp`) |
| Male V-Neck T-Shirt | `V Neck T-Shirt \| UV34` | Male | **full** front/back/sleeves (`/mockups/UV34/*_base.png`) |
| Unisex Oversized Standard T-Shirt | `Oversized Standard T-Shirt \| US22` | Unisex | front only (`/mockups/US22/*.png` per-color) |

**Consequence:** the Product Library will show only the **T-Shirts** collection
(3 items); all other collections/products disappear because the catalog is just
these 3. (Approved.)

## Architecture

- **New component:** `frontend/src/components/StitchMockupEditor.jsx`
  - Reproduces the Stitch markup using Tailwind (arbitrary hex values where needed
    to guarantee an exact match — does not depend on theme tokens).
  - Layout: TopAppBar · left dark rail · COLORS panel · canvas main · bottom strip.
  - Embeds the Fabric.js canvas (reuses the existing tint/print-area/upload logic
    currently inline in `SellYourArt.js` Step 2).
- **`SellYourArt.js`:** Step 2 renders `<StitchMockupEditor … />` for the tees
  instead of the current orange editor + `QikinkRightPane`.
- **Per-product view config:** generalize the hardcoded `UV34_VIEWS` into a
  `PRODUCT_VIEWS` map keyed by SKU, each with `{ front, back, sleeves }` →
  `{ baseImage, printArea }`. Missing views render a labeled placeholder.

## Interactivity map

| Stitch element | Behavior |
|---|---|
| Left rail — **Uploads** | active → file picker → place design in print area |
| Left rail — Select/Text/Graphics/Draw/Templates | exact visuals, inert |
| Left rail — **Guide / Reset** | Guide toggles print-area overlay; Reset clears design |
| **COLORS** panel | each tee's real Qikink colors; hex on hover; click → live tint |
| **FRONT / BACK / SLEEVES** | switch mockup + print area per view |
| Canvas + dashed print area | Fabric: drag / resize / nudge / center; corner brackets + crosshair |
| Top-bar breadcrumb | `{SKU} · {VIEW} · {COLOR} · {zoom}%` (live) |
| Bottom strip | live X / Y / Scale / Print-Safe readout |
| **Publish** | quick-details prompt (title + price + sizes) → existing save flow |

## Data flow

1. Step 1 (Product Library) → user picks a tee → `selectedCategory` set, Step 2.
2. `StitchMockupEditor` reads `selectedCategory` (colors, sizes, SKU) + design state.
3. Color/view/upload mutate Fabric canvas via the existing refs
   (`fabricRef`, `designObjRef`, `canvasElRef`).
4. Publish → collect title/price/sizes → `handleSubmit` (unchanged backend contract).

## Error / edge handling

- Missing Back/Sleeve asset → placeholder tile + disabled pill state (until user
  supplies images to `public/mockups/<SKU>/`).
- Color with no exact mockup → tint the white/base mockup via multiply blend.
- Publish without a design or required field → inline validation in the prompt.

## Testing / verification

- `npm run build` passes (0 errors).
- Manual (user-verified in Safari, per preference): all 3 tees load the editor;
  colors tint; views switch; upload + drag works; Publish saves and the product
  appears pending.

## Open follow-ups

- Real Back/Sleeve mockups for Classic Crew & US22 (user to provide).
- Wiring Text/Graphics/Draw/Templates tools (future).
