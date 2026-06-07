# Stitch Mockup Editor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Before writing any frontend code, invoke the `frontend-design` skill (project rule). Serve via the running dev server on **port 3001** and verify visually in **Safari** (user preference). Design ref: `.tmp/stitch/mockup-editor.html`.

**Goal:** Replace the Step-2 "Sell Your Art" editor with a pixel-faithful, interactive reproduction of the Stitch "Caesura Mockup Editor", and trim the catalog to 3 tees.

**Architecture:** A new `StitchMockupEditor.jsx` reproduces the Stitch Tailwind markup exactly and embeds the existing Fabric.js canvas/tint/print-area pipeline. `SellYourArt.js` Step 2 renders it. A `PRODUCT_VIEWS` map generalizes the hardcoded `UV34_VIEWS`. Backend `qikink_service.py` filters the catalog to 3 tees.

**Tech Stack:** React 18 (CRA/CRACO), Tailwind CSS, Fabric.js, FastAPI + asyncpg backend, Qikink catalog JSON.

**Reference design doc:** `docs/plans/2026-06-07-stitch-mockup-editor-design.md`

---

## Task 1: Trim backend catalog to 3 tees

**Files:**
- Modify: `backend/services/qikink_service.py` — `get_product_catalog()` (~line 157)
- Test: `backend/tests/test_catalog_trim.py` (create)

**Step 1: Write the failing test**

```python
# backend/tests/test_catalog_trim.py
from backend.services.qikink_service import qikink_service

ALLOWED = {
    "Classic Crew T-Shirt",
    "V Neck T-Shirt | UV34",
    "Oversized Standard T-Shirt | US22",
}

def test_catalog_only_three_tees():
    cats = {p["category"] for p in qikink_service.get_product_catalog()}
    assert cats == ALLOWED

def test_classic_crew_is_male_only():
    cat = next(p for p in qikink_service.get_product_catalog()
               if p["category"] == "Classic Crew T-Shirt")
    assert cat["genders"] == ["Male"]
```

**Step 2: Run test, verify it fails**

Run: `cd backend && python -m pytest tests/test_catalog_trim.py -v`
Expected: FAIL (returns all ~30 products).

**Step 3: Implement the filter**

In `get_product_catalog()`, after building the list, filter and force Classic Crew to Male:

```python
def get_product_catalog(self) -> List[Dict[str, Any]]:
    allowed = {
        "Classic Crew T-Shirt",
        "V Neck T-Shirt | UV34",
        "Oversized Standard T-Shirt | US22",
    }
    catalog = []
    for category, meta in self.PRODUCT_META.items():
        if category not in allowed:
            continue
        colors = list(self.SKU_MAP.get(category, {}).keys())
        sizes = set()
        for color_sizes in self.SKU_MAP.get(category, {}).values():
            sizes.update(color_sizes.keys())
        genders = meta.get("genders", [])
        if category == "Classic Crew T-Shirt":
            genders = ["Male"]
        catalog.append({
            "category": category,
            "genders": genders,
            "colors": colors,
            "sizes": sorted(sizes),
            "base_prices": meta.get("base_prices", []),
            "tax_rate": meta.get("tax_rate", 5),
        })
    return catalog
```

**Step 4: Run test, verify pass**

Run: `cd backend && python -m pytest tests/test_catalog_trim.py -v` → PASS
Also: `curl -s http://localhost:8000/api/catalog/products | python3 -c "import sys,json;print(len(json.load(sys.stdin)))"` → `3` (restart backend if needed).

**Step 5: Commit**

```bash
git add backend/services/qikink_service.py backend/tests/test_catalog_trim.py
git commit -m "feat(catalog): trim product catalog to 3 tees"
```

---

## Task 2: Verify Product Library shows 3 tees (manual gate)

**Step 1:** Restart backend so the catalog change takes effect.
**Step 2:** In Safari, hard-reload `http://localhost:3001/sell`. Expect the **T-Shirts** collection tile only, count **3**; clicking it shows Classic Crew (Male), V-Neck (Male), Oversized Standard (Unisex). No other collections.
**Step 3:** No commit (verification only).

---

## Task 3: Generalize view config into `PRODUCT_VIEWS`

**Files:**
- Modify: `frontend/src/pages/SellYourArt.js` (replace `UV34_VIEWS`, ~line 259)

**Step 1:** Add a SKU-keyed map. Front print areas for US22/Classic Crew start as copies of UV34 front and are tuned later.

```js
// Per-product view config. Missing assets render a placeholder in the editor.
const PRODUCT_VIEWS = {
  'UV34': {
    front:   { template: '/mockups/UV34/front_base.png', printArea: { x: 161, y: 206, w: 297, h: 350 }, tintable: true },
    back:    { template: '/mockups/UV34/back_base.png',  printArea: { x: 161, y: 143, w: 297, h: 398 }, tintable: true },
    sleeves: { template: '/mockups/UV34/left_sleeve_base.png', printArea: { x: 241, y: 238, w: 136, h: 159 }, tintable: false },
  },
  'US22': {
    front:   { template: '/mockups/US22/white.png', printArea: { x: 161, y: 206, w: 297, h: 350 }, tintable: true },
    back:    null,    // user to supply
    sleeves: null,
  },
  'CLASSIC_CREW': {
    front:   { template: '/mockups/1757067029Classiccrewtee1.webp', printArea: { x: 161, y: 206, w: 297, h: 350 }, tintable: false },
    back:    null,
    sleeves: null,
  },
};

// Map a catalog category string to a PRODUCT_VIEWS key.
function viewsKeyFor(category) {
  const c = (category || '').toUpperCase();
  if (c.includes('UV34')) return 'UV34';
  if (c.includes('US22')) return 'US22';
  if (c.includes('CLASSIC CREW')) return 'CLASSIC_CREW';
  return 'UV34';
}
```

Keep `UV34_VIEWS` as `PRODUCT_VIEWS.UV34` alias if other code still references it, or update references.

**Step 2:** Build check: `npm run build` (or rely on dev-server compile) → 0 errors.

**Step 3: Commit**

```bash
git add frontend/src/pages/SellYourArt.js
git commit -m "refactor(editor): generalize UV34_VIEWS into per-product PRODUCT_VIEWS"
```

---

## Task 4: Scaffold `StitchMockupEditor.jsx` (static, exact markup)

> Invoke `frontend-design` skill first.

**Files:**
- Create: `frontend/src/components/StitchMockupEditor.jsx`

**Step 1:** Reproduce `.tmp/stitch/mockup-editor.html` as a React component using the **same Tailwind classes** (use arbitrary `[#hex]` values to avoid theme-token dependency). Structure:
- `<header>` TopAppBar: back button, breadcrumb span, FRONT/BACK/SLEEVES pills, lock icon, Publish pill.
- `<aside>` left dark rail: Select/Text/Graphics/Uploads/Draw/Templates + Guide/Reset (Material Symbols icons via the same Google Fonts link — add the two font `<link>`s to `public/index.html` `<head>` if not present).
- `<section>` COLORS panel (240px).
- `<main>` canvas area with mockup container, dashed print-area, corner brackets, crosshair, floating PRINT AREA label.
- `<footer>` bottom status strip.

Props (all passed from `SellYourArt`):
```js
export default function StitchMockupEditor({
  product,              // selectedCategory (category, colors, sizes, base_prices)
  selectedColor, onColorChange,
  activeView, onViewChange,                 // 'front' | 'back' | 'sleeves'
  canvasElRef,                              // Fabric canvas <canvas> ref
  onUploadClick,                            // opens file picker
  onReset,
  designStats,                              // { x, y, scalePct, printSafe }
  zoomPct,
  onPublish,
  submitting,
}) { /* ... */ }
```

**Step 2:** Render it on a throwaway route or temporarily in Step 2 with hardcoded props to eyeball it. Verify in Safari it matches the Stitch screenshot (`.tmp/stitch/mockup-editor.png`): dark rail, light colors panel, canvas frame, bottom strip, fonts (Syne/Inter/JetBrains Mono).

**Step 3: Commit**

```bash
git add frontend/src/components/StitchMockupEditor.jsx frontend/public/index.html
git commit -m "feat(editor): static StitchMockupEditor matching the Stitch design"
```

---

## Task 5: Embed the Fabric canvas + wire colors and views

**Files:**
- Modify: `frontend/src/components/StitchMockupEditor.jsx`
- Modify: `frontend/src/pages/SellYourArt.js` (Step 2 render + canvas effect generalization)

**Step 1:** Place `<canvas ref={canvasElRef} />` inside the Stitch mockup container (replacing the static bg-image div). The existing canvas `useEffect` in `SellYourArt.js` (the one that builds Fabric, tints by `selectedColor`, draws print area) must read `PRODUCT_VIEWS[viewsKeyFor(selectedCategory.category)][activeView]` instead of `UV34_VIEWS[activeView]`. Handle `null` view → render placeholder (skip Fabric template; show "No mockup yet" tile).

**Step 2:** COLORS panel maps `product.colors` (real Qikink colors) → swatch using `COLOR_HEX[c]`; click → `onColorChange(c)`; show hex on hover. Active color = bordered.

**Step 3:** FRONT/BACK/SLEEVES pills → `onViewChange`; disable a pill whose view config is `null` (Back/Sleeves for US22 & Classic Crew) with a subtle disabled style + tooltip "Add mockup".

**Step 4:** Manual verify in Safari: pick each tee; click colors → shirt tints; switch views → mockup changes (UV34) or shows disabled/placeholder (others).

**Step 5: Commit**

```bash
git add frontend/src/components/StitchMockupEditor.jsx frontend/src/pages/SellYourArt.js
git commit -m "feat(editor): wire Fabric canvas, real colors, and view switching"
```

---

## Task 6: Wire Uploads, design manipulation, breadcrumb + status strip

**Files:**
- Modify: `frontend/src/components/StitchMockupEditor.jsx`
- Modify: `frontend/src/pages/SellYourArt.js`

**Step 1:** Left-rail **Uploads** → `onUploadClick` → existing `fileInputRef.current.click()`; existing `handleFile` places the image in the print area via Fabric (reuse current logic). **Reset** → `onReset` clears the design. **Guide** → toggle print-area overlay visibility.

**Step 2:** Breadcrumb text = `${viewsKeyFor(category)} · ${activeView.toUpperCase()} · ${selectedColor.toUpperCase()} · ${zoomPct}%`. Bottom strip = live `X`, `Y`, `Scale%`, `Print Safe: ON/OFF` from Fabric object coords (subscribe to `object:moving`/`object:scaling` → `setDesignStats`).

**Step 3:** Manual verify: upload a PNG → appears in print area, draggable/resizable; breadcrumb + bottom strip update live.

**Step 4: Commit**

```bash
git add frontend/src/components/StitchMockupEditor.jsx frontend/src/pages/SellYourArt.js
git commit -m "feat(editor): wire uploads, drag/resize, live breadcrumb and status strip"
```

---

## Task 7: Wire Publish → quick-details modal → save

**Files:**
- Modify: `frontend/src/components/StitchMockupEditor.jsx` (add a small modal)
- Modify: `frontend/src/pages/SellYourArt.js` (pass `onPublish`)

**Step 1:** Publish opens a compact modal (styled to match: dark, Syne headings) with: **Title** (text), **Price** (number, ₹), **Sizes** (multi-select chips from `product.sizes`). Validate all present + a design exists.

**Step 2:** On confirm → set `title`/`price`/`selectedSizes` state → call existing `handleSubmit` (unchanged backend contract). Reuse existing success screen.

**Step 3:** Manual verify: Publish → fill modal → Save → success screen; product appears in admin pending.

**Step 4: Commit**

```bash
git add frontend/src/components/StitchMockupEditor.jsx frontend/src/pages/SellYourArt.js
git commit -m "feat(editor): publish opens quick-details modal and saves product"
```

---

## Task 8: Replace Step 2 with StitchMockupEditor

**Files:**
- Modify: `frontend/src/pages/SellYourArt.js` (Step-2 block, ~line 998-1175)

**Step 1:** Replace the orange Qikink Step-2 JSX (`QikinkRightPane` + orange canvas chrome) with `<StitchMockupEditor … />`, passing the wired props. Remove now-unused Step-2-only markup (keep `handleSubmit`, `handleFile`, canvas refs/effects, modals still needed). Leave `QikinkRightPane` import only if used elsewhere; otherwise remove.

**Step 2:** `npm run build` → 0 errors. Manual verify full flow for all 3 tees in Safari.

**Step 3: Commit**

```bash
git add frontend/src/pages/SellYourArt.js
git commit -m "feat(editor): use StitchMockupEditor for Step 2 of Sell Your Art"
```

---

## Task 9: Final verification + cleanup

**Step 1:** `cd backend && python -m pytest tests/test_catalog_trim.py -v` → PASS.
**Step 2:** `cd frontend && npm run build` → compiles, 0 errors.
**Step 3:** Safari manual pass (verification-before-completion skill): catalog = 3 tees; editor matches Stitch design; colors tint; views switch (UV34 full, others front + disabled); upload/drag/resize; Publish saves.
**Step 4:** Note follow-ups in design doc (Back/Sleeve assets for Classic Crew & US22).
**Step 5: Commit** any cleanup; the branch is ready for PR.

---

## Notes / Skills
- @frontend-design before any frontend code.
- @verification-before-completion before claiming done.
- Dev server: port **3001**; verify in **Safari**.
- Do NOT depend on Tailwind theme tokens from the Stitch config — use arbitrary `[#hex]` values for an exact match.
