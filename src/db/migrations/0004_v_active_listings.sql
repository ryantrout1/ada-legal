-- ============================================================================
-- Migration 0004 — v_active_listings view
-- ============================================================================
-- Step 19 (Ch1 schema wiring). A single view that tells us which listings are
-- actually LIVE and billable at this moment: listing is published, its law
-- firm is active, and a non-cancelled subscription covers it.
--
-- Why a view rather than ad-hoc joins:
--   - Discovery-mode routing (Step 22) queries this frequently. One
--     definition, one place to audit.
--   - The eligibility rules for "live" are subtle (listing status, firm
--     status, subscription status, period_end not past, cancel_at_period_end
--     respected). Locking the definition in a view prevents subtle bugs
--     where a listing appears in one surface but not another.
--   - Admin and engine both want the same answer to "is this listing
--     currently serving users?" A view is the single source of truth.
--
-- Columns surfaced:
--   listing_id, slug, title, category, tier,
--   short_description, full_description, eligibility_summary,
--   law_firm_id, law_firm_name,
--   subscription_id, subscription_tier, current_period_end
--
-- A listing appears in this view only if ALL of:
--   listings.status = 'published'
--   law_firms.status = 'active'
--   subscriptions.status IN ('active', 'trialing')
--   subscriptions.current_period_end IS NULL
--     OR subscriptions.current_period_end > now()
--
-- Note: multiple rows per listing are possible if a listing has multiple
-- subscriptions (e.g. historical record + current). That's fine — consumers
-- should DISTINCT ON listing_id with an ORDER BY current_period_end DESC
-- when they want a single row per listing.
--
-- Ref: Step 19, Commit 1.
-- ============================================================================

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
  s.id                          AS subscription_id,
  s.tier                        AS subscription_tier,
  s.current_period_end
FROM listings l
JOIN law_firms lf ON lf.id = l.law_firm_id
LEFT JOIN subscriptions s
  ON s.listing_id = l.id
  AND s.status IN ('active', 'trialing')
  AND (s.current_period_end IS NULL OR s.current_period_end > now())
WHERE l.status = 'published'
  AND lf.status = 'active'
  AND s.id IS NOT NULL;

COMMENT ON VIEW v_active_listings IS
  'Listings currently live to end users: published listing + active firm + non-expired subscription. Step 19.';
