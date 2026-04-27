-- scripts/seed-kelly-reading-levels.sql
--
-- Populates the simple and professional reading-level variants for the 5
-- demo class action listings created by seed-kelly-class-actions.sql. The
-- existing fields (short_description, full_description, eligibility_summary,
-- case_description) stay as the 'standard' voice. This script ADDS:
--
--   simple        = 5th-6th grade, short sentences, no case names, no
--                   statute numbers, "you" voice
--   professional  = firm-website voice, case names + statute citations,
--                   denser and attorney-credible
--
-- Targets only the Spinal Cord Injury Law Firm rows; the existing hotel
-- listing under Desert Disability Rights Group is intentionally untouched.
-- Idempotent: re-running just overwrites variant text.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Rideshare wheelchair and service animal denials
-- ============================================================================
UPDATE listings SET
  short_description_simple =
    'An Uber or Lyft driver said no to your ride, charged you extra, or refused your wheelchair, scooter, or service animal.',
  short_description_professional =
    'Rideshare carriers refused service, denied service-animal access, or imposed surcharges on disabled riders in violation of ADA Title III.',
  full_description_simple =
    'Uber and Lyft are not allowed to treat you differently because you have a disability. They cannot say no to your service animal. They cannot say no to a wheelchair or scooter that folds. They cannot charge you extra because of your disability. The U.S. government is suing Uber right now over these problems. A separate lawsuit against Lyft is about wheelchair-accessible vehicles. If a driver did one of these things to you, this case may cover you.',
  full_description_professional =
    'Title III of the ADA, 42 U.S.C. §12181 et seq., prohibits disability-based discrimination by private transportation providers, including transportation network companies. The U.S. Department of Justice''s September 2025 enforcement action, United States v. Uber Technologies, Inc. (N.D. Cal.), survived a motion to dismiss on March 5, 2026, and seeks $125 million in compensatory relief plus injunctive remedies for service-animal denials, refusal to assist with stowable mobility devices, and disability-targeted surcharges. Parallel private class litigation, including Lowell v. Lyft (S.D.N.Y.), targets the systemic absence of wheelchair-accessible vehicles. This intake assesses individual incidents against the active class theories.',
  eligibility_summary_simple =
    'Did a rideshare driver cancel on you, refuse you, or charge you more because you use a wheelchair, scooter, or service animal? You may be part of this case.',
  eligibility_summary_professional =
    'If a transportation network company driver denied service, refused a service animal, refused stowable mobility-device assistance, or imposed a disability-related surcharge, you may have an ADA Title III claim suitable for inclusion in active or putative class proceedings.'
WHERE slug = 'rideshare-disability-denial';

UPDATE listing_configs SET
  case_description_simple =
    'Uber and Lyft are not allowed to treat you differently because of a disability. Drivers must take you, your service animal, and your folding wheelchair or scooter. They must help you the same way they help other riders with their bags. They cannot charge you extra fees because of your service animal or wheelchair. We will ask you what happened on your ride. We will ask when, where, and what the driver said or did.',
  case_description_professional =
    'ADA Title III, 42 U.S.C. §§12182-12184, governs transportation services operated by private entities, and the DOJ''s implementing regulations at 28 CFR Part 36 require equivalent service to passengers with disabilities. Common documented violations include service-animal refusals (and improper demands for documentation or muzzling), refusal to assist with stowable mobility aids while assisting non-disabled passengers with luggage, redirection of service-animal users to higher-priced "pet" tiers, and pretextual cancellations. This intake captures the rideshare carrier, jurisdiction, date, and incident specifics required to map the matter onto United States v. Uber Technologies, Inc. (N.D. Cal.) and Lowell v. Lyft (S.D.N.Y.) class theories, or to assess a stand-alone Title III claim.'
WHERE listing_id = (SELECT id FROM listings WHERE slug = 'rideshare-disability-denial');

-- ============================================================================
-- 2. Airline wheelchair damage, delay, or loss
-- ============================================================================
UPDATE listings SET
  short_description_simple =
    'An airline broke, lost, or was very late returning your wheelchair or scooter on a flight in or out of the United States.',
  short_description_professional =
    'Air carriers damaged, delayed, or failed to return mobility devices in violation of the Air Carrier Access Act and DOT''s Part 382 wheelchair rule.',
  full_description_simple =
    'Airlines are not allowed to break or lose your wheelchair. If they damage it, lose it, or take a long time to give it back, that is a problem. The government says airlines mess up more than 11,500 wheelchairs every year. About 1 in every 100 wheelchairs put on a plane comes back broken, late, or lost. The rules to protect you are tied up in court right now. While that fights happens, you can still bring your own claim. We will help you write down what the airline did to your chair.',
  full_description_professional =
    'The Air Carrier Access Act, 49 U.S.C. §41705, and DOT''s Part 382 implementing regulations require carriers to safely transport assistive devices and return them undamaged. DOT''s December 2024 final rule (89 Fed. Reg. 99204) established a strict-liability framework for mishandled mobility devices. The carriers'' February 2025 challenge in Airlines for America v. DOT (5th Cir.) prompted DOT to delay enforcement of four key provisions through December 31, 2026, with Wheelchair Rule II rulemaking targeted for August 2026. In the interim, individual ACAA claims and state-law theories remain viable. DOT data shows airlines mishandle 11,500+ devices annually, approximately one of every 100 checked.',
  eligibility_summary_simple =
    'Did an airline break, lose, or take a long time to return your wheelchair or scooter? You may have a case.',
  eligibility_summary_professional =
    'If a US-flag carrier or a foreign carrier on a US-touching itinerary returned your assistive device damaged, returned it materially late, or lost it, you may have an actionable Air Carrier Access Act claim.'
WHERE slug = 'airline-wheelchair-damage';

UPDATE listing_configs SET
  case_description_simple =
    'When you fly, the airline must take care of your wheelchair or scooter. They must give it back to you the same way you gave it to them. If they break it, that is wrong. If they lose it, that is wrong. If they take a long time to give it back, that is wrong. A power wheelchair can cost more than $30,000 to replace. We will ask you which airline, when you flew, and what happened to your chair. Photos help. So does any complaint you filed.',
  case_description_professional =
    'Under 49 U.S.C. §41705 and 14 CFR Part 382, air carriers bear responsibility for the safe carriage and return of passenger mobility devices. Documentable harms include physical damage, delayed return causing missed appointments or extended immobility, loss of device requiring full replacement (often $20,000-$30,000+ for power chairs and complex rehab equipment), and acceptance refusals. This intake captures carrier identity, flight details, device specifications, and contemporaneous documentation (airport-filed complaints, photographs, repair estimates) needed to evaluate a stand-alone claim or putative class theory while the regulatory enforcement landscape settles.'
WHERE listing_id = (SELECT id FROM listings WHERE slug = 'airline-wheelchair-damage');

-- ============================================================================
-- 3. Paratransit and public transit lift failures
-- ============================================================================
UPDATE listings SET
  short_description_simple =
    'Your paratransit van did not show up. Or it was hours late. Or your local bus did not lower its wheelchair lift for you.',
  short_description_professional =
    'Public transit agencies failed to provide comparable paratransit service or maintain operable wheelchair lifts in violation of ADA Title II and 49 CFR Part 37.',
  full_description_simple =
    'Public buses and trains have to work for you. If the lift on the bus is broken, that is not your problem. The bus driver should not pass you by. Paratransit vans must show up. They must show up when they say they will. If they keep being late or not showing up at all, that is a violation of the law. Class actions have made transit agencies fix these problems. Your story matters.',
  full_description_professional =
    'ADA Title II, 42 U.S.C. §12132, and DOT regulations at 49 CFR Part 37 require public transit operators to maintain accessible features in operative condition and to provide complementary paratransit service comparable to fixed-route service in response time, cost, and capacity. Established class precedent including Independent Living Resource Center v. LA County MTA / Access Services and United States v. City of Jackson (S.D. Miss.) sets the framework: documented patterns of late or no-show paratransit, capacity-constraint trip denials, and inoperable fixed-route lifts establish actionable systemic violations. Recurring agency-level failures support class certification.',
  eligibility_summary_simple =
    'Has your local transit agency or paratransit van let you down more than once? You may be part of a class action.',
  eligibility_summary_professional =
    'If a public transit operator''s pattern of paratransit no-shows, materially late pickups, capacity denials, or inoperable fixed-route lifts has affected you, your matter may align with active Title II class theories.'
WHERE slug = 'paratransit-transit-failures';

UPDATE listing_configs SET
  case_description_simple =
    'Public transit must work for you the same way it works for everyone else. The wheelchair lift on the bus has to be in working order. If it is broken, the agency has to fix it. Paratransit is the door-to-door van service for people who cannot use the regular bus. The van must show up when you booked it. The wait must not be much longer than the regular bus. If your transit agency keeps doing the same thing wrong to many people, a class action can fix it.',
  case_description_professional =
    'ADA Title II paratransit and fixed-route accessibility cases follow established failure patterns: complementary paratransit response-time deficiencies (49 CFR §37.131(b)), capacity-constraint trip denials inconsistent with §37.131(f), and inoperative wheelchair lifts in violation of §37.161''s maintenance requirement. The right of action belongs to qualified individuals with disabilities and the class theories address recurring agency-level conduct rather than isolated incidents. This intake captures the agency, service mode, frequency, and complaint history necessary to evaluate placement within active or putative class proceedings.'
WHERE listing_id = (SELECT id FROM listings WHERE slug = 'paratransit-transit-failures');

-- ============================================================================
-- 4. State and local government inaccessible websites
-- ============================================================================
UPDATE listings SET
  short_description_simple =
    'A city, county, or state website would not let you do something important because of your disability.',
  short_description_professional =
    'State and local government websites and mobile apps fail to conform to WCAG 2.1 AA in violation of DOJ''s Title II final rule, 89 Fed. Reg. 31320.',
  full_description_simple =
    'Government websites have to work for everyone. If you use a screen reader or just a keyboard, the site must work for you. Big cities and counties have until April 24, 2026 to fix their websites. Smaller places have until April 2027. After that, if the site does not work for you, that is breaking the law. Common problems: paying a parking ticket, applying for SNAP food help, looking up your court date, and signing up to vote.',
  full_description_professional =
    'DOJ''s April 2024 Title II final rule (89 Fed. Reg. 31320) adopts WCAG 2.1 Level AA as the technical standard for state and local government web content and mobile applications. The compliance deadlines are tiered: April 24, 2026 for public entities serving populations of 50,000 or more, and April 26, 2027 for smaller entities. Post-deadline noncompliance creates direct exposure under 28 CFR §35.200 et seq. Enforcement projections forecast a substantial wave of Title II digital-accessibility filings in 2026-2027 mirroring the Title III website-litigation pattern (5,100+ filings in 2025).',
  eligibility_summary_simple =
    'Did a government website or app stop you from doing what you needed because of your disability? You may have a case.',
  eligibility_summary_professional =
    'If a state or local government website or mobile application failed to conform to WCAG 2.1 AA and prevented you from accessing a public program, service, or activity, you may have a Title II digital-accessibility claim.'
WHERE slug = 'government-website-inaccessible';

UPDATE listing_configs SET
  case_description_simple =
    'Cities, counties, and states run a lot of websites. They are for paying bills, applying for help, looking up information, and signing up for services. The law now says all of those websites must work for people with disabilities. That includes people who use screen readers. It includes people who only use a keyboard. It includes people who need bigger text. If a government website would not let you do what you needed to do, the agency may have to fix it and pay you for the harm.',
  case_description_professional =
    'Title II of the ADA, 42 U.S.C. §12132, prohibits public entities from excluding qualified individuals with disabilities from programs, services, and activities. DOJ''s 2024 final rule, codified at 28 CFR §§35.200-35.205, applies that mandate to digital surfaces and adopts WCAG 2.1 Level AA as the conformance standard. The April 24, 2026 deadline for large entities (population ≥50,000) and April 26, 2027 deadline for smaller entities establish bright-line compliance dates. This intake documents the entity, the digital service, the assistive technology in use, and the specific point of failure necessary to evaluate a private right of action under §12133 or referral to DOJ enforcement.'
WHERE listing_id = (SELECT id FROM listings WHERE slug = 'government-website-inaccessible');

-- ============================================================================
-- 5. Retail websites that are not accessible to screen readers
-- ============================================================================
UPDATE listings SET
  short_description_simple =
    'A store website did not work with your screen reader. You could not shop or check out the way other people can.',
  short_description_professional =
    'Retail and e-commerce websites failed to provide screen-reader-accessible content in violation of ADA Title III as construed in Robles v. Domino''s Pizza, LLC.',
  full_description_simple =
    'When you shop online, the store website should work for you the same way it works for everyone else. If you use a screen reader, the buttons and forms should tell the screen reader what they do. If they do not, you cannot shop. Many store websites still fail this basic test. Class actions about these failures often settle for millions of dollars. One recent case against Fashion Nova was for $5.15 million. Your bad shopping experience may be a real legal claim.',
  full_description_professional =
    'Most circuits construe Title III''s public-accommodation reach to include retail websites where the site provides goods or services to the public, with the Ninth Circuit''s ruling in Robles v. Domino''s Pizza, LLC, 913 F.3d 898 (9th Cir. 2019) (cert. denied) providing leading authority. WCAG 2.1 Level AA is the de facto judicial standard. The plaintiff bar filed 5,100+ digital-accessibility actions in 2025; ~70% targeted e-commerce, and the recent Alcazar v. Fashion Nova, Inc. (N.D. Cal., 4:20-cv-01434) class settlement (proposed $5.15M, with DOJ Statement of Interest filed February 2, 2026) illustrates the resolution range.',
  eligibility_summary_simple =
    'Are you blind or have low vision, and a store website blocked you from shopping or checking out? You may qualify.',
  eligibility_summary_professional =
    'If you rely on assistive technology and a US retail website''s nonconformance with WCAG 2.1 AA blocked you from completing a purchase or accessing equivalent goods, services, or pricing, you may have a Title III claim.'
WHERE slug = 'retail-website-screenreader';

UPDATE listing_configs SET
  case_description_simple =
    'Retail websites are like stores. The law says stores have to be open to everyone. That means a blind person should be able to shop online too. A screen reader is software that reads the screen out loud. For it to work, the website has to be built right. If the buttons are not labeled, the screen reader cannot say what they do. If the pictures have no description, you do not know what is for sale. If the checkout form is broken, you cannot pay. We will ask you which website, what you were trying to buy, and what went wrong.',
  case_description_professional =
    'Title III website accessibility cases turn on whether a public-facing commercial site provides equal access to users of assistive technologies. Documented technical failures track WCAG 2.1 AA criteria: missing or inadequate text alternatives (1.1.1), unlabeled form controls (3.3.2 / 4.1.2), inaccessible name conflicts on interactive elements (4.1.2), focus management failures during checkout (2.4.3, 2.4.7), and modal-dialog focus traps. Robles v. Domino''s Pizza, LLC, 913 F.3d 898 (9th Cir. 2019), and the wave of post-Robles settlements through Alcazar v. Fashion Nova, Inc. ($5.15M proposed, N.D. Cal. 2026) define the resolution landscape. This intake captures retailer identity, the specific point of failure, and the assistive technology configuration in use.'
WHERE listing_id = (SELECT id FROM listings WHERE slug = 'retail-website-screenreader');

COMMIT;

-- Verify
SELECT
  slug,
  CASE WHEN short_description_simple IS NOT NULL THEN '✓' ELSE '✗' END AS sds,
  CASE WHEN short_description_professional IS NOT NULL THEN '✓' ELSE '✗' END AS sdp,
  CASE WHEN full_description_simple IS NOT NULL THEN '✓' ELSE '✗' END AS fds,
  CASE WHEN full_description_professional IS NOT NULL THEN '✓' ELSE '✗' END AS fdp,
  CASE WHEN eligibility_summary_simple IS NOT NULL THEN '✓' ELSE '✗' END AS ess,
  CASE WHEN eligibility_summary_professional IS NOT NULL THEN '✓' ELSE '✗' END AS esp
FROM listings
WHERE law_firm_id = (SELECT id FROM law_firms WHERE name = 'The Spinal Cord Injury Law Firm')
ORDER BY title;
