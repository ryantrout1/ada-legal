-- ============================================================================
-- Migration 0005: pilot mode for law firms.
--
-- During pilot, we onboard firms WITHOUT routing them through Stripe. They
-- get full access to Ada + listings + attorney handoff for the duration of
-- the pilot; when the pilot ends we flip is_pilot=false and start a Stripe
-- subscription.
--
-- Design note: pilot-or-subscription is a firm-level property (is_pilot
-- boolean on law_firms), NOT a subscription-level state. Rationale:
--   1. The subscriptions table only ever contains REAL Stripe data. No
--      fake rows, no null-stripe_subscription_id pilot rows polluting
--      Stripe audits.
--   2. The mental model matches reality: "this firm is in pilot mode"
--      is a property of the firm, not a fake billing cycle.
--   3. Enabling billing for a pilot firm = flip the flag + start a Stripe
--      sub. No cleanup of fake subscription rows needed.
--
-- The v_active_listings view gets re-created to OR-in pilot firms. A
-- listing is live to end users if:
--   (a) firm is_pilot=true AND listing status=published, OR
--   (b) firm has an active, non-expired Stripe subscription for that
--       listing AND listing status=published
--
-- Existing data: all firms seeded in 0001/0002 get is_pilot=false by
-- default. Ryan flips the flag on each firm as they onboard through the
-- admin UI (Step 25).
--
-- Ref: Step 23, Commit 1.
-- ============================================================================

-- 1. Add is_pilot column with a safe default. DEFAULT false is a
--    deterministic constant so this is a metadata-only change with no
--    table rewrite.
ALTER TABLE law_firms
  ADD COLUMN IF NOT EXISTS is_pilot boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN law_firms.is_pilot IS
  'When true, the firm''s listings are active without requiring a Stripe subscription. Used during firm onboarding (pilot mode). Flip to false and start a Stripe sub when transitioning to paid billing. Step 23.';

-- 2. Rebuild v_active_listings to include pilot firms.
--    Views don't support IF NOT EXISTS cleanly with changed column lists,
--    so we DROP then CREATE. Safe because the view has no dependents at
--    this point (only read by DbClient.listActiveListings).
DROP VIEW IF EXISTS v_active_listings;

CREATE VIEW v_active_listings AS
SELECT
  l.id                          AS listing_id,
  l.slug,
  l.title,
  l.category,
  l.tier,
  l.short_description,
  l.full_description,
  l.eligibility_summary,
  lf.id                         AS law_firm_id,
  lf.name                       AS law_firm_name,
  -- Pilot firms don't have a subscription. Callers that care about
  -- "real" billing state should check is_pilot OR inspect s.id.
  s.id                          AS subscription_id,
  COALESCE(s.tier, 'pilot')     AS subscription_tier,
  s.current_period_end,
  lf.is_pilot                   AS is_pilot
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
  'Listings currently live to end users: published listing + active firm + (pilot mode OR active Stripe subscription). Step 23 pilot-aware update.';
