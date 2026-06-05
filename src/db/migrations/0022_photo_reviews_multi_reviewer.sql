-- ============================================================================
-- Migration 0022 — photo_reviews: one review PER REVIEWER per analysis
-- ============================================================================
-- The expert-labeling loop was single-authority (one row per analysis,
-- attributed by reviewer_email from the Clerk session). We're opening
-- review to multiple named reviewers (Peter, Gina, Ryan) via a public,
-- no-auth page that self-identifies by name — so reviews must be kept
-- SEPARATE per person rather than overwriting one shared row.
--
-- Changes:
--   reviewer        — new NOT NULL display name ('Peter' | 'Gina' | 'Ryan').
--                     This is the attribution the queue + detail surfaces show.
--   reviewer_email  — now NULLABLE: public reviewers have no Clerk email.
--                     Admin (Clerk) reviews still populate it.
--   uniqueness      — was UNIQUE (photo_analysis_id); now UNIQUE
--                     (photo_analysis_id, reviewer) so each person gets their
--                     own row and the upsert keys on the pair.
--
-- Backfill: existing rows (single-authority era) get a reviewer derived
-- from the local part of their email so attribution survives the change.
--
-- Idempotent — safe to re-run.
-- ============================================================================

ALTER TABLE photo_reviews ADD COLUMN IF NOT EXISTS reviewer text;

UPDATE photo_reviews
   SET reviewer = initcap(split_part(reviewer_email, '@', 1))
 WHERE reviewer IS NULL AND reviewer_email IS NOT NULL;

-- Any row still without a reviewer (shouldn't happen) gets a safe default.
UPDATE photo_reviews SET reviewer = 'Unknown' WHERE reviewer IS NULL;

ALTER TABLE photo_reviews ALTER COLUMN reviewer SET NOT NULL;

-- Public reviewers have no email.
ALTER TABLE photo_reviews ALTER COLUMN reviewer_email DROP NOT NULL;

-- Drop the old single-review-per-analysis constraint and replace it with the
-- per-reviewer composite uniqueness the new upsert targets.
ALTER TABLE photo_reviews DROP CONSTRAINT IF EXISTS photo_reviews_photo_analysis_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS photo_reviews_analysis_reviewer_key
  ON photo_reviews (photo_analysis_id, reviewer);
