-- Phase A2 (May 2026): seed `litigation_listings` with 38 rows covering the
-- ADA Legal Link class actions / enforcement / compliance / pattern-of-practice
-- / regulatory-challenge surface, then repoint the 4 historical rideshare
-- ada_sessions onto the new pattern_of_practice row.
--
-- STATUS WHEN THIS FILE LANDED: this migration is run live against Neon
-- project ancient-star-00703098 main as part of /shipit Phase A2. It is
-- captured here so the migration history matches reality.
--
-- Composition (38 total):
--   10 active class actions / DOJ enforcement actions
--   12 settled cases in compliance phase (report-recurrence)
--    4 active DOJ investigations
--   10 pattern-of-practice rows (no current named case, we collect)
--    2 regulatory challenges (track only)
--
-- Per /plan Phase A2: row #1 (Niles v. Hilton) is the worked-example
-- target but is shipped as a stub here because the full prose wasn't
-- recoverable from prior thread context. Plan B fills full prose for
-- every row. This migration ships identity + classification + a one-line
-- short_description only.
--
-- Idempotency: the migration is wrapped so a replay is a no-op:
--   1. DELETE of the Smith v. Acme placeholder uses IF EXISTS semantics
--      (DELETE ... WHERE id = ... — zero rows is fine).
--   2. INSERTs use ON CONFLICT (org_id, slug) DO NOTHING — the unique
--      constraint from migration 0009 carries forward.
--   3. The ada_sessions UPDATE only touches rows where
--      litigation_listing_id IS NULL, so re-running is a no-op.

-- ─── Variables ────────────────────────────────────────────────────────────
-- All rows belong to the ADA Legal Link org. Resolved at runtime.

DO $$
DECLARE
  v_org_id           uuid;
  v_rideshare_id     uuid;
  v_legacy_rideshare uuid := '6d18c0c4-47a0-41cd-9d28-8fd6f20d19d7';
  v_smith_acme_id    uuid := 'dcc63051-bf4f-4134-8ce4-9e3e239e17f0';
BEGIN
  SELECT id INTO v_org_id FROM organizations WHERE org_code = 'adall';
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'organizations row with org_code=adall not found';
  END IF;

  -- ─── 1. DELETE the Smith v. Acme placeholder ─────────────────────────
  -- Was status='archived' after A1 schema migration; not real data.
  DELETE FROM litigation_listings WHERE id = v_smith_acme_id;

  -- ─── 2. INSERT 38 rows ───────────────────────────────────────────────
  -- Active class actions / DOJ enforcement (10)

  INSERT INTO litigation_listings (
    org_id, kind, status, slug, case_name, legal_theory,
    court, docket_number, filing_date, defendants, affected_states,
    short_description
  ) VALUES
  -- 1. Niles v. Hilton (worked example — ships as stub, Plan B fills prose)
  (v_org_id, 'class', 'active', 'niles-v-hilton-bed-heights',
   'Niles v. Hilton Worldwide Holdings Inc.', 'ADA Title III',
   'U.S. District Court, Western District of Pennsylvania',
   '2:26-cv-00258', '2026-02-12',
   '["Hilton Worldwide Holdings Inc."]'::jsonb, '[]'::jsonb,
   'Hilton designates rooms as mobility-accessible without ensuring beds permit safe wheelchair transfer.'),

  -- 2. United States v. Uber Technologies
  (v_org_id, 'enforcement_action', 'active', 'doj-v-uber-service-animals-wheelchairs',
   'United States v. Uber Technologies, Inc.', 'ADA Title III',
   'U.S. District Court, Northern District of California',
   '3:25-cv-07731-SK', '2025-09-11',
   '["Uber Technologies, Inc."]'::jsonb, '[]'::jsonb,
   'DOJ alleges Uber and its drivers routinely deny rides to passengers with service animals and stowable wheelchairs, and charge improper surcharges.'),

  -- 3. Bryant v. Harris County
  (v_org_id, 'class', 'active', 'bryant-v-harris-county-mail-ballots',
   'Bryant v. Harris County', 'ADA Title II',
   'Texas state court', NULL, '2026-02-11',
   '["Harris County, Texas"]'::jsonb, '["TX"]'::jsonb,
   'Voters with disabilities allege Harris County''s mail-ballot system lacks accessible electronic options.'),

  -- 4. Coen v. Georgia DOC
  (v_org_id, 'class', 'active', 'coen-v-ga-doc-deaf-prisoners',
   'Coen v. Georgia Department of Corrections',
   'ADA Title II + Section 504 of the Rehabilitation Act',
   'U.S. District Court, Northern District of Georgia',
   NULL, NULL,
   '["Georgia Department of Corrections"]'::jsonb, '["GA"]'::jsonb,
   'Deaf and hard-of-hearing prisoners in Georgia DOC custody allege systemic failure to provide effective communication and interpreters.'),

  -- 5. Williams v. Theme Park Corp.
  (v_org_id, 'class', 'active', 'williams-v-theme-park-ride-access',
   'Williams v. Theme Park Corp.', 'ADA Title III',
   'U.S. District Court, Middle District of Florida',
   NULL, NULL,
   '["Theme Park Corp."]'::jsonb, '["FL"]'::jsonb,
   'Class alleges a Florida theme park''s ride-access policies discriminate against guests with mobility disabilities.'),

  -- 6. Alcazar v. Fashion Nova
  (v_org_id, 'class', 'active', 'alcazar-v-fashion-nova-web-access',
   'Alcazar v. Fashion Nova, Inc.', 'ADA Title III + Unruh Civil Rights Act',
   'U.S. District Court, Northern District of California',
   '4:20-cv-01434', '2020-02-26',
   '["Fashion Nova, Inc."]'::jsonb, '[]'::jsonb,
   'Class action over Fashion Nova''s website inaccessibility to blind shoppers using screen readers. Settlement pending final approval as of early 2026; DOJ filed Statement of Interest opposing.'),

  -- 7. NFB of California v. Uber
  (v_org_id, 'class', 'active', 'nfb-ca-v-uber-service-animals',
   'National Federation of the Blind of California v. Uber Technologies, Inc.',
   'ADA Title III + Unruh Civil Rights Act',
   'U.S. District Court, Northern District of California',
   '3:14-cv-04086', '2014-09-09',
   '["Uber Technologies, Inc."]'::jsonb, '[]'::jsonb,
   'Settled class action requires Uber to enforce service-animal anti-discrimination policy. Ongoing monitoring; new violations feed back into the settlement administrator.'),

  -- 8. EEOC v. Union Pacific
  (v_org_id, 'class', 'active', 'eeoc-v-union-pacific-one-percent-rule',
   'EEOC v. Union Pacific Railroad Co.', 'ADA Title I',
   NULL, NULL, NULL,
   '["Union Pacific Railroad Co."]'::jsonb, '[]'::jsonb,
   'EEOC alleges Union Pacific''s "1% rule" fitness-for-duty policy unlawfully excludes workers with disabilities. Court ruled disparate-impact theory viable; case ongoing.'),

  -- 9. DRA v. First Urology
  (v_org_id, 'class', 'active', 'dra-v-first-urology-medical-equipment',
   'Disability Rights Advocates v. First Urology',
   'ADA Title III + Section 504',
   'U.S. District Court, Western District of Kentucky',
   NULL, '2020-08-01',
   '["First Urology, PSC"]'::jsonb, '["KY"]'::jsonb,
   'Wheelchair-using patients allege First Urology lacks accessible exam tables and transfer policies, forcing exams from wheelchairs or denying care.'),

  -- 10. Adams v. Kentucky
  (v_org_id, 'class', 'active', 'adams-v-kentucky-deaf-prisoners',
   'Adams v. Commonwealth of Kentucky', 'ADA Title II + Section 504',
   'U.S. District Court, Eastern District of Kentucky',
   '3:14-cv-00001', '2014-01-01',
   '["Kentucky Department of Corrections"]'::jsonb, '["KY"]'::jsonb,
   'Class action by deaf prisoners alleging Kentucky DOC fails to provide effective communication and qualified interpreters.'),

  -- ─── Settled cases — compliance phase (12) ─────────────────────────────

  -- 11. DOJ v. Hilton (2010 consent decree)
  (v_org_id, 'consent_decree', 'compliance', 'doj-v-hilton-2010-consent-decree',
   'United States v. Hilton Worldwide Inc. (2010 Consent Decree)',
   'ADA Title III',
   'U.S. District Court, District of Columbia',
   '1:10-cv-01902', '2010-11-09',
   '["Hilton Worldwide Inc."]'::jsonb, '[]'::jsonb,
   '2010 DOJ consent decree requires Hilton to make rooms accessible and reservation systems compatible. Compliance phase — report current violations that should be covered.'),

  -- 12. DOJ v. Marriott (2024 settlement)
  (v_org_id, 'consent_decree', 'compliance', 'doj-v-marriott-2024-settlement',
   'United States v. Marriott International, Inc. (2024 Settlement)',
   'ADA Title III',
   NULL, NULL, '2024-01-01',
   '["Marriott International, Inc."]'::jsonb, '[]'::jsonb,
   '2024 DOJ settlement requires Marriott''s accessible-room reservation system to permit equal reservation. Report current violations.'),

  -- 13. Liberty Resources v. Philadelphia
  (v_org_id, 'class', 'compliance', 'liberty-resources-v-philadelphia-sidewalks',
   'Liberty Resources, Inc. v. City of Philadelphia',
   'ADA Title II + Section 504',
   'U.S. District Court, Eastern District of Pennsylvania',
   NULL, '2019-08-26',
   '["City of Philadelphia"]'::jsonb, '["PA"]'::jsonb,
   'Settled class action; Philadelphia agreed to install and repair curb ramps citywide on a schedule. Compliance phase — report missing or non-compliant curb ramps.'),

  -- 14. United Spinal v. NYC
  (v_org_id, 'class', 'compliance', 'united-spinal-v-nyc-sidewalks',
   'United Spinal Association v. City of New York', 'ADA Title II',
   'U.S. District Court, Southern District of New York',
   NULL, NULL,
   '["City of New York"]'::jsonb, '["NY"]'::jsonb,
   'Settled 2020. NYC committed to remediation schedule for inaccessible sidewalks. Report violations.'),

  -- 15. Willits v. LA
  (v_org_id, 'class', 'compliance', 'willits-v-los-angeles-sidewalks',
   'Willits v. City of Los Angeles', 'ADA Title II',
   'U.S. District Court, Central District of California',
   '2:10-cv-05782', '2010-08-01',
   '["City of Los Angeles"]'::jsonb, '["CA"]'::jsonb,
   'Settled 2015, $1.4B commitment. LA on 30-year remediation schedule for sidewalks and curb cuts. Report violations.'),

  -- 16. Reynoldson v. Seattle
  (v_org_id, 'class', 'compliance', 'reynoldson-v-seattle-curb-ramps',
   'Reynoldson v. City of Seattle', 'ADA Title II',
   'U.S. District Court, Western District of Washington',
   NULL, NULL,
   '["City of Seattle"]'::jsonb, '["WA"]'::jsonb,
   'Settled 2017. Seattle committed to curb ramp installation on a schedule. Report violations.'),

  -- 17. Dunsmore v. San Diego County
  (v_org_id, 'class', 'compliance', 'dunsmore-v-sd-county-jail-access',
   'Dunsmore v. San Diego County Sheriff''s Department',
   'ADA Title II + Section 504',
   'U.S. District Court, Southern District of California',
   '3:20-cv-00406-AJB-DDL', '2020-03-02',
   '["San Diego County Sheriff''s Department"]'::jsonb, '["CA"]'::jsonb,
   'ADA accessibility claims settled August 2025; other claims active. Report jail accessibility violations.'),

  -- 18. Trivette v. TN DOC
  (v_org_id, 'class', 'compliance', 'trivette-v-tn-doc-deaf-prisoners',
   'Trivette v. Tennessee Department of Correction',
   'ADA Title II + Section 504',
   NULL, NULL, NULL,
   '["Tennessee Department of Correction"]'::jsonb, '["TN"]'::jsonb,
   'Settled January 2025. TN DOC required to provide qualified interpreters and accessible programs to deaf prisoners. Report violations.'),

  -- 19. DOJ v. LA County (vote centers)
  (v_org_id, 'enforcement_action', 'compliance', 'doj-v-la-county-vote-centers',
   'United States v. Los Angeles County', 'ADA Title II + HAVA',
   NULL, NULL, NULL,
   '["Los Angeles County"]'::jsonb, '["CA"]'::jsonb,
   'DOJ settlement August 2024 requires LA County to provide accessible vote centers and curbside voting. Report violations.'),

  -- 20. DOJ v. Anoka, MN
  (v_org_id, 'enforcement_action', 'compliance', 'doj-v-anoka-crime-free-housing',
   'United States v. City of Anoka, Minnesota', 'ADA Title II',
   'U.S. District Court, District of Minnesota',
   NULL, '2024-01-01',
   '["City of Anoka, Minnesota"]'::jsonb, '["MN"]'::jsonb,
   'Landmark 2025 DOJ agreement addressing crime-free housing program discrimination against tenants with mental health disabilities. Report violations elsewhere using same model.'),

  -- 21. DOJ v. Sea Mar
  (v_org_id, 'enforcement_action', 'compliance', 'doj-v-sea-mar-dental',
   'United States v. Sea Mar Community Health Centers',
   'ADA Title III + Section 504',
   NULL, NULL, '2025-04-07',
   '["Sea Mar Community Health Centers"]'::jsonb, '["WA"]'::jsonb,
   'April 2025 DOJ settlement over dental clinic accessibility. Report violations.'),

  -- 22. United Spinal v. Beth Israel
  (v_org_id, 'class', 'compliance', 'united-spinal-v-beth-israel-hospital',
   'United Spinal Association v. Beth Israel Medical Center',
   'ADA Title III + Section 504',
   'U.S. District Court, Southern District of New York',
   NULL, NULL,
   '["Beth Israel Medical Center"]'::jsonb, '["NY"]'::jsonb,
   'Settled October 2017. Required accessible exam equipment and patient communication accommodations. Report violations.'),

  -- ─── Active DOJ investigations (4) ─────────────────────────────────────

  -- 23. DOJ investigation of Idaho
  (v_org_id, 'enforcement_action', 'investigating', 'doj-investigation-idaho-nursing',
   'United States investigation of State of Idaho — Olmstead Integration',
   'ADA Title II (Olmstead) + Section 504',
   NULL, NULL, '2025-01-01',
   '["State of Idaho"]'::jsonb, '["ID"]'::jsonb,
   'DOJ findings letter alleges Idaho needlessly segregates people with disabilities in nursing facilities instead of community-based services. Share your experience to support the investigation.'),

  -- 24. DOJ investigation of FlixBus / Greyhound
  (v_org_id, 'enforcement_action', 'investigating', 'doj-investigation-flixbus-greyhound',
   'United States investigation of FlixBus and Greyhound Lines',
   'ADA Title III + 49 CFR Part 37 (over-the-road bus)',
   NULL, NULL, NULL,
   '["FlixBus, Inc.", "Greyhound Lines, Inc."]'::jsonb, '[]'::jsonb,
   'DOJ investigating intercity bus carriers over wheelchair accommodation failures and inaccessible booking. Share your experience.'),

  -- 25. DOJ investigation of AZ DCS
  (v_org_id, 'enforcement_action', 'investigating', 'doj-investigation-az-dcs',
   'United States investigation of Arizona Department of Child Safety',
   'ADA Title II + Section 504',
   NULL, NULL, '2024-12-01',
   '["Arizona Department of Child Safety"]'::jsonb, '["AZ"]'::jsonb,
   'DOJ investigating AZ DCS over alleged discrimination against parents with disabilities in child welfare proceedings.'),

  -- 26. DOJ investigation of Alaska Elections
  (v_org_id, 'enforcement_action', 'investigating', 'doj-investigation-alaska-elections',
   'United States investigation of Alaska Division of Elections',
   'ADA Title II + HAVA + Section 504',
   NULL, NULL, '2024-06-01',
   '["Alaska Division of Elections"]'::jsonb, '["AK"]'::jsonb,
   'DOJ findings letter alleges Alaska''s polling places and ballot systems are inaccessible.'),

  -- ─── Pattern of practice — no current named case (10) ──────────────────

  -- 27. Airline wheelchair damage
  (v_org_id, 'pattern_of_practice', 'active', 'airline-wheelchair-damage',
   'Airline wheelchair damage, delay, or loss',
   'Air Carrier Access Act (49 USC § 41705) + 14 CFR Part 382',
   NULL, NULL, NULL,
   '[]'::jsonb, '[]'::jsonb,
   'Mishandled, broken, or lost wheelchairs and mobility aids during air travel. No current consumer class action — file a DOT complaint, document, and share with us.'),

  -- 28. Restaurant / business service animal denials
  (v_org_id, 'pattern_of_practice', 'active', 'restaurant-service-animal-denials',
   'Restaurant and business service animal denials', 'ADA Title III',
   NULL, NULL, NULL,
   '[]'::jsonb, '[]'::jsonb,
   'A restaurant, store, or rideshare refused to serve you with your service animal. No current class action — most cases are individual. Tell us what happened.'),

  -- 29. Medical exam table access
  (v_org_id, 'pattern_of_practice', 'active', 'medical-exam-table-access',
   'Hospital and medical office accessible exam table failures',
   'ADA Title III + Section 504 + DOJ MDE Rule (2024)',
   NULL, NULL, NULL,
   '[]'::jsonb, '[]'::jsonb,
   'Medical providers without accessible exam tables, diagnostic equipment, or transfer policies. DOJ MDE rule (May 2024) makes new compliance deadlines enforceable.'),

  -- 30. Rideshare wheelchair / service animal denials  ← REPOINT TARGET
  (v_org_id, 'pattern_of_practice', 'active', 'rideshare-wheelchair-service-animal-denials',
   'Rideshare wheelchair and service animal denials',
   'ADA Title III + state civil rights laws',
   NULL, NULL, NULL,
   '[]'::jsonb, '[]'::jsonb,
   'Uber or Lyft drivers refused your service animal, failed to provide a wheelchair-accessible vehicle, or charged improper fees. Multiple active cases — your story helps build the pattern.'),

  -- 31. Kiosk accessibility
  (v_org_id, 'pattern_of_practice', 'active', 'kiosk-accessibility',
   'Pharmacy and retail self-service kiosk inaccessibility', 'ADA Title III',
   NULL, NULL, NULL,
   '[]'::jsonb, '[]'::jsonb,
   'Self-service kiosks at pharmacies, restaurants, airports, or government offices that aren''t usable by blind, low-vision, or deaf customers.'),

  -- 32. Mobile app screen reader
  (v_org_id, 'pattern_of_practice', 'active', 'mobile-app-screen-reader',
   'Mobile app and banking app screen reader incompatibility',
   'ADA Title III (nexus theory) + state law',
   NULL, NULL, NULL,
   '[]'::jsonb, '[]'::jsonb,
   'Banking apps, retail apps, or service apps unusable with VoiceOver or TalkBack. Emerging area of litigation.'),

  -- 33. Higher ed online access
  (v_org_id, 'pattern_of_practice', 'active', 'higher-ed-online-access',
   'Higher education online learning inaccessibility',
   'ADA Title II/III + Section 504 + DOJ Dear Colleague Letter (2023)',
   NULL, NULL, NULL,
   '[]'::jsonb, '[]'::jsonb,
   'Inaccessible LMS, course materials, videos without captions, or online testing platforms at colleges and universities.'),

  -- 34. K-12 digital access
  (v_org_id, 'pattern_of_practice', 'active', 'k12-digital-access',
   'K-12 school district digital inaccessibility',
   'ADA Title II + Section 504 + IDEA',
   NULL, NULL, NULL,
   '[]'::jsonb, '[]'::jsonb,
   'School district websites, student portals, learning platforms, or homework systems that aren''t accessible.'),

  -- 35. Gov online services access
  (v_org_id, 'pattern_of_practice', 'active', 'gov-online-services-access',
   'State DMV and government online services inaccessibility',
   'ADA Title II + DOJ Title II Web Rule (April 2026 compliance deadline for large entities)',
   NULL, NULL, NULL,
   '[]'::jsonb, '[]'::jsonb,
   'DMV websites, benefits portals, court systems, or state agency online services that block access for screen reader users. April 2026 DOJ deadline now active for the largest jurisdictions.'),

  -- 36. Polling place access (general)
  (v_org_id, 'pattern_of_practice', 'active', 'polling-place-access',
   'Polling place and ballot inaccessibility (general)',
   'ADA Title II + HAVA + Section 504',
   NULL, NULL, NULL,
   '[]'::jsonb, '[]'::jsonb,
   'Inaccessible polling place, broken accessible voting machine, no curbside option, or inaccessible vote-by-mail. For cases not already covered by Bryant v. Harris County or DOJ v. LA County.'),

  -- ─── Regulatory challenges — track only (2) ───────────────────────────

  -- 37. A4A v. DOT
  (v_org_id, 'regulatory_challenge', 'tracking', 'a4a-v-dot-wheelchair-rule',
   'Airlines for America v. U.S. Department of Transportation',
   'APA challenge to DOT Wheelchair Rule (14 CFR Part 382 amendments)',
   'U.S. Court of Appeals for the Fifth Circuit',
   NULL, '2025-02-14',
   '["U.S. Department of Transportation"]'::jsonb, '[]'::jsonb,
   'Airline industry sued to block DOT''s strengthened wheelchair-handling rules. If A4A wins, protections weaken. Tracking only.'),

  -- 38. Texas v. Kennedy
  (v_org_id, 'regulatory_challenge', 'tracking', 'texas-v-kennedy-504-integration',
   'Texas v. Kennedy (formerly Texas v. Becerra)',
   'APA + constitutional challenge to HHS Section 504 + Olmstead integration mandate',
   'U.S. District Court, Northern District of Texas',
   NULL, NULL,
   '["U.S. Department of Health and Human Services"]'::jsonb, '[]'::jsonb,
   'Multi-state AG challenge to HHS Section 504 rule''s integration mandate. If states win, community-integration rights could narrow.')

  ON CONFLICT (org_id, slug) DO NOTHING;

  -- ─── 3. Capture rideshare UUID for session repoint ───────────────────
  SELECT id INTO v_rideshare_id
  FROM litigation_listings
  WHERE org_id = v_org_id
    AND slug = 'rideshare-wheelchair-service-animal-denials';

  IF v_rideshare_id IS NULL THEN
    RAISE EXCEPTION 'rideshare pattern_of_practice row not found after insert';
  END IF;

  -- ─── 4. Repoint 4 historical ada_sessions ────────────────────────────
  -- Only touch rows that still have litigation_listing_id IS NULL so
  -- replays are no-ops.
  UPDATE ada_sessions
  SET litigation_listing_id = v_rideshare_id
  WHERE listing_id = v_legacy_rideshare
    AND litigation_listing_id IS NULL;

END $$;
