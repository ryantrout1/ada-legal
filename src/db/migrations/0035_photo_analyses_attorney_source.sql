-- Migration 0035 — attorney-attached evidence photos.
--
-- Build-list #3 Phase 2: attorneys attach their own photos to any matter,
-- including self-originated (direct) matters that have no claimant session.
-- Such an analysis has no origin session, so session_id becomes nullable. A
-- `source` column records who supplied the photo:
--   'claimant' — shared during Ada intake (the Phase 1 path); session_id set.
--   'attorney' — uploaded by the attorney in the workspace; session_id null.
--
-- Additive + reversible: widening a NOT NULL to nullable never rejects an
-- existing row, and the new column has a default. Existing rows are all
-- 'claimant' with a session, which the default + prior NOT NULL already match.
--
-- Ref: /plan "Evidence + full photo analysis for attorneys" Phase 2.

ALTER TABLE photo_analyses ALTER COLUMN session_id DROP NOT NULL;

ALTER TABLE photo_analyses
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'claimant';
