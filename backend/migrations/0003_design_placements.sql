-- ============================================================
-- Migration 0003: per-view design placements
-- ============================================================
-- A design can now have a different image + position on each garment view
-- (front/back/pockets). placements records one entry per view that actually
-- has a design, so a front-only design never gets reported as a back or
-- pocket print. placement_coordinates/placement_view are kept (set to the
-- primary/front placement) for any older reader that only knows the old
-- single-placement shape.
--
-- Run: psql "$DATABASE_URL" -f backend/migrations/0003_design_placements.sql

BEGIN;

ALTER TABLE designs ADD COLUMN IF NOT EXISTS placements JSONB;

COMMIT;
