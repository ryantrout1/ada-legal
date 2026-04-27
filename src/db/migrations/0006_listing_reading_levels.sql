-- ============================================================================
-- Migration 0006 — listing reading-level variants
-- ============================================================================
-- The class action detail page (/class-actions/:slug) needs to support the
-- same simple / standard / professional reading-level toggle that the
-- standards guide already uses (via ReadingLevelContext).
--
-- The seed text we already shipped (migration 0001 hotel listing + the
-- Spinal Cord Injury Law Firm seed) is closest to the 'standard' voice:
-- plain language, no citations, no case names. We add two nullable variant
-- columns alongside the existing user-facing prose fields:
--
--   listings.short_description_simple        — 5th–6th grade summary
--   listings.short_description_professional  — firm-website voice + cites
--   listings.full_description_simple
--   listings.full_description_professional
--   listings.eligibility_summary_simple
--   listings.eligibility_summary_professional
--   listing_configs.case_description_simple
--   listing_configs.case_description_professional
--
-- The eligibility_criteria / required_fields / disqualifying_conditions
-- jsonb columns are intentionally NOT split per level. Eligibility bullets
-- are short factual gates ('You requested a ride from Uber, Lyft, or
-- another rideshare company in the United States') — they read fine across
-- levels, and Ada operates against them as data, not as prose. Splitting
-- them would multiply maintenance burden without improving comprehension.
--
-- Fallback rule: when a variant is null, callers fall back to the
-- 'standard' (existing) field. This means:
--   1. Existing listings work unchanged.
--   2. Adding a single variant per listing is incremental — write the
--      simple version first, professional later.
--
-- The v_active_listings view is rebuilt to surface the new columns. The
-- view definition follows the same pilot-or-subscription rule as 0005.
-- ============================================================================

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS short_description_simple        text,
  ADD COLUMN IF NOT EXISTS short_description_professional  text,
  ADD COLUMN IF NOT EXISTS full_description_simple         text,
  ADD COLUMN IF NOT EXISTS full_description_professional   text,
  ADD COLUMN IF NOT EXISTS eligibility_summary_simple      text,
  ADD COLUMN IF NOT EXISTS eligibility_summary_professional text;

COMMENT ON COLUMN listings.short_description_simple IS
  'Reading-level variant: simple (5th–6th grade plain language). NULL = fall back to short_description.';
COMMENT ON COLUMN listings.short_description_professional IS
  'Reading-level variant: professional (firm-website voice with case names and citations). NULL = fall back to short_description.';
COMMENT ON COLUMN listings.full_description_simple IS
  'Reading-level variant: simple (5th–6th grade plain language). NULL = fall back to full_description.';
COMMENT ON COLUMN listings.full_description_professional IS
  'Reading-level variant: professional (firm-website voice with case names and citations). NULL = fall back to full_description.';
COMMENT ON COLUMN listings.eligibility_summary_simple IS
  'Reading-level variant: simple. NULL = fall back to eligibility_summary.';
COMMENT ON COLUMN listings.eligibility_summary_professional IS
  'Reading-level variant: professional. NULL = fall back to eligibility_summary.';

ALTER TABLE listing_configs
  ADD COLUMN IF NOT EXISTS case_description_simple        text,
  ADD COLUMN IF NOT EXISTS case_description_professional  text;

COMMENT ON COLUMN listing_configs.case_description_simple IS
  'Reading-level variant: simple (5th–6th grade plain language). NULL = fall back to case_description.';
COMMENT ON COLUMN listing_configs.case_description_professional IS
  'Reading-level variant: professional (firm-website voice + citations). NULL = fall back to case_description.';

-- Rebuild v_active_listings to surface the new variant columns. Callers
-- that want a specific level pick the matching column with COALESCE on
-- the read path (the API does this, not the view, to keep the view
-- structurally simple).
DROP VIEW IF EXISTS v_active_listings;

CREATE VIEW v_active_listings AS
SELECT
  l.id                                       AS listing_id,
  l.slug,
  l.title,
  l.category,
  l.tier,
  l.short_description,
  l.short_description_simple,
  l.short_description_professional,
  l.full_description,
  l.full_description_simple,
  l.full_description_professional,
  l.eligibility_summary,
  l.eligibility_summary_simple,
  l.eligibility_summary_professional,
  lf.id                                      AS law_firm_id,
  lf.name                                    AS law_firm_name,
  s.id                                       AS subscription_id,
  COALESCE(s.tier, 'pilot')                  AS subscription_tier,
  s.current_period_end,
  lf.is_pilot                                AS is_pilot
FROM listings l
JOIN law_firms lf ON lf.id = l.law_firm_id
LEFT JOIN subscriptions s
  ON s.listing_id = l.id
  AND s.status IN ('active', 'trialing')
  AND (s.current_period_end IS NULL OR s.current_period_end > now())
WHERE l.status = 'published'
  AND lf.status = 'active'
  AND (lf.is_pilot = true OR s.id IS NOT NULL);

COMMENT ON VIEW v_active_listings IS
  'Listings currently live to end users + reading-level variant columns. Surfaces simple/professional alongside the canonical (standard) prose fields. Migration 0006.';
