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

#### Backend & Integrations
- [ ] Printify API integration (currently MOCKED)
- [x] Revenue split calculation (20% platform, 80% creator)
- [ ] Email notifications (currently mocked via console logs)

## Technical Stack
- **Frontend**: React, TailwindCSS, Shadcn UI
- **Backend**: FastAPI, Python
- **Database**: MongoDB
- **Auth**: Google OAuth via Emergent
- **Payments**: Razorpay

## Key DB Schema
- `users`: {user_id, email, name, role, creator_status, ...}
- `designs`: {design_id, user_id, title, image_url, approval_status, ...}
- `products`: {product_id, design_id, title, price, product_status('live'|'out_of_stock'|'disabled'), is_approved, ...}
- `orders`: {order_id, user_id, items, total_amount, status, ...}
- `revenue_splits`: {split_id, order_id, creator_id, creator_amount, platform_amount, status}

## Key API Endpoints
- `GET /api/products` - Public marketplace (live + out_of_stock only)
- `GET /api/admin/products/live` - Admin view of all approved products
- `PUT /api/admin/products/{id}/status` - Update product status
- `GET /api/admin/orders` - All orders with revenue splits
- `GET /api/admin/analytics` - Platform analytics

## Admin User
- Email: projectmark121224@gmail.com

## MOCKED Integrations
- **Printify**: All functions in `printify_service.py` are placeholders
- **Email Notifications**: Console logs only

---
## Changelog

### 2026-02-22
- **FIXED**: Live Products tab in Admin Panel was empty
  - Root cause: Missing `<TabsContent value="products">` UI block in AdminPanel.js
  - Added complete UI with product cards, status badges, and control buttons
  - All 4 approved products now visible in admin panel
- **TESTED**: Backend 11/11 tests passed, Frontend 100% pass rate
- **MINOR FIX**: Corrected toast message typo ("out of stockd" → "out of stock")

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

### Refactoring Needed
- Break `backend/server.py` into multiple routers (admin, products, auth)
- Split `AdminPanel.js` into child components (LiveProductsTab, OrdersTab, etc.)
