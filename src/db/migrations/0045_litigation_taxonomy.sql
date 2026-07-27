-- Litigation taxonomy — barrier_category + intake_status. Additive, replayable.
--
-- Two new axes on litigation_listings, neither of which duplicates an
-- existing column.
--
--   barrier_category — WHERE the barrier was encountered. The public
--     directory navigates by this. `kind` (the legal instrument) stays
--     exactly where it is; it is the admin's field. A person who was
--     refused a ride should not have to know whether their problem is a
--     "pattern of practice" before they can find the right page.
--
--   intake_status — whether a person can actually DO something here.
--     Deliberately narrow, because `status` already carries the
--     lifecycle and `compliance` already means "settled, obligations
--     live". What `status` cannot express is that `active` covers four
--     different situations at once: a case accepting members (Bryant),
--     a case merely being litigated (US v. Uber), a case whose claim
--     window has closed (Alcazar), and a pattern-of-practice row that
--     is not a case at all. Three values close exactly that gap:
--
--       open       a person can join, claim, or be represented now
--       mechanism  no intake, but a live mechanism exists to invoke
--                  (Philadelphia 311, a hospital complaint process, a
--                  monitoring inbox)
--       none       nothing a person can do directly here
--
-- Both columns are NOT NULL with a default, so an un-categorised row is
-- visibly wrong on the admin surface rather than silently null, and code
-- deployed ahead of this migration reads the default instead of
-- crashing. `unassigned` is a real value in the CHECK for that reason.
--
-- The backfill is explicit per-slug UPDATE statements, not a heuristic.
-- Every assignment is reviewable in this diff. Assignments derive from
-- the taxonomy map produced during research; two are judgment calls
-- flagged there (Disney -> restaurants_stores_venues rather than a
-- separate entertainment category; Harris v. Union Pacific -> employment,
-- the only employment row).
--
-- Ref: /plan litigation-taxonomy-and-contacts, Phase 1, AC1 + AC2.

-- ─── Columns ─────────────────────────────────────────────────────────────

ALTER TABLE litigation_listings
  ADD COLUMN IF NOT EXISTS barrier_category text NOT NULL DEFAULT 'unassigned';

ALTER TABLE litigation_listings
  ADD COLUMN IF NOT EXISTS intake_status text NOT NULL DEFAULT 'none';

-- ─── CHECK constraints ───────────────────────────────────────────────────
-- DROP IF EXISTS + ADD is the replayable pattern migrations 0010 and 0024
-- used on this table's kind CHECK.

ALTER TABLE litigation_listings
  DROP CONSTRAINT IF EXISTS litigation_listings_barrier_category_check;
ALTER TABLE litigation_listings
  ADD CONSTRAINT litigation_listings_barrier_category_check
  CHECK (barrier_category IN (
    'sidewalks_streets',
    'rideshare_taxis',
    'air_travel',
    'buses_transit',
    'healthcare',
    'hotels_lodging',
    'restaurants_stores_venues',
    'websites_apps_kiosks',
    'voting_elections',
    'gov_services',
    'jails_prisons',
    'community_living',
    'education',
    'employment',
    'housing',
    'unassigned'
  ));

ALTER TABLE litigation_listings
  DROP CONSTRAINT IF EXISTS litigation_listings_intake_status_check;
ALTER TABLE litigation_listings
  ADD CONSTRAINT litigation_listings_intake_status_check
  CHECK (intake_status IN ('open', 'mechanism', 'none'));

-- ─── Index ───────────────────────────────────────────────────────────────
-- Mirrors litigation_kind_status. The public browse page filters in
-- memory over ~36 rows, but Ada's prompt context and deep links query
-- by category + status server-side.

CREATE INDEX IF NOT EXISTS litigation_category_status
  ON litigation_listings (barrier_category, status);

-- ─── Backfill: barrier_category ──────────────────────────────────────────
-- Getting around

UPDATE litigation_listings SET barrier_category = 'sidewalks_streets'
  WHERE slug IN (
    'willits-v-los-angeles-sidewalks',
    'reynoldson-v-seattle-curb-ramps',
    'liberty-resources-v-philadelphia-sidewalks',
    'united-spinal-v-nyc-sidewalks'
  );

UPDATE litigation_listings SET barrier_category = 'rideshare_taxis'
  WHERE slug IN (
    'nfb-ca-v-uber-service-animals',
    'doj-v-uber-service-animals-wheelchairs',
    'rideshare-wheelchair-service-animal-denials'
  );

UPDATE litigation_listings SET barrier_category = 'air_travel'
  WHERE slug IN (
    'airline-wheelchair-damage',
    'a4a-v-dot-wheelchair-rule'
  );

UPDATE litigation_listings SET barrier_category = 'buses_transit'
  WHERE slug = 'doj-investigation-flixbus-greyhound';

-- Places that serve the public

UPDATE litigation_listings SET barrier_category = 'healthcare'
  WHERE slug IN (
    'dra-v-first-urology-medical-equipment',
    'united-spinal-v-beth-israel-hospital',
    'doj-v-sea-mar-dental',
    'medical-exam-table-access'
  );

UPDATE litigation_listings SET barrier_category = 'hotels_lodging'
  WHERE slug IN (
    'niles-v-hilton-bed-heights',
    'doj-v-hilton-2010-consent-decree',
    'doj-v-marriott-2024-settlement'
  );

UPDATE litigation_listings SET barrier_category = 'restaurants_stores_venues'
  WHERE slug IN (
    'williams-v-theme-park-ride-access',
    'restaurant-service-animal-denials'
  );

-- Online & digital

UPDATE litigation_listings SET barrier_category = 'websites_apps_kiosks'
  WHERE slug IN (
    'alcazar-v-fashion-nova-web-access',
    'mobile-app-screen-reader',
    'kiosk-accessibility'
  );

-- Government & civic life

UPDATE litigation_listings SET barrier_category = 'voting_elections'
  WHERE slug IN (
    'bryant-v-harris-county-mail-ballots',
    'doj-v-la-county-vote-centers',
    'doj-investigation-alaska-elections',
    'polling-place-access'
  );

UPDATE litigation_listings SET barrier_category = 'gov_services'
  WHERE slug IN (
    'doj-investigation-az-dcs',
    'gov-online-services-access'
  );

-- Where you live, learn & work

UPDATE litigation_listings SET barrier_category = 'jails_prisons'
  WHERE slug IN (
    'adams-v-kentucky-deaf-prisoners',
    'coen-v-ga-doc-deaf-prisoners',
    'dunsmore-v-sd-county-jail-access',
    'trivette-v-tn-doc-deaf-prisoners'
  );

UPDATE litigation_listings SET barrier_category = 'community_living'
  WHERE slug IN (
    'doj-investigation-idaho-nursing',
    'texas-v-kennedy-504-integration'
  );

UPDATE litigation_listings SET barrier_category = 'education'
  WHERE slug IN (
    'higher-ed-online-access',
    'k12-digital-access'
  );

UPDATE litigation_listings SET barrier_category = 'employment'
  WHERE slug = 'eeoc-v-union-pacific-one-percent-rule';

UPDATE litigation_listings SET barrier_category = 'housing'
  WHERE slug = 'doj-v-anoka-crime-free-housing';

-- The DEMO row stays 'unassigned' on purpose — it is not a real matter
-- and must not appear under any category.

-- ─── Backfill: intake_status ─────────────────────────────────────────────
-- Default is 'none', so only the rows that are genuinely reachable need
-- a statement.
--
-- open: a person can join, claim, or be represented right now.
--   Bryant is the only one. Class certification is sought (not yet
--   granted) and Disability Rights Texas is taking intake.

UPDATE litigation_listings SET intake_status = 'open'
  WHERE slug = 'bryant-v-harris-county-mail-ballots';

-- mechanism: no intake, but a live path exists that a person can use.
--   Several of these are the settlement's OWN compliance mechanism
--   rather than its lawyers — a Philadelphian gets a curb ramp faster
--   through 311 than through class counsel, and counsel monitors 311
--   performance anyway.

UPDATE litigation_listings SET intake_status = 'mechanism'
  WHERE slug IN (
    'reynoldson-v-seattle-curb-ramps',          -- published class-member line
    'liberty-resources-v-philadelphia-sidewalks', -- city 311, per the settlement
    'united-spinal-v-nyc-sidewalks',            -- class counsel direct line + monitor
    'united-spinal-v-beth-israel-hospital',     -- hospital complaint process
    'nfb-ca-v-uber-service-animals',            -- monitoring inbox for denials
    'dunsmore-v-sd-county-jail-access',         -- claims still in active litigation
    'trivette-v-tn-doc-deaf-prisoners',         -- ongoing TDOC obligations
    'dra-v-first-urology-medical-equipment',    -- ongoing compliance obligations
    'eeoc-v-union-pacific-one-percent-rule',    -- counsel still taking individual claims
    'niles-v-hilton-bed-heights'                -- active matter, routed internally
  );

-- Everything else stays 'none'. That includes:
--   - the 10 pattern_of_practice rows (not cases; no counsel can exist)
--   - the DOJ enforcement actions and investigations (report to DOJ; it
--     does not represent individuals)
--   - Alcazar (claim window closed Oct 2025, settlement contested by DOJ)
--   - Disney (defendant prevailed on the large majority)
--   - the closed rows
