-- Who to contact about a case. Additive, replayable.
--
-- The outbound research behind this looked up all 39 litigation records
-- and found two things the existing model could not hold.
--
-- First, most contacts are not law firms in our system. Of 39 records,
-- 30 route to a settlement administrator, the DOJ, a state protection &
-- advocacy agency, a city 311 line, or a hospital's own complaint
-- process. `law_firms` is the wrong home for those: it carries
-- stripe_customer_id, is_pilot and accepting_referrals, and it feeds
-- isFirmEligible. Storing CPT Group there would make a settlement
-- administrator routable, which is a correctness problem, not a tidiness
-- one.
--
-- Second, contacts are many-per-case. Bryant has two co-counsel,
-- Dunsmore three, the Uber settlement four. Columns on
-- litigation_listings would drop exactly the cases that matter most.
--
-- scope_note is NOT NULL and that is the point of the table.
-- Nearly every contact is bounded to a place: Reynoldson's line covers
-- Seattle, Willits covers Los Angeles city limits, Bryant covers Harris
-- County. The directory shows a case to everyone regardless of where
-- they are, so a contact that cannot say who it serves must not be
-- storable. A false alarm sends a self-represented person chasing
-- nothing, which is its own kind of harm.
--
-- intake_open defaults to false. Most of these monitor a settlement or
-- take government complaints rather than accept clients, so a contact
-- can only claim to be open if a human said so.
--
-- Ref: /plan litigation-taxonomy-and-contacts, Phase 3.

CREATE TABLE IF NOT EXISTS litigation_contacts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid NOT NULL REFERENCES organizations(id),
  litigation_listing_id uuid NOT NULL
                          REFERENCES litigation_listings(id) ON DELETE CASCADE,
  contact_kind          text NOT NULL,
  org_name              text NOT NULL,
  person_name           text,
  phone                 text,
  tty                   text,
  email                 text,
  url                   text,
  address               text,
  scope_note            text NOT NULL,
  intake_open           boolean NOT NULL DEFAULT false,
  display_order         integer NOT NULL DEFAULT 0,
  verified_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE litigation_contacts
  DROP CONSTRAINT IF EXISTS litigation_contacts_kind_check;
ALTER TABLE litigation_contacts
  ADD CONSTRAINT litigation_contacts_kind_check
  CHECK (contact_kind IN (
    'class_counsel',            -- the lawyers who ran or are running it
    'settlement_administrator', -- claims processing, e.g. CPT Group
    'government_agency',        -- DOJ, DOT, EEOC, ED-OCR, HUD
    'state_pa',                 -- state protection & advocacy; these DO take intake
    'referral_firm',            -- taking related work, not counsel of record
    'defendant_process'         -- the settlement's own mechanism, e.g. city 311
  ));

-- Belt and braces on the guardrail: NOT NULL alone would accept ''.
ALTER TABLE litigation_contacts
  DROP CONSTRAINT IF EXISTS litigation_contacts_scope_note_check;
ALTER TABLE litigation_contacts
  ADD CONSTRAINT litigation_contacts_scope_note_check
  CHECK (length(btrim(scope_note)) > 0);

CREATE INDEX IF NOT EXISTS litigation_contacts_listing
  ON litigation_contacts (litigation_listing_id, display_order);

-- ─── Seed: the verified contacts ─────────────────────────────────────────
--
-- Only what was confirmed against a primary source. Where a phone number
-- could not be verified it is left null and the website carries the
-- contact instead — an invented number is worse than none.
--
-- Replayable: keyed on (listing, org_name), which the ON CONFLICT-free
-- NOT EXISTS guard below makes safe to run twice.

INSERT INTO litigation_contacts
  (org_id, litigation_listing_id, contact_kind, org_name, person_name,
   phone, tty, email, url, address, scope_note, intake_open, display_order,
   verified_at)
SELECT l.org_id, l.id, v.contact_kind, v.org_name, v.person_name,
       v.phone, v.tty, v.email, v.url, v.address, v.scope_note,
       v.intake_open, v.display_order, now()
FROM (VALUES
  -- Bryant v. Harris County — the closest thing to a joinable case we have.
  ('bryant-v-harris-county-mail-ballots', 'class_counsel',
   'Disability Rights Texas', NULL,
   '1-800-252-9108', '1-866-362-2851', NULL, 'https://intake.DRTx.org', NULL,
   'For registered Harris County, Texas voters who are blind or cannot read or mark a paper ballot. Texas''s protection and advocacy agency; they take intake directly.',
   true, 1),
  ('bryant-v-harris-county-mail-ballots', 'referral_firm',
   'Brown, Goldstein & Levy LLP', NULL,
   NULL, NULL, NULL, 'https://browngold.com', NULL,
   'Co-counsel on this case with Disability Rights Texas. Same Harris County voters.',
   false, 2),

  -- NFB v. Uber — a live inbox for reporting denials, years after settlement.
  ('nfb-ca-v-uber-service-animals', 'class_counsel',
   'Disability Rights Advocates', 'Melissa Riess',
   '(510) 665-8644', NULL, 'mriess@dralegal.org', 'https://dralegal.org', NULL,
   'Anywhere in the US, for blind riders travelling with a service animal who were refused an Uber. Report the denial to Uber as well.',
   true, 1),
  ('nfb-ca-v-uber-service-animals', 'class_counsel',
   'Rosen Bien Galvan & Grunfeld LLP', NULL,
   '(415) 433-6830', NULL, NULL, 'https://rbgg.com', '101 Mission Street, 6th Floor, San Francisco, CA 94105',
   'Co-counsel monitoring the Uber settlement nationwide.',
   false, 2),

  -- Reynoldson — a published class-member line, still answered.
  ('reynoldson-v-seattle-curb-ramps', 'class_counsel',
   'Civil Rights Education and Enforcement Center', NULL,
   '1-888-461-9191', NULL, 'curbramps@creeclaw.org', 'https://creeclaw.org', NULL,
   'For people with mobility disabilities who live in or visit the City of Seattle. Use it to report a missing or broken curb ramp. If you are outside Seattle this line cannot help with your barrier.',
   false, 1),
  ('reynoldson-v-seattle-curb-ramps', 'class_counsel',
   'Disability Rights Washington', NULL,
   NULL, NULL, NULL, 'https://disabilityrightswa.org', NULL,
   'Washington''s protection and advocacy agency; co-counsel, and still monitoring Seattle''s progress.',
   false, 2),

  -- Union Pacific — class decertified, counsel still taking these one by one.
  ('eeoc-v-union-pacific-one-percent-rule', 'referral_firm',
   'Nichols Kaster, PLLP', NULL,
   NULL, NULL, NULL, 'https://www.nka.com/cases/q-u/union-pacific/', NULL,
   'For current or former Union Pacific employees removed from service after a fitness-for-duty evaluation. The class was decertified in 2020 and these are now individual claims, so time limits are short and an attorney should look at your dates.',
   true, 1),

  -- Dunsmore — settlements approved, several claims still being litigated.
  ('dunsmore-v-sd-county-jail-access', 'class_counsel',
   'Rosen Bien Galvan & Grunfeld LLP', 'Gay Crosthwait Grunfeld',
   '(415) 433-6830', NULL, NULL, 'https://rbgg.com/contact-us/', '101 Mission Street, 6th Floor, San Francisco, CA 94105',
   'For people held in a San Diego County jail. Does not cover jails or prisons anywhere else.',
   false, 1),

  -- Trivette — ongoing obligations a currently-incarcerated person can invoke.
  ('trivette-v-tn-doc-deaf-prisoners', 'state_pa',
   'Disability Rights Tennessee', NULL,
   NULL, NULL, NULL, 'https://www.disabilityrightstn.org', NULL,
   'For deaf and hard-of-hearing people in Tennessee Department of Correction custody. Tennessee''s protection and advocacy agency; they led this case and take intake.',
   true, 1),

  -- Fust — compliance obligations still running at ~20 KY/IN locations.
  ('dra-v-first-urology-medical-equipment', 'class_counsel',
   'Disability Rights Advocates', NULL,
   '(510) 665-8644', NULL, NULL, 'https://dralegal.org', NULL,
   'For patients with mobility disabilities at First Urology locations in Kentucky and Indiana.',
   false, 1),
  ('dra-v-first-urology-medical-equipment', 'state_pa',
   'Center for Accessible Living', NULL,
   NULL, NULL, NULL, 'https://www.calky.org', NULL,
   'Kentucky disability advocacy organisation and a plaintiff in this case. Local help for Kentucky residents.',
   false, 2),

  -- Fashion Nova — the window has closed; say so rather than imply a claim.
  ('alcazar-v-fashion-nova-web-access', 'settlement_administrator',
   'CPT Group, Inc.', NULL,
   '1-888-678-2596', NULL, 'FashionNovaAccessibilitySettlement@cptgroup.com',
   'https://www.fashionnovaaccessibilitysettlement.com/', '50 Corporate Park, Irvine, CA 92606',
   'The claim deadline passed in October 2025 and the settlement is being contested, so no new claims can be filed. This line can tell you the current status only.',
   false, 1),

  -- Disney — set expectations honestly; the defendant prevailed on most.
  ('williams-v-theme-park-ride-access', 'referral_firm',
   'Dogali Law Group, P.A.', 'Anthony Dogali',
   NULL, NULL, NULL, 'https://dogalilaw.com', NULL,
   'Tampa firm that brought the Disney disability-access cases. These were largely individual suits rather than a class, and Disney prevailed in most of them.',
   false, 1)
) AS v(slug, contact_kind, org_name, person_name, phone, tty, email, url,
       address, scope_note, intake_open, display_order)
JOIN litigation_listings l ON l.slug = v.slug
WHERE NOT EXISTS (
  SELECT 1 FROM litigation_contacts existing
  WHERE existing.litigation_listing_id = l.id
    AND existing.org_name = v.org_name
);
