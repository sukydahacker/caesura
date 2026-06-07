# Caesura Project Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove all dead code, duplicate files, and stub pages from the Caesura codebase, leaving only production-relevant pages and a rationalized file structure.

**Architecture:** Delete-first approach — remove stubs/duplicates, promote v2 files to canonical, rebuild CreatorShop as a real component, strip backend's dead Printify integration.

**Tech Stack:** React (CRA + craco), shadcn/ui, FastAPI, asyncpg (Supabase Postgres)

---

### Task 1: Delete stub pages

**Files:**
- Delete: `frontend/src/pages/About.js`
- Delete: `frontend/src/pages/FAQ.js`
- Delete: `frontend/src/pages/Drops.js`
- Delete: `frontend/src/pages/SizeGuide.js`
- Delete: `frontend/src/pages/Profile.js`
- Delete: `frontend/src/pages/Admin.js` (legacy duplicate of AdminPanel.js)
- Delete: `frontend/src/pages/v2/Landing.js`
- Delete: `frontend/src/pages/v2/Landing1.js`
- Delete: `frontend/src/pages/v2/` (folder, now empty)

**Step 1: Delete the files**

```bash
rm "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src/pages/About.js"
rm "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src/pages/FAQ.js"
rm "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src/pages/Drops.js"
rm "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src/pages/SizeGuide.js"
rm "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src/pages/Profile.js"
rm "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src/pages/Admin.js"
rm "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src/pages/v2/Landing.js"
rm "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src/pages/v2/Landing1.js"
rmdir "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src/pages/v2"
```

**Step 2: Verify**

```bash
ls "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src/pages/"
```

Expected: Only these remain: `AuthCallback.js AuthChoice.js Cart.js Checkout.js CreatorShop.js Dashboard.js DevLogin.js Landing.js Marketplace.js Orders.js ProductDetail.js SellYourArt.js AdminPanel.js`

---

### Task 2: Delete duplicate components/v2/ folder

**Files:**
- Delete: `frontend/src/components/v2/DesignUploadFlow.jsx`
- Delete: `frontend/src/components/v2/MockupEditor.jsx`
- Delete: `frontend/src/components/v2/` (folder)

**Step 1: Delete**

```bash
rm -rf "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src/components/v2"
```

**Step 2: Verify nothing imports from v2**

```bash
grep -r "components/v2" "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src"
```

Expected: No output.

---

### Task 3: Delete duplicate config/v2/ folder

**Files:**
- Delete: `frontend/src/config/v2/printPresets.js`
- Delete: `frontend/src/config/v2/` (folder)

**Step 1: Delete**

```bash
rm -rf "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src/config/v2"
```

**Step 2: Verify**

```bash
grep -r "config/v2" "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src"
```

Expected: No output.

---

### Task 4: Delete unused shadcn/ui components

Keep only: `button.jsx dialog.jsx input.jsx label.jsx switch.jsx textarea.jsx sonner.jsx`

**Step 1: Delete the 38 unused components**

```bash
cd "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src/components/ui"
rm accordion.jsx alert-dialog.jsx alert.jsx aspect-ratio.jsx avatar.jsx badge.jsx \
   breadcrumb.jsx calendar.jsx card.jsx carousel.jsx checkbox.jsx collapsible.jsx \
   command.jsx context-menu.jsx drawer.jsx dropdown-menu.jsx form.jsx hover-card.jsx \
   input-otp.jsx menubar.jsx navigation-menu.jsx pagination.jsx popover.jsx progress.jsx \
   radio-group.jsx resizable.jsx scroll-area.jsx select.jsx separator.jsx sheet.jsx \
   skeleton.jsx slider.jsx table.jsx tabs.jsx toast.jsx toaster.jsx toggle-group.jsx \
   toggle.jsx tooltip.jsx
```

**Step 2: Verify only 7 remain**

```bash
ls "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src/components/ui/"
```

Expected: `button.jsx dialog.jsx input.jsx label.jsx sonner.jsx switch.jsx textarea.jsx`

---

### Task 5: Delete v2-index.css

**Step 1: Delete**

```bash
rm "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src/v2-index.css"
```

**Step 2: Verify nothing imports it**

```bash
grep -r "v2-index" "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src"
```

Expected: No output.

---

### Task 6: Promote v2-api.js to canonical api.js

The v2 API is the newer one — it has correct endpoint signatures, Printrove integration, and removes the stale `getDesignLibrary`. Replace the old `api.js` with it.

**Files:**
- Modify: `frontend/src/lib/api.js` (replace content with v2-api.js)
- Delete: `frontend/src/lib/v2-api.js`

**Step 1: The new api.js content is already the content of v2-api.js — it's identical. Delete v2-api.js.**

```bash
rm "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src/lib/v2-api.js"
```

**Step 2: Verify nothing imports from v2-api**

```bash
grep -r "v2-api" "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src"
```

Expected: No output.

---

### Task 7: Update printPresets.js with v2 values

The v2 presets have correct larger print dimensions (38cm instead of 30cm for tshirts). Replace the original with v2 content.

**Files:**
- Modify: `frontend/src/config/printPresets.js`

**Step 1: Replace the entire file with the v2 content**

The content to write is exactly what was in `config/v2/printPresets.js`. The key changes are larger `maxWidth` values and updated `DESIGN_REQUIREMENTS`. Write the full file content from `config/v2/printPresets.js` into `config/printPresets.js`.

```bash
# Verify the old file to confirm what's being replaced
head -20 "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src/config/printPresets.js"
```

Then use the Edit tool to replace the contents with the v2 version content.

**Step 2: Verify import paths still work**

```bash
grep -r "config/printPresets\|printPresets" "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src" | grep import
```

Expected: All imports point to `@/config/printPresets` (no v2 paths).

---

### Task 8: Update App.js — remove dead routes

Remove imports and routes for: `About, FAQ, Drops, SizeGuide, Profile`. Keep everything else.

**Files:**
- Modify: `frontend/src/App.js`

**Step 1: Replace App.js with cleaned version**

```js
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Landing from "@/pages/Landing";
import AuthCallback from "@/pages/AuthCallback";
import Dashboard from "@/pages/Dashboard";
import Marketplace from "@/pages/Marketplace";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import AdminPanel from "@/pages/AdminPanel";
import ProtectedRoute from "@/components/ProtectedRoute";
import "@/App.css";
import { lazy, Suspense } from "react";

const AuthChoice  = lazy(() => import("@/pages/AuthChoice"));
const DevLogin    = lazy(() => import("@/pages/DevLogin"));
const SellYourArt = lazy(() => import("@/pages/SellYourArt"));
const CreatorShop = lazy(() => import("@/pages/CreatorShop"));

const PageLoader = () => (
  <div style={{ minHeight: '100vh', background: '#0A0A0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: '24px', color: 'rgba(250,250,249,0.3)' }}>
      Caesura.
    </div>
  </div>
);

function AppRouter() {
  const location = useLocation();

  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"                    element={<Landing />} />
          <Route path="/marketplace"         element={<Marketplace />} />
          <Route path="/explore"             element={<Marketplace />} />
          <Route path="/explore/:filter"     element={<Marketplace />} />
          <Route path="/t/:productId"        element={<ProductDetail />} />
          <Route path="/product/:productId"  element={<ProductDetail />} />
          <Route path="/sell"                element={<SellYourArt />} />
          <Route path="/artist/:userId"      element={<CreatorShop />} />
          <Route path="/join"                element={<AuthChoice />} />
          <Route path="/dev-login"           element={<DevLogin />} />
          <Route path="/dashboard"           element={<Dashboard />} />
          <Route path="/cart"                element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout"            element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders"              element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/admin"               element={<AdminPanel />} />
        </Routes>
      </Suspense>
      <Toaster theme="dark" />
    </>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </div>
  );
}

export default App;
```

**Step 2: Verify the app compiles**

```bash
cd "/Users/sukrit/Desktop/Vs Code/caesura/frontend" && npx react-scripts build --profile 2>&1 | tail -20
```

Expected: Build succeeds (or only pre-existing errors).

---

### Task 9: Build real CreatorShop.js

Currently a stub. Replace with a proper page: creator header (avatar, name, bio), their live products grid, and a back link. Uses the same dark design tokens as Dashboard.js.

**Files:**
- Modify: `frontend/src/pages/CreatorShop.js`

**Step 1: Write the component**

```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package } from 'lucide-react';
import { getProducts } from '@/lib/api';

const BG  = '#0A0A0B';
const BG2 = '#141416';
const BG3 = '#1C1C1F';
const AS  = '#C8FF00';
const TP  = '#FAFAF9';
const TS  = '#9A9A9D';
const TT  = '#5A5A5E';
const BS  = 'rgba(255,255,255,0.07)';
const ease = [0.22, 1, 0.36, 1];

const display = { fontFamily: '"Clash Display", sans-serif' };
const body    = { fontFamily: '"Cabinet Grotesk", sans-serif' };
const script  = { fontFamily: '"Caveat", cursive' };

export default function CreatorShop() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreatorProducts();
  }, [userId]);

  const fetchCreatorProducts = async () => {
    try {
      const r = await getProducts(0, 100);
      const allProducts = r.data?.products || r.data || [];
      // Filter to this creator's products
      const creatorProducts = allProducts.filter(p => p.creator_id === userId || p.user_id === userId);
      setProducts(creatorProducts);
      // Derive creator info from first product
      if (creatorProducts.length > 0) {
        const p = creatorProducts[0];
        setCreator({ name: p.creator_name || p.creator?.name || 'Creator', picture: p.creator_picture || p.creator?.picture });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...script, fontSize: '24px', color: TT }}>loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: BG }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px 80px' }}>

        {/* Back nav */}
        <div style={{ padding: '32px 0 0' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ ...body, fontSize: '13px', color: TS, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        {/* Creator header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          style={{ padding: '48px 0 40px', borderBottom: `1px solid ${BS}`, marginBottom: '48px', display: 'flex', alignItems: 'center', gap: '24px' }}
        >
          {creator?.picture ? (
            <img src={creator.picture} alt={creator.name} style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${BS}` }} />
          ) : (
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: BG3, border: `2px solid ${BS}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ ...display, fontSize: '28px', color: AS, fontWeight: 700 }}>
                {(creator?.name || 'C')[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 style={{ ...display, fontWeight: 700, fontSize: 'clamp(28px, 4vw, 48px)', color: TP, margin: '0 0 6px', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
              {creator?.name || 'Creator'}
            </h1>
            <span style={{ ...body, fontSize: '13px', color: TT }}>
              {products.length} product{products.length !== 1 ? 's' : ''}
            </span>
          </div>
        </motion.div>

        {/* Products grid */}
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Package size={40} style={{ color: TT, marginBottom: '16px' }} />
            <p style={{ ...body, fontSize: '15px', color: TS }}>No products yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
            {products.map((product, i) => (
              <motion.div
                key={product.product_id || i}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.04, ease }}
                onClick={() => navigate(`/t/${product.product_id}`)}
                style={{ cursor: 'pointer', background: BG2, border: `1px solid ${BS}`, overflow: 'hidden', transition: 'border-color 0.2s, transform 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BS; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ aspectRatio: '1', background: BG3, overflow: 'hidden' }}>
                  <img
                    src={product.mockup_url || product.image_url}
                    alt={product.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ padding: '16px' }}>
                  <h3 style={{ ...display, fontWeight: 600, fontSize: '15px', color: TP, margin: '0 0 4px', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {product.title}
                  </h3>
                  <p style={{ ...display, fontWeight: 700, fontSize: '16px', color: AS, margin: 0 }}>
                    ₹{product.base_price || product.price}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Task 10: Remove Printify from backend

**Files:**
- Delete: `backend/services/printify_service.py`
- Modify: `backend/server.py` — remove import (line 27), and the entire `/admin/printify/blueprints` route (lines 1167–1172)

**Step 1: Delete printify_service.py**

```bash
rm "/Users/sukrit/Desktop/Vs Code/caesura/backend/services/printify_service.py"
```

**Step 2: Remove from server.py**

In `backend/server.py`:
- Remove line 27: `from services.printify_service import printify_service`
- Remove lines 1167–1172 (the entire `get_printify_blueprints` route):

```python
# DELETE THIS ENTIRE BLOCK:
@api_router.get("/admin/printify/blueprints")
async def get_printify_blueprints(request: Request, session_token: Optional[str] = Cookie(None)):
    ...
    blueprints = await printify_service.get_blueprints()
    return {"blueprints": blueprints, "mock_mode": printify_service.mock_mode}
```

**Step 3: Verify no remaining printify references**

```bash
grep -n "printify" "/Users/sukrit/Desktop/Vs Code/caesura/backend/server.py"
```

Expected: Only `printify_product_id` and `printify_blueprint_id` field names on the Pydantic models (lines 119, 120, 148) — these are DB column names, keep them.

---

### Task 11: Remove getPrintifyBlueprints from api.js

**Files:**
- Modify: `frontend/src/lib/api.js`

**Step 1: Delete this line from api.js**

```js
// DELETE:
export const getPrintifyBlueprints = () => api.get('/admin/printify/blueprints');
```

**Step 2: Verify no component calls it**

```bash
grep -r "getPrintifyBlueprints\|printify/blueprints" "/Users/sukrit/Desktop/Vs Code/caesura/frontend/src"
```

Expected: No output (if AdminPanel.js was calling it, it will need a small fix — check AdminPanel.js first).

---

### Task 12: Final verification

**Step 1: Start the frontend and confirm it compiles**

```bash
cd "/Users/sukrit/Desktop/Vs Code/caesura/frontend" && PORT=3001 BROWSER=none npm start 2>&1 | grep -E "Compiled|error|Error" | head -10
```

Expected: `Compiled successfully`

**Step 2: Spot-check routes in browser**

Open these in Safari and confirm they load without white screens:
- http://localhost:3001/ (Landing)
- http://localhost:3001/marketplace (Marketplace)
- http://localhost:3001/dashboard (Dashboard)
- http://localhost:3001/sell (SellYourArt)
- http://localhost:3001/join (AuthChoice)

**Step 3: Commit**

```bash
cd "/Users/sukrit/Desktop/Vs Code/caesura"
git add -A
git commit -m "chore: remove dead code, stubs, v2 duplicates, and unused shadcn components"
```
