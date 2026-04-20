-- 0002_seed_test_attorneys.sql
--
-- Seeds synthetic attorneys so search_attorneys tool returns meaningful
-- results during Ch0 / Ch1 development. Real attorney data imports in
-- Phase B Step 12.
--
-- Every row here uses firm_name prefix '[TEST]' and status='approved'
-- so they're visible in queries. To drop all test data later:
--   DELETE FROM attorneys WHERE firm_name LIKE '[TEST]%';
--
-- Ref: docs/ARCHITECTURE.md §7, content-migration/INVENTORY.md

INSERT INTO attorneys (
  org_id, name, firm_name, location_city, location_state,
  practice_areas, email, phone, website_url, bio, status
)
SELECT
  o.id, v.name, v.firm_name, v.location_city, v.location_state,
  v.practice_areas::jsonb, v.email, v.phone, v.website_url, v.bio,
  'approved'
FROM organizations o
CROSS JOIN (
  VALUES
    -- Arizona
    ('Jane Martinez', '[TEST] Martinez Disability Law, PLLC',
     'Phoenix', 'AZ',
     '["ada","employment","public_accommodations"]',
     'jane@example-test.invalid', '(602) 555-0101',
     'https://example-test.invalid/martinez',
     'Synthetic test attorney for Ch0 dev. Specializes in ADA Title I/III matters in the Greater Phoenix area.'),
    ('David Chen', '[TEST] Chen & Associates',
     'Tucson', 'AZ',
     '["ada","housing","education"]',
     'david@example-test.invalid', '(520) 555-0102',
     'https://example-test.invalid/chen',
     'Synthetic test attorney for Ch0 dev. Housing and education access cases statewide.'),
    ('Monica Ortiz', '[TEST] Desert Civil Rights Group',
     'Scottsdale', 'AZ',
     '["ada","public_accommodations","civil_rights"]',
     'monica@example-test.invalid', '(480) 555-0103',
     'https://example-test.invalid/ortiz',
     'Synthetic test attorney for Ch0 dev. Title III public accommodations.'),

    -- California
    ('Priya Shah', '[TEST] Shah Legal',
     'Los Angeles', 'CA',
     '["ada","employment","housing"]',
     'priya@example-test.invalid', '(213) 555-0201',
     'https://example-test.invalid/shah',
     'Synthetic test attorney for Ch0 dev. Employment-focused ADA practice.'),
    ('Marcus Lee', '[TEST] Bay Access Advocates',
     'San Francisco', 'CA',
     '["ada","public_accommodations","education"]',
     'marcus@example-test.invalid', '(415) 555-0202',
     'https://example-test.invalid/lee',
     'Synthetic test attorney for Ch0 dev. Public accommodations and educational access.'),

    -- New York
    ('Rebecca Stein', '[TEST] Stein Disability Rights',
     'New York', 'NY',
     '["ada","employment","transportation"]',
     'rebecca@example-test.invalid', '(212) 555-0301',
     'https://example-test.invalid/stein',
     'Synthetic test attorney for Ch0 dev. Transportation and employment access.'),

    -- Texas (breadth — no strong preference, just to validate multi-state filters)
    ('Alan Wright', '[TEST] Wright & Partners',
     'Austin', 'TX',
     '["ada","public_accommodations"]',
     'alan@example-test.invalid', '(512) 555-0401',
     'https://example-test.invalid/wright',
     'Synthetic test attorney for Ch0 dev.'),

    -- Illinois
    ('Helen Kowalski', '[TEST] Kowalski Law',
     'Chicago', 'IL',
     '["ada","housing","civil_rights"]',
     'helen@example-test.invalid', '(312) 555-0501',
     'https://example-test.invalid/kowalski',
     'Synthetic test attorney for Ch0 dev.')
) AS v(name, firm_name, location_city, location_state, practice_areas, email, phone, website_url, bio)
WHERE o.org_code = 'adall'
ON CONFLICT DO NOTHING;

INSERT INTO _migrations (filename) VALUES ('0002_seed_test_attorneys.sql')
ON CONFLICT (filename) DO NOTHING;
