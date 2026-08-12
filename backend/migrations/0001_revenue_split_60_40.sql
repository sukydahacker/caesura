-- ============================================================
-- Migration 0001: creator/platform split 80/20 → 60/40
-- ============================================================
-- Run: psql "$DATABASE_URL" -f backend/migrations/0001_revenue_split_60_40.sql

BEGIN;

-- New products default to the 60/40 split going forward.
ALTER TABLE products ALTER COLUMN creator_commission_rate SET DEFAULT 0.60;
ALTER TABLE products ALTER COLUMN platform_commission_rate SET DEFAULT 0.40;

-- base_cost no longer defaults to a fake ₹500 — every insert path must compute
-- and store the real landed cost. 0.0 is an obviously-wrong sentinel so a row
-- that slips through without a computed cost is easy to spot.
ALTER TABLE products ALTER COLUMN base_cost SET DEFAULT 0.0;

-- Existing rows created under the old 80/20 default move to 60/40. Rows with a
-- deliberately-overridden custom rate (none exist as of this migration) are left alone.
UPDATE products
SET creator_commission_rate = 0.60,
    platform_commission_rate = 0.40
WHERE creator_commission_rate = 0.80
  AND platform_commission_rate = 0.20;

-- Revenue splits now snapshot the landed cost they were computed from, so
-- historical earnings stay correct after Qikink catalog prices move.
ALTER TABLE revenue_splits ADD COLUMN IF NOT EXISTS landed_cost NUMERIC(10, 2);

COMMIT;
