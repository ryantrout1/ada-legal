-- ============================================================================
-- Migration 0020 — photo_reviews (expert labeling loop)
-- ============================================================================
-- Stores Peter's (the trained, licensed expert) verdict on each photo
-- analysis. One review per photo_analyses row — Peter is the sole
-- authority, so there is no multi-reviewer reconciliation. The review
-- captures BOTH directions of error:
--
--   finding_labels   — per-finding verdict on what the engine DID emit
--                      (correct | over_flagged | partial | wrong_cite),
--                      each with a free-text reason. These are the
--                      false positives + confirmations.
--   missed_findings  — concerns the engine FAILED to emit that Peter
--                      caught (the false negatives). Free-form, optionally
--                      tagged with a standard + severity.
--
-- model_version is copied from the analysis at review time so the eval
-- rollup can group accuracy by engine version even if a photo is later
-- re-analyzed under a newer engine.
--
-- status: 'reviewed' once Peter labels it, 'addressed' once Ryan has
-- acted on it (the check-off). Absence of a row = unreviewed.
--
-- Idempotent — IF NOT EXISTS makes it safe to re-run.
-- ============================================================================

CREATE TABLE IF NOT EXISTS photo_reviews (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_analysis_id  uuid NOT NULL UNIQUE
                       REFERENCES photo_analyses (id) ON DELETE CASCADE,
  reviewer_email     text NOT NULL,
  status             text NOT NULL DEFAULT 'reviewed',  -- reviewed | addressed
  overall_verdict    text,                              -- accurate | missed | over_flagged | wrong | mixed
  finding_labels     jsonb NOT NULL DEFAULT '[]'::jsonb,
  missed_findings    jsonb NOT NULL DEFAULT '[]'::jsonb,
  reviewer_notes     text,
  model_version      text,
  reviewed_at        timestamptz NOT NULL DEFAULT now(),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS photo_reviews_model_version ON photo_reviews (model_version);
CREATE INDEX IF NOT EXISTS photo_reviews_status        ON photo_reviews (status);
