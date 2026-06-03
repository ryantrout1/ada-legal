-- ============================================================================
-- Migration 0021 — tester comment on photo analyses
-- ============================================================================
-- Adds a free-text note the field tester adds AFTER seeing Ada's analysis
-- on the /photo capture page — their reaction to what Ada said. Distinct
-- from the pre-analysis "what are we looking at?" comment (which is sent
-- to Ada as context). Populated by POST /api/ada/photo-feedback and shown
-- in the /admin/photo-review detail view.
--
-- Nullable, no backfill. Idempotent.
-- ============================================================================

ALTER TABLE photo_analyses
  ADD COLUMN IF NOT EXISTS tester_comment text;
