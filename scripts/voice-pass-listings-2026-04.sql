-- scripts/voice-pass-listings-2026-04.sql
--
-- Voice pass on the 6 published class-action listings — barrier-forward
-- framing rather than condition-forward.
--
-- Two listings carried language that centered the user's disability
-- before naming the barrier event:
--
--   government-website-inaccessible.short_description
--     'blocked you from doing something you needed to do because of
--     a disability' → names the disability as the cause
--     New: names the barrier (site doesn't work with assistive tech)
--     and the consequence (couldn't file / apply / get service)
--
--   retail-website-screenreader.eligibility_summary
--     'If you are blind or have low vision and a retail website
--     blocked you from shopping' → identity-first, condition before
--     event
--     New: leads with the barrier ('a retail website would not work
--     with your screen reader') and the consequence
--
-- The other 4 listings were already barrier-forward and were not
-- changed in this pass. The full_description fields on all 6 stay
-- as-is — they appropriately use legal terminology when describing
-- the law (Title III, Title II, ACAA, etc.).
--
-- Idempotent: each UPDATE matches by slug + sets the new text. Safe
-- to re-run.
-- ============================================================================

UPDATE listings
SET short_description = 'A city, county, or state government website or app would not work with your assistive technology, so you could not file what you needed to file, apply for what you needed to apply for, or get the same service everyone else does.'
WHERE slug = 'government-website-inaccessible';

UPDATE listings
SET eligibility_summary = 'If a retail or e-commerce website would not work with your screen reader and that blocked you from shopping or checking out, you may qualify.'
WHERE slug = 'retail-website-screenreader';
