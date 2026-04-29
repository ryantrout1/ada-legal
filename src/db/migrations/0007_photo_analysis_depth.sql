-- ============================================================================
-- Migration 0007 — photo analysis depth (Commit 8)
-- ============================================================================
-- Extends photo_analyses with the top-level fields the analyzer now
-- emits alongside its findings list:
--
--   scene             — what the photo(s) show (3 reading-level variants)
--   summary           — 2-3 sentence batch assessment (3 variants)
--   overall_risk      — high | medium | low | none, rolled up from findings
--   positive_findings — compliant features observed (3 variants of array)
--
-- All four are nullable. Rows written before this migration ran will
-- have NULL in these columns; the attorney package projection treats
-- the analysis as undefined in that case and falls back to findings-only.
-- New writes always populate them.
-- ============================================================================

ALTER TABLE photo_analyses
  ADD COLUMN scene             jsonb,
  ADD COLUMN summary           jsonb,
  ADD COLUMN overall_risk      text,
  ADD COLUMN positive_findings jsonb;

-- No backfill: existing rows keep NULL. Downstream consumers tolerate
-- null analysis (attorney package treats it as absent, renders findings-only).
