-- Phase A1 (May 2026): litigation_listings v2 — expanded kind/status
-- enums, reading-level prose variants, documentation-gating fields,
-- structured key_dates / related_listing_ids / ada_qualifying_questions,
-- lead_firm_id, and a litigation_listing_id channel on ada_sessions.
--
-- STATUS WHEN THIS FILE LANDED: this migration is ALREADY APPLIED to
-- the production main branch of Neon project ancient-star-00703098.
-- The work ran live during /shipit Phase A1 ahead of the Drizzle
-- schema being updated, and was verified against information_schema
-- and pg_constraint before this file was authored. The file exists in
-- the repo so the migration history matches reality for the next dev
-- or Claude session reading 0001 → N.
--
-- The schema kept the 0009 invariants (status default 'draft', kind +
-- status CHECK enforcement, unique (org_id, slug)) and added the
-- following:
--
--   kind enum  (was: class | mass)
--   ──────────────────────────────
--     class                — federally certified class action
--     enforcement_action   — DOJ / state AG (replaces 'mass')
--     consent_decree       — court-supervised compliance
--     pattern_of_practice  — no current named case, intake for future
--     regulatory_challenge — notice-and-comment / regulatory action
--
--   status enum  (was: draft | active | settled | closed | archived)
--   ────────────────────────────────────────────────────────────────
--     draft, active, investigating, compliance, tracking, closed, archived
--     ('settled' removed because it conflated terminal status with
--      active settlement-administration. Use 'closed' for terminal.)
--
--   New prose columns (each text NULL):
--     legal_theory
--     short_description_{simple, professional}
--     full_description_{simple, professional}
--     eligibility_{simple, professional}
--     documentation_required_{simple, professional}
--     no_documentation_path_{simple, professional}
--     evidence_guidance_{simple, professional}
--     what_this_is_not_{simple, professional}
--
--   New structured columns:
--     key_dates                 jsonb NOT NULL DEFAULT '{}'
--     related_listing_ids       jsonb NOT NULL DEFAULT '[]'
--     ada_qualifying_questions  jsonb NOT NULL DEFAULT '{}'
--     lead_firm_id              uuid  REFERENCES law_firms(id) ON DELETE SET NULL
--
--   ada_sessions:
--     litigation_listing_id     uuid  REFERENCES litigation_listings(id) ON DELETE SET NULL
--
-- All ALTERs use IF NOT EXISTS / IF EXISTS so this migration is safe
-- to replay on a fresh branch (e.g. preview deploys or local Neon clones).

-- ─── litigation_listings ──────────────────────────────────────────────────

ALTER TABLE litigation_listings ADD COLUMN IF NOT EXISTS legal_theory text;
ALTER TABLE litigation_listings ADD COLUMN IF NOT EXISTS short_description_simple text;
ALTER TABLE litigation_listings ADD COLUMN IF NOT EXISTS short_description_professional text;
ALTER TABLE litigation_listings ADD COLUMN IF NOT EXISTS full_description_simple text;
ALTER TABLE litigation_listings ADD COLUMN IF NOT EXISTS full_description_professional text;
ALTER TABLE litigation_listings ADD COLUMN IF NOT EXISTS eligibility_simple text;
ALTER TABLE litigation_listings ADD COLUMN IF NOT EXISTS eligibility_professional text;

ALTER TABLE litigation_listings ADD COLUMN IF NOT EXISTS documentation_required_simple text;
ALTER TABLE litigation_listings ADD COLUMN IF NOT EXISTS documentation_required_professional text;
ALTER TABLE litigation_listings ADD COLUMN IF NOT EXISTS no_documentation_path_simple text;
ALTER TABLE litigation_listings ADD COLUMN IF NOT EXISTS no_documentation_path_professional text;
ALTER TABLE litigation_listings ADD COLUMN IF NOT EXISTS evidence_guidance_simple text;
ALTER TABLE litigation_listings ADD COLUMN IF NOT EXISTS evidence_guidance_professional text;
ALTER TABLE litigation_listings ADD COLUMN IF NOT EXISTS what_this_is_not_simple text;
ALTER TABLE litigation_listings ADD COLUMN IF NOT EXISTS what_this_is_not_professional text;

ALTER TABLE litigation_listings ADD COLUMN IF NOT EXISTS key_dates jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE litigation_listings ADD COLUMN IF NOT EXISTS related_listing_ids jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE litigation_listings ADD COLUMN IF NOT EXISTS ada_qualifying_questions jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE litigation_listings ADD COLUMN IF NOT EXISTS lead_firm_id uuid;

-- FK on lead_firm_id (added separately so it can fail loudly if law_firms
-- isn't present yet on a partially-migrated branch).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'litigation_listings_lead_firm_fk'
  ) THEN
    ALTER TABLE litigation_listings
      ADD CONSTRAINT litigation_listings_lead_firm_fk
      FOREIGN KEY (lead_firm_id) REFERENCES law_firms(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS litigation_lead_firm
  ON litigation_listings (lead_firm_id);

-- ─── kind CHECK constraint swap ──────────────────────────────────────────
-- Drop the old (class | mass) constraint and add the v2 (5-value) constraint.

ALTER TABLE litigation_listings DROP CONSTRAINT IF EXISTS litigation_listings_kind_check;
ALTER TABLE litigation_listings
  ADD CONSTRAINT litigation_listings_kind_check
  CHECK (kind IN ('class', 'enforcement_action', 'consent_decree', 'pattern_of_practice', 'regulatory_challenge'));

-- ─── status CHECK constraint swap ────────────────────────────────────────

ALTER TABLE litigation_listings DROP CONSTRAINT IF EXISTS litigation_listings_status_check;
ALTER TABLE litigation_listings
  ADD CONSTRAINT litigation_listings_status_check
  CHECK (status IN ('draft', 'active', 'investigating', 'compliance', 'tracking', 'closed', 'archived'));

-- ─── ada_sessions.litigation_listing_id ──────────────────────────────────

ALTER TABLE ada_sessions ADD COLUMN IF NOT EXISTS litigation_listing_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ada_sessions_litigation_listing_fk'
  ) THEN
    ALTER TABLE ada_sessions
      ADD CONSTRAINT ada_sessions_litigation_listing_fk
      FOREIGN KEY (litigation_listing_id) REFERENCES litigation_listings(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ada_sessions_litigation_listing_idx
  ON ada_sessions (litigation_listing_id)
  WHERE litigation_listing_id IS NOT NULL;
