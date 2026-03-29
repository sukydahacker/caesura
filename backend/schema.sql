-- ============================================================
-- Caesura PostgreSQL Schema (Supabase)
-- Migration from MongoDB
-- ============================================================

BEGIN;

-- 1. users
CREATE TABLE IF NOT EXISTS users (
    user_id              TEXT PRIMARY KEY,
    email                TEXT UNIQUE NOT NULL,
    name                 TEXT,
    picture              TEXT,
    role                 TEXT DEFAULT 'buyer' CHECK (role IN ('buyer', 'creator', 'admin')),
    creator_status       TEXT CHECK (creator_status IN ('pending', 'approved', 'suspended', 'rejected')),
    creator_bio          TEXT,
    rejection_reason     TEXT,
    approved_at          TIMESTAMPTZ,
    suspended_at         TIMESTAMPTZ,
    rejected_at          TIMESTAMPTZ,
    created_at           TIMESTAMPTZ DEFAULT now(),
    updated_at           TIMESTAMPTZ
);

-- 2. user_sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id                   SERIAL PRIMARY KEY,
    session_token        TEXT UNIQUE NOT NULL,
    user_id              TEXT NOT NULL REFERENCES users(user_id),
    expires_at           TIMESTAMPTZ NOT NULL,
    created_at           TIMESTAMPTZ DEFAULT now()
);

-- 3. designs
CREATE TABLE IF NOT EXISTS designs (
    design_id            TEXT PRIMARY KEY,
    user_id              TEXT NOT NULL REFERENCES users(user_id),
    title                TEXT NOT NULL,
    description          TEXT,
    image_url            TEXT NOT NULL,
    mockup_image_url     TEXT,
    product_type         TEXT DEFAULT 'UT27',
    placement_coordinates JSONB,
    price                NUMERIC(10, 2),
    tags                 TEXT[] DEFAULT '{}',
    approval_status      TEXT DEFAULT 'draft' CHECK (approval_status IN ('draft', 'pending', 'pending_approval', 'approved', 'live', 'rejected')),
    rejection_reason     TEXT,
    approved_by_admin_id TEXT,
    approved_at          TIMESTAMPTZ,
    rejected_at          TIMESTAMPTZ,
    featured             BOOLEAN DEFAULT false,
    product_configs      JSONB DEFAULT '[]',
    design_analysis      JSONB,
    print_metadata       JSONB,
    size_prices           JSONB,
    selected_colors       TEXT[] DEFAULT '{}',
    print_type            TEXT DEFAULT 'dtf',
    description_html      TEXT,
    created_at           TIMESTAMPTZ DEFAULT now(),
    updated_at           TIMESTAMPTZ DEFAULT now()
);

-- 4. products
CREATE TABLE IF NOT EXISTS products (
    product_id                TEXT PRIMARY KEY,
    design_id                 TEXT REFERENCES designs(design_id),
    user_id                   TEXT NOT NULL REFERENCES users(user_id),
    title                     TEXT NOT NULL,
    description               TEXT,
    apparel_type              TEXT DEFAULT 'tshirt',
    sizes                     TEXT[] DEFAULT '{S,M,L,XL,XXL}',
    price                     NUMERIC(10, 2) NOT NULL,
    design_image              TEXT,
    mockup_image              TEXT,
    overlay_image             TEXT,
    placement_coordinates     JSONB,
    qikink_design_code        TEXT,
    printify_product_id       TEXT,
    printify_blueprint_id     INT,
    base_cost                 NUMERIC(10, 2) DEFAULT 500.0,
    creator_commission_rate   NUMERIC(3, 2) DEFAULT 0.80,
    platform_commission_rate  NUMERIC(3, 2) DEFAULT 0.20,
    product_status            TEXT DEFAULT 'live' CHECK (product_status IN ('live', 'out_of_stock', 'disabled')),
    status_updated_at         TIMESTAMPTZ,
    status_updated_by         TEXT,
    units_sold                INT DEFAULT 0,
    is_active                 BOOLEAN DEFAULT true,
    is_approved               BOOLEAN DEFAULT false,
    approved_at               TIMESTAMPTZ,
    fulfillment_provider      TEXT,
    created_at                TIMESTAMPTZ DEFAULT now()
);

-- 5. cart_items
CREATE TABLE IF NOT EXISTS cart_items (
    cart_item_id         TEXT PRIMARY KEY,
    user_id              TEXT NOT NULL REFERENCES users(user_id),
    product_id           TEXT NOT NULL REFERENCES products(product_id),
    size                 TEXT NOT NULL,
    quantity             INT DEFAULT 1,
    added_at             TIMESTAMPTZ DEFAULT now()
);

-- 6. orders
CREATE TABLE IF NOT EXISTS orders (
    order_id             TEXT PRIMARY KEY,
    user_id              TEXT NOT NULL REFERENCES users(user_id),
    items                JSONB NOT NULL DEFAULT '[]',
    total_amount         NUMERIC(10, 2) NOT NULL,
    razorpay_order_id    TEXT,
    razorpay_payment_id  TEXT,
    printify_order_id    TEXT,
    qikink_order_id      INT,
    fulfillment_status   TEXT DEFAULT 'pending',
    fulfillment_provider TEXT,
    tracking_number      TEXT,
    tracking_url         TEXT,
    status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
    shipping_address     JSONB NOT NULL,
    created_at           TIMESTAMPTZ DEFAULT now(),
    updated_at           TIMESTAMPTZ DEFAULT now()
);

-- 7. revenue_splits
CREATE TABLE IF NOT EXISTS revenue_splits (
    split_id             TEXT PRIMARY KEY,
    order_id             TEXT NOT NULL REFERENCES orders(order_id),
    creator_id           TEXT NOT NULL REFERENCES users(user_id),
    creator_amount       NUMERIC(10, 2) NOT NULL,
    platform_amount      NUMERIC(10, 2) NOT NULL,
    status               TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    completed_at         TIMESTAMPTZ,
    created_at           TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id       ON user_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_designs_user_id             ON designs(user_id);
CREATE INDEX IF NOT EXISTS idx_designs_approval_status     ON designs(approval_status);

CREATE INDEX IF NOT EXISTS idx_products_user_id            ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_design_id          ON products(design_id);
CREATE INDEX IF NOT EXISTS idx_products_approved_status    ON products(is_approved, product_status);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id           ON cart_items(user_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id               ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status                ON orders(status);

CREATE INDEX IF NOT EXISTS idx_revenue_splits_order_id      ON revenue_splits(order_id);
CREATE INDEX IF NOT EXISTS idx_revenue_splits_creator_id    ON revenue_splits(creator_id);

-- ============================================================
-- Seed: Admin user
-- ============================================================

INSERT INTO users (user_id, email, name, role, creator_status)
VALUES ('user_admin_001', 'projectmark121224@gmail.com', 'projectmark', 'admin', 'approved')
ON CONFLICT (email) DO NOTHING;

COMMIT;
