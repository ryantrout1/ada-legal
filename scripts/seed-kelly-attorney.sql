-- scripts/seed-kelly-attorney.sql
--
-- Adds Kelley Brooks Simoneaux to the attorneys directory under the adall
-- organization. No [TEST] prefix and status='approved' so she surfaces on
-- the public /attorneys page. Pairs with the Spinal Cord Injury Law Firm
-- demo class action listings.
--
-- Source: https://spinalcordinjurylawyers.com/meet-kelley/
--
-- Idempotent: NOT EXISTS guard on name. Safe to re-run.
--
-- To remove:
--   DELETE FROM attorneys WHERE name = 'Kelley Brooks Simoneaux';
-- ============================================================================

INSERT INTO attorneys (
  org_id, name, firm_name, location_city, location_state,
  practice_areas, email, phone, website_url, bio, status, approved_at
)
SELECT
  o.id,
  'Kelley Brooks Simoneaux',
  'The Spinal Cord Injury Law Firm',
  'Washington',
  'DC',
  '["ada","civil_rights","public_accommodations","transportation"]'::jsonb,
  'info@spinalcordinjurylawyers.com',
  '(202) 507-9180',
  'https://spinalcordinjurylawyers.com',
  'Founder of The Spinal Cord Injury Law Firm, a boutique national practice representing individuals after catastrophic injuries and protecting the rights of people with disabilities. Kelley sustained a T-12 spinal cord injury at age 16 in a 2001 car crash and went on to graduate from Birmingham-Southern College and the University of Tennessee College of Law. She has tried numerous cases in state and federal court and helped secure tens of millions of dollars in recoveries for her clients. Beyond the courtroom, Kelley founded the Wheel2Ride campaign on rideshare accessibility, serves as Director of Law and Advocacy for SPINALpedia.org, and sits on the WMATA Accessibility Advisory Council and the Fairfax Area Disability Services Board.',
  'approved',
  now()
FROM organizations o
WHERE o.org_code = 'adall'
  AND NOT EXISTS (
    SELECT 1 FROM attorneys WHERE name = 'Kelley Brooks Simoneaux'
  );
