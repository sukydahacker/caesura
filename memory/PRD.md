# Caesura - Premium Streetwear Marketplace PRD

## Original Problem Statement
Build a modern, premium streetwear marketplace website named "Caesura" - a print-on-demand fashion platform.

## User Personas
- **Buyers**: Users who browse and purchase streetwear designs
- **Creators**: Artists who upload apparel designs to sell
- **Admin**: Platform manager who approves designs/creators and manages operations

## Core Requirements

### Phase 1 (MVP) - COMPLETE
- [x] User sign up/login using Google OAuth
- [x] Creators upload apparel designs
- [x] Mocked design preview on T-shirts and hoodies
- [x] Marketplace for browsing and purchasing designs
- [x] Admin approval workflow (products visible only after approval)
- [x] Payment integration (Razorpay for India/UPI)
- [x] Clean, minimalist design with light theme

### Phase 2 - IN PROGRESS
#### Admin Panel (Partial)
- [x] Analytics dashboard (users, designs, products, revenue)
- [x] Order monitoring
- [x] Design review (approve/reject pending designs)
- [x] **Live Products Management** - Admin can control product visibility
  - [x] View all approved products
  - [x] Change status: Live, Out of Stock, Disabled
  - [x] Disabled products hidden from storefront
- [ ] Creator account management UI (approve/suspend/reject)

#### Enhanced Creator Dashboard - COMPLETE
- [x] **Professional Upload Flow** - 3-step upload process
  - [x] Step 1: File validation (PNG, transparent bg, 4500x5400px min)
  - [x] Step 2: Redbubble-style product preview grid
  - [x] Step 3: Design details and submission
- [x] **5 Product Types** with internal print presets:
  - [x] Classic T-Shirt (DTF, 38x48cm print area)
  - [x] Premium Hoodie (DTF, 38x48cm print area)
  - [x] Oversized T-Shirt (DTF, 40x52cm print area)
  - [x] Varsity Jacket (Embroidery, 9x9cm left chest)
  - [x] Embroidered Cap (Embroidery, 6.5x5cm front)
- [x] **Smart Product Compatibility**
  - [x] Auto-disable embroidery products for gradient/multicolor designs
  - [x] Contrast warnings for light-on-light combinations
- [x] **Garment Color Selection** - Multiple colors per product type
- [x] **Design States** - Draft, Submitted, Approved, Live, Rejected
- [x] **Products View Panel** - Slide-out panel showing all product mockups
- [x] **Status-grouped Design Grid** - Organized by Live, Under Review, Drafts, Rejected

#### Backend & Integrations
- [ ] Printify API integration (currently MOCKED)
- [x] Revenue split calculation (20% platform, 80% creator)
- [ ] Email notifications (currently mocked via console logs)

## Technical Stack
- **Frontend**: React, TailwindCSS, Shadcn UI, Framer Motion
- **Backend**: FastAPI, Python
- **Database**: MongoDB
- **Auth**: Google OAuth via Emergent
- **Payments**: Razorpay

## Key DB Schema
- `users`: {user_id, email, name, role, creator_status, ...}
- `designs`: {design_id, user_id, title, image_url, approval_status, product_configs[], design_analysis{}, print_metadata{}, ...}
- `products`: {product_id, design_id, title, price, product_status, is_approved, ...}
- `orders`: {order_id, user_id, items, total_amount, status, ...}
- `revenue_splits`: {split_id, order_id, creator_id, creator_amount, platform_amount, status}

## Key API Endpoints
- `GET /api/products` - Public marketplace (live + out_of_stock only)
- `POST /api/designs` - Create design with product_configs
- `GET /api/designs` - Get creator's designs with full metadata
- `GET /api/admin/products/live` - Admin view of all approved products
- `PUT /api/admin/products/{id}/status` - Update product status

## Admin User
- Email: projectmark121224@gmail.com

## MOCKED Integrations
- **Printify**: All functions in `printify_service.py` are placeholders
- **Email Notifications**: Console logs only

---
## Changelog

### 2026-02-25
- **COMPLETE**: Enhanced Creator Dashboard with professional upload flow
  - New DesignUploadFlow.jsx component (3-step process)
  - File validation: PNG, transparent background, 4500×5400px min
  - Product preview grid with 5 product types
  - Internal print presets (DTF and embroidery)
  - Garment color selection per product
  - Smart embroidery compatibility detection
  - Design states and status-grouped display
  - Products View slide-out panel
- **UPDATED**: Creator-friendly validation (warning-based UX)
  - Hard fail only at <1500px (truly unusable)
  - Soft pass at ≥3000px with optimization warning
  - JPEG/WebP accepted with format conversion warning
  - Transparency not required - background cleanup handled by admin
  - Embroidery: warning at >4 colors, disable at >6 colors
  - Admin flags stored for quality issues (low_resolution, background_cleanup_required, etc.)
- **TESTED**: Backend 9/9 passed, Frontend 5/5 validation scenarios passed

### 2026-02-22
- **FIXED**: Live Products tab in Admin Panel was empty
- **FIXED**: Out of Stock products now show badge on marketplace
- **ADDED**: Premium landing page with 8 sections

---
## Backlog (Priority Order)

### P0 - None

### P1 - Upcoming
1. Admin Creator Management UI - build UI to approve/suspend/reject creators
2. Real Printify Integration - requires user API keys
3. Marketplace Filtering - category, popularity filters

### P2 - Future
1. Real Email Notifications (SendGrid)
2. Creator Tiers (Verified, Featured)
3. Admin Blueprint Management for Printify
4. Real product mockup generation (canvas-based overlay)

### Refactoring Needed
- Break `backend/server.py` into multiple routers (admin, products, auth)
- Split `AdminPanel.js` into child components (LiveProductsTab, OrdersTab, etc.)
