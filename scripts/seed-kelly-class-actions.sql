-- scripts/seed-kelly-class-actions.sql
--
-- Seeds 5 demo class action listings for the Kelly Brooks Simoneaux meeting
-- (The Spinal Cord Injury Law Firm). Listings target Kelly's known practice
-- areas: rideshare accessibility (her Wheel2Ride campaign), airline wheelchair
-- damage, paratransit / public transit, and Title II government web access.
--
-- Pattern matches migration 0001's seed approach: create a pilot-mode firm
-- under the adall org, then create one listing + one listing_config per
-- demo case. Listings published immediately so they surface on
-- /class-actions via v_active_listings.
--
-- Idempotent via slug-based ON CONFLICT and firm-name uniqueness check.
-- Safe to re-run.
--
-- To remove all of these demo rows later:
--   DELETE FROM listings WHERE law_firm_id = (
--     SELECT id FROM law_firms WHERE name = 'The Spinal Cord Injury Law Firm'
--   );
--   DELETE FROM law_firms WHERE name = 'The Spinal Cord Injury Law Firm';
--
-- ============================================================================

BEGIN;

-- 1. The law firm. Pilot mode so listings surface without a Stripe sub.
INSERT INTO law_firms (org_id, name, primary_contact, email, phone, status, is_pilot)
SELECT
  o.id,
  'The Spinal Cord Injury Law Firm',
  'Kelley Brooks Simoneaux',
  'info@spinalcordinjurylawyers.com',
  '1-877-724-3476',
  'active',
  true
FROM organizations o
WHERE o.org_code = 'adall'
  AND NOT EXISTS (
    SELECT 1 FROM law_firms WHERE name = 'The Spinal Cord Injury Law Firm'
  );

-- 2. Listings. One INSERT per case so each can be edited independently in
--    AdminListings. Listing configs follow the same shape as the existing
--    'hotel-accessible-room-fraud' seed.

-- ----------------------------------------------------------------------------
-- Case 1: Rideshare wheelchair & service-animal denial (Uber/Lyft pattern).
--         Kelly's Wheel2Ride campaign sits squarely on this.
-- ----------------------------------------------------------------------------
INSERT INTO listings (law_firm_id, title, slug, category, short_description, full_description, eligibility_summary, status, tier)
SELECT
  lf.id,
  'Rideshare wheelchair and service animal denials',
  'rideshare-disability-denial',
  'ada_title_iii',
  'Uber or Lyft denied you a ride, charged you extra, or refused to help with a wheelchair, scooter, or service animal.',
  'Under ADA Title III, rideshare companies cannot refuse rides to passengers with disabilities, deny access to passengers with service animals, or fail to assist with stowable wheelchairs and mobility devices the same way they would with luggage. The U.S. Department of Justice sued Uber in September 2025 over exactly these practices, and the court allowed that case to move forward in March 2026 (DOJ v. Uber Technologies Inc., N.D. Cal.). A separate class action (Lowell v. Lyft, S.D.N.Y.) targets the lack of wheelchair-accessible vehicles. This intake collects the facts needed to evaluate a potential class claim.',
  'If a rideshare driver canceled on you, refused service, or charged you extra because of a wheelchair, mobility aid, or service animal, you may qualify.',
  'published',
  'basic'
FROM law_firms lf
WHERE lf.name = 'The Spinal Cord Injury Law Firm'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO listing_configs (listing_id, case_description, eligibility_criteria, required_fields, disqualifying_conditions)
SELECT
  l.id,
  'Rideshare companies are public accommodations under ADA Title III. They must serve riders with disabilities on the same terms as everyone else, including allowing service animals in the vehicle and helping riders stow wheelchairs and mobility devices. Common patterns: drivers cancel as soon as they see a wheelchair, charge an unjustified cleaning fee for a service animal, ask for the animal''s "papers," push the rider to a higher-priced "pet" tier, or ignore stowable mobility devices while helping other riders with luggage. This intake captures one specific incident and confirms the pattern matches the active class theories.',
  '[
    {"kind": "required", "description": "You requested a ride from Uber, Lyft, or another rideshare company in the United States"},
    {"kind": "required", "description": "You have a disability and either use a wheelchair or other mobility device, travel with a service animal, or have another disability the driver could observe"},
    {"kind": "required", "description": "The driver canceled the ride, refused to take you, refused the service animal, refused to help with the mobility device, or charged you an extra fee tied to the disability"},
    {"kind": "preferred", "description": "You still have the ride confirmation, cancellation message, or receipt in the rideshare app"},
    {"kind": "preferred", "description": "The incident happened in the last 2 years"},
    {"kind": "disqualifying", "description": "You were outside the United States at the time of the ride request"}
  ]'::jsonb,
  '[
    {"name": "rideshare_company", "type": "string", "required": true, "description": "Which company: Uber, Lyft, or another rideshare service"},
    {"name": "incident_city", "type": "string", "required": true, "description": "City where the ride was requested"},
    {"name": "incident_state", "type": "string", "required": true, "description": "US state (2-letter code) where the ride was requested"},
    {"name": "incident_date", "type": "date", "required": true, "description": "Date the ride was requested or canceled"},
    {"name": "disability_type", "type": "free_text", "required": true, "description": "What disability or mobility device was involved (wheelchair, scooter, service animal, etc.)"},
    {"name": "what_happened", "type": "free_text", "required": true, "description": "In the user''s own words: what the driver did. Canceled? Refused? Demanded extra fee? Asked for papers?"},
    {"name": "has_app_record", "type": "yes_no", "required": true, "description": "Does the user still have the ride request, cancellation message, or receipt in the rideshare app?"},
    {"name": "extra_charge_amount", "type": "free_text", "required": false, "description": "If charged an extra fee, the dollar amount"}
  ]'::jsonb,
  '["Incident occurred outside the United States", "User does not have a disability", "The driver completed the ride without incident"]'::jsonb
FROM listings l WHERE l.slug = 'rideshare-disability-denial'
ON CONFLICT (listing_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Case 2: Airline wheelchair damage, delay, or loss.
--         Kelly's firm has a dedicated practice area page on this exact issue.
-- ----------------------------------------------------------------------------
INSERT INTO listings (law_firm_id, title, slug, category, short_description, full_description, eligibility_summary, status, tier)
SELECT
  lf.id,
  'Airline wheelchair damage, delay, or loss',
  'airline-wheelchair-damage',
  'ada_title_iii',
  'An airline damaged, lost, or delayed return of your wheelchair or mobility device on a flight to or from the United States.',
  'The Air Carrier Access Act (ACAA) and DOT''s wheelchair rule require airlines to handle mobility devices safely and return them undamaged. The DOT estimates airlines mishandle more than 11,500 wheelchairs each year — roughly 1 in 100 of every wheelchair or scooter checked on a domestic flight. Litigation over the scope of the wheelchair rule is ongoing in the Fifth Circuit (Airlines for America v. DOT, filed Feb 2025), and DOT has delayed enforcement of key provisions until December 2026. In the meantime, individual claims and putative class theories under state law remain viable. This intake captures the facts.',
  'If you flew with a wheelchair or scooter and the airline damaged, lost, or delayed returning it, you may qualify.',
  'published',
  'basic'
FROM law_firms lf
WHERE lf.name = 'The Spinal Cord Injury Law Firm'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO listing_configs (listing_id, case_description, eligibility_criteria, required_fields, disqualifying_conditions)
SELECT
  l.id,
  'Airlines must accept, transport, and return assistive devices in the condition they were received. When they fail — a wheelchair returned crushed, a scooter lost in transit, a device returned hours or days late — the passenger faces real harm: missed appointments, immobility, replacement costs that can exceed $30,000 for a power chair. This intake collects the airline, route, dates, and damage details needed to evaluate a potential claim and to map the incident onto active class theories.',
  '[
    {"kind": "required", "description": "You traveled on a commercial flight to, from, or within the United States"},
    {"kind": "required", "description": "You checked a wheelchair, scooter, or other assistive mobility device with the airline"},
    {"kind": "required", "description": "The airline returned it damaged, returned it late, lost it, or refused to accept it"},
    {"kind": "preferred", "description": "You filed a written complaint with the airline at the airport or shortly after"},
    {"kind": "preferred", "description": "You have photos of the damage or proof of the cost to repair or replace the device"},
    {"kind": "preferred", "description": "The incident happened in the last 2 years"},
    {"kind": "disqualifying", "description": "The flight was entirely outside the United States with no US connection"}
  ]'::jsonb,
  '[
    {"name": "airline_name", "type": "string", "required": true, "description": "Which airline (American, Delta, United, Southwest, JetBlue, or other)"},
    {"name": "flight_date", "type": "date", "required": true, "description": "Date of the affected flight"},
    {"name": "departure_airport", "type": "string", "required": true, "description": "Departure airport (3-letter code if known)"},
    {"name": "arrival_airport", "type": "string", "required": true, "description": "Arrival airport (3-letter code if known)"},
    {"name": "device_type", "type": "free_text", "required": true, "description": "What was damaged or delayed: manual wheelchair, power wheelchair, scooter, etc."},
    {"name": "what_went_wrong", "type": "free_text", "required": true, "description": "In the user''s own words: damaged, delayed return, lost, refused, etc."},
    {"name": "filed_complaint", "type": "yes_no", "required": true, "description": "Did the user file a written complaint with the airline?"},
    {"name": "has_photos", "type": "yes_no", "required": false, "description": "Does the user have photos of the damage?"},
    {"name": "estimated_loss", "type": "free_text", "required": false, "description": "Estimated cost to repair, replace, or rent a substitute device"}
  ]'::jsonb,
  '["Flight had no US departure, arrival, or connection", "Device was carried as cabin baggage and never checked", "User does not use a mobility device"]'::jsonb
FROM listings l WHERE l.slug = 'airline-wheelchair-damage'
ON CONFLICT (listing_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Case 3: Paratransit / public transit accessibility failures.
--         Kelly serves on the WMATA Accessibility Advisory Council.
-- ----------------------------------------------------------------------------
INSERT INTO listings (law_firm_id, title, slug, category, short_description, full_description, eligibility_summary, status, tier)
SELECT
  lf.id,
  'Paratransit no-shows and public transit lift failures',
  'paratransit-transit-failures',
  'ada_title_ii',
  'Your paratransit van did not show up, was hours late, or your local bus refused to deploy its wheelchair lift.',
  'ADA Title II requires public transit agencies to operate fixed-route lifts in working order and to provide paratransit service that is comparable to fixed-route service in response time, cost, and capacity. Class actions like ACLU/Western Law Center v. LA Metro and DOJ v. City of Jackson, MS have established the pattern: late or no-show vans, broken lifts, capacity-constraint denials. When a transit agency systematically fails to deliver, individual riders harmed in the same way may have a class claim.',
  'If your local public transit agency or its paratransit provider has stranded you, no-showed, or operated buses with broken lifts, you may qualify.',
  'published',
  'basic'
FROM law_firms lf
WHERE lf.name = 'The Spinal Cord Injury Law Firm'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO listing_configs (listing_id, case_description, eligibility_criteria, required_fields, disqualifying_conditions)
SELECT
  l.id,
  'Title II paratransit and fixed-route accessibility cases follow recurring patterns: paratransit vans that arrive hours late or never; trip denials when paratransit demand exceeds the agency''s plan; fixed-route buses passing wheelchair users because the lift is out of service. The ADA does not require perfection, but it does require that disabled riders are not denied comparable service. This intake captures one or more incidents and the agency involved, so the pattern can be matched to active or putative classes.',
  '[
    {"kind": "required", "description": "You ride or tried to ride a public transit system in the United States — fixed-route bus, light rail, or ADA paratransit"},
    {"kind": "required", "description": "You have a disability that affects your use of public transit"},
    {"kind": "required", "description": "The agency failed you: paratransit van no-show, hours-late pickup, denied trip, or a fixed-route bus passed you because of a broken lift"},
    {"kind": "preferred", "description": "The pattern has happened more than once, not just one isolated late ride"},
    {"kind": "preferred", "description": "You filed a complaint with the transit agency"},
    {"kind": "disqualifying", "description": "The transit provider is a private charter or out-of-country service"}
  ]'::jsonb,
  '[
    {"name": "agency_name", "type": "string", "required": true, "description": "Which transit agency (e.g. WMATA, LA Metro, NJ Transit, MARTA)"},
    {"name": "service_city", "type": "string", "required": true, "description": "City or metro area"},
    {"name": "service_state", "type": "string", "required": true, "description": "US state (2-letter code)"},
    {"name": "service_type", "type": "free_text", "required": true, "description": "Paratransit van, fixed-route bus, light rail, or other"},
    {"name": "incident_date", "type": "date", "required": true, "description": "Date of the most recent incident"},
    {"name": "what_happened", "type": "free_text", "required": true, "description": "In the user''s own words: no-show, late, broken lift, denied trip, etc."},
    {"name": "frequency", "type": "free_text", "required": true, "description": "Has this happened once, occasionally, or many times?"},
    {"name": "filed_complaint", "type": "yes_no", "required": false, "description": "Did the user file a complaint with the agency?"}
  ]'::jsonb,
  '["Service was a private bus, charter, or shuttle not subject to ADA Title II", "User does not have a disability"]'::jsonb
FROM listings l WHERE l.slug = 'paratransit-transit-failures'
ON CONFLICT (listing_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Case 4: Government website inaccessibility — Title II, April 2026 deadline.
--         The wave is coming and Ada is positioned to be the intake conveyor.
-- ----------------------------------------------------------------------------
INSERT INTO listings (law_firm_id, title, slug, category, short_description, full_description, eligibility_summary, status, tier)
SELECT
  lf.id,
  'State and local government websites that are not accessible',
  'government-website-inaccessible',
  'ada_title_ii',
  'A city, county, or state government website or app blocked you from doing something you needed to do because of a disability.',
  'DOJ''s 2024 Title II rule requires state and local governments to make their websites and mobile apps conform to WCAG 2.1 AA. The first compliance deadline (April 24, 2026) covers public entities serving populations of 50,000 or more; smaller entities follow in April 2027. Public entities that miss the deadline face direct exposure under the rule, and individual users denied equal access may have claims. Common failures: applying for benefits, paying taxes or fines, viewing election or court information, or accessing emergency notices through a site that does not work with a screen reader, keyboard navigation, or other assistive technology.',
  'If a government website or app would not work with your screen reader, keyboard, or other assistive technology, and you could not complete what you needed to do, you may qualify.',
  'published',
  'basic'
FROM law_firms lf
WHERE lf.name = 'The Spinal Cord Injury Law Firm'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO listing_configs (listing_id, case_description, eligibility_criteria, required_fields, disqualifying_conditions)
SELECT
  l.id,
  'Title II of the ADA requires state and local governments to provide equal access to programs, services, and activities. The 2024 DOJ rule applies that to digital surfaces — websites, mobile apps, and online services — and adopts WCAG 2.1 AA as the technical standard. The April 24, 2026 deadline for entities of 50,000+ creates a clean cutoff: a public entity that has not made its site conformant by that date is exposed. This intake captures the specific service the user could not access and what assistive technology was involved.',
  '[
    {"kind": "required", "description": "You tried to use a website or mobile app operated by a state or local government in the United States"},
    {"kind": "required", "description": "You have a disability and use assistive technology (screen reader, keyboard navigation, voice control, screen magnifier, etc.) or otherwise need an accessible site"},
    {"kind": "required", "description": "The site or app prevented you from completing the task — applying for a benefit, paying a bill, finding information, etc."},
    {"kind": "preferred", "description": "You can name the specific page or feature that did not work"},
    {"kind": "preferred", "description": "The agency serves a population of 50,000 or more (city, county, or state-level)"},
    {"kind": "disqualifying", "description": "The site is operated by a private business (this would be Title III, not Title II)"},
    {"kind": "disqualifying", "description": "The site is operated by the federal government (covered by Section 508, different rules)"}
  ]'::jsonb,
  '[
    {"name": "agency_name", "type": "string", "required": true, "description": "Name of the government agency (e.g. City of Phoenix, Maricopa County, State of Arizona DMV)"},
    {"name": "agency_state", "type": "string", "required": true, "description": "US state (2-letter code) where the agency operates"},
    {"name": "website_or_app", "type": "string", "required": true, "description": "URL of the website or name of the app"},
    {"name": "task_attempted", "type": "free_text", "required": true, "description": "What the user was trying to do (apply for SNAP, pay parking ticket, look up election info, etc.)"},
    {"name": "assistive_technology", "type": "free_text", "required": true, "description": "What assistive technology was being used (JAWS, NVDA, VoiceOver, keyboard only, screen magnifier, etc.)"},
    {"name": "what_failed", "type": "free_text", "required": true, "description": "In the user''s own words: what part of the site or app failed and how"},
    {"name": "incident_date", "type": "date", "required": true, "description": "Date of the most recent attempt"},
    {"name": "task_completed_offline", "type": "yes_no", "required": false, "description": "Was the user able to complete the task another way (in person, by phone)?"}
  ]'::jsonb,
  '["Site is operated by a private business", "Site is operated by a federal agency", "User did not actually attempt to use the site"]'::jsonb
FROM listings l WHERE l.slug = 'government-website-inaccessible'
ON CONFLICT (listing_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Case 5: Hotel accessibility (placeholder retained from migration 0001 was
-- already created on the Desert firm — duplicate skipped here).
-- Instead, case 5 = retail website inaccessibility (Title III, Fashion Nova
-- pattern). This rounds out the demo with a non-mobility, vision-disability
-- example so Kelly sees the platform spans the disability community broadly.
-- ----------------------------------------------------------------------------
INSERT INTO listings (law_firm_id, title, slug, category, short_description, full_description, eligibility_summary, status, tier)
SELECT
  lf.id,
  'Retail websites that are not accessible to screen readers',
  'retail-website-screenreader',
  'ada_title_iii',
  'A retail or e-commerce website would not work with your screen reader, so you could not shop, check out, or use the same offers as everyone else.',
  'Most courts treat retail websites as places of public accommodation under ADA Title III, especially when the site is connected to a physical store or to goods sold to the public. When a site''s checkout flow, product images, or promo codes are not exposed to screen readers, blind and low-vision shoppers are blocked from the same goods at the same prices everyone else gets. Class actions in this space are abundant — Alcazar v. Fashion Nova (N.D. Cal.) reached a proposed $5.15M settlement in early 2026 — and most resolve without trial. This intake captures the specific store and the specific failure.',
  'If you are blind or have low vision and a retail website blocked you from shopping or checking out, you may qualify.',
  'published',
  'basic'
FROM law_firms lf
WHERE lf.name = 'The Spinal Cord Injury Law Firm'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO listing_configs (listing_id, case_description, eligibility_criteria, required_fields, disqualifying_conditions)
SELECT
  l.id,
  'Title III website accessibility cases focus on whether a public-facing commercial site provides equal access to people who use screen readers and other assistive technologies. Common failures: product images without alt text, form fields without labels, checkout flows that lose focus, promo codes that cannot be applied without a mouse, and modal dialogs that trap or lose keyboard focus. This intake captures the store, the page, the assistive technology, and the specific point in the flow where the user was blocked.',
  '[
    {"kind": "required", "description": "You tried to use a retail or e-commerce website operated by a US business"},
    {"kind": "required", "description": "You are blind, have low vision, or otherwise rely on a screen reader, magnifier, or keyboard navigation"},
    {"kind": "required", "description": "The site blocked you at a specific point: browsing, adding to cart, applying a promo, checking out, or completing payment"},
    {"kind": "preferred", "description": "You can name the specific page or step where the failure occurred"},
    {"kind": "preferred", "description": "You either tried to complete the purchase another way or gave up entirely"},
    {"kind": "disqualifying", "description": "The site is operated entirely outside the United States"}
  ]'::jsonb,
  '[
    {"name": "retailer_name", "type": "string", "required": true, "description": "Name of the retailer or store"},
    {"name": "website_url", "type": "string", "required": true, "description": "URL of the website"},
    {"name": "assistive_technology", "type": "free_text", "required": true, "description": "What assistive technology was being used (JAWS, NVDA, VoiceOver, screen magnifier, keyboard only, etc.)"},
    {"name": "what_failed", "type": "free_text", "required": true, "description": "In the user''s own words: what page, what step, and what went wrong"},
    {"name": "incident_date", "type": "date", "required": true, "description": "Date of the most recent attempt"},
    {"name": "purchase_completed", "type": "yes_no", "required": true, "description": "Was the user eventually able to complete the purchase?"}
  ]'::jsonb,
  '["Site is operated entirely outside the United States", "User was not actually using assistive technology", "User had no intent to complete a purchase or use the site as a customer"]'::jsonb
FROM listings l WHERE l.slug = 'retail-website-screenreader'
ON CONFLICT (listing_id) DO NOTHING;

COMMIT;

-- Verify
SELECT
  l.title,
  l.slug,
  l.category,
  l.status,
  lf.name AS firm_name,
  lf.is_pilot
FROM listings l
JOIN law_firms lf ON lf.id = l.law_firm_id
WHERE lf.name = 'The Spinal Cord Injury Law Firm'
ORDER BY l.created_at;
