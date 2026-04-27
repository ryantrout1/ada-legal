-- scripts/seed-hotel-reading-levels.sql
--
-- Adds simple + professional variants for the hotel-accessible-room-fraud
-- listing originally seeded in migration 0001 under the Desert Disability
-- Rights Group firm. Pairs with seed-kelly-reading-levels.sql so all
-- demo listings have a complete three-level voice grid.
--
-- Voice rules match the rest of the demo content:
--   simple        — 5th-6th grade, short sentences, "you" voice, no
--                   citations, no statute numbers
--   professional  — full citations (28 CFR §36.302(e), 42 U.S.C. §12182,
--                   2010 Standards for Accessible Design), denser voice
--
-- Idempotent UPDATEs (overwrite-on-rerun).
-- ============================================================================

BEGIN;

UPDATE listings SET
  short_description_simple =
    'You booked a hotel room that was supposed to be accessible. The hotel did not give you what you booked.',
  short_description_professional =
    'Hotels and online travel agencies failed to hold accessible rooms reserved through standard booking channels in violation of 28 CFR §36.302(e).',
  full_description_simple =
    'When you book an accessible hotel room, the hotel must give you that room. They cannot put you in a different room. They cannot say the features will not be there when you arrive. They cannot cancel your room after they find out you have a disability. If a hotel did one of those things, this case may cover you.',
  full_description_professional =
    'ADA Title III, 42 U.S.C. §12182, and the DOJ''s 2010 Standards for Accessible Design (28 CFR Part 36, Appendix A) require places of lodging to let guests with disabilities reserve specific accessible rooms on the same terms as any other room. The reservation regulation at 28 CFR §36.302(e) further requires that the booked accessibility features be guaranteed and held for the reserving guest. Common violations include substitution of non-accessible rooms at check-in, failure to remove accessible inventory from the general booking pool, refusal to guarantee specific features (roll-in showers, grab bars, visual alarms, communication kits), and cancellation of reservations once the guest''s disability is disclosed.',
  eligibility_summary_simple =
    'Did you book an accessible hotel room and not get one? You may have a case.',
  eligibility_summary_professional =
    'If you reserved a room marketed or coded as accessible at a US hotel and the property failed to deliver the booked accessibility features, you may have a Title III claim under 28 CFR §36.302(e).'
WHERE slug = 'hotel-accessible-room-fraud';

UPDATE listing_configs SET
  case_description_simple =
    'Hotels have to treat people with disabilities the same as everyone else. If a hotel says they have rooms that are accessible, they have to let you book one. They have to hold that room for you. When you arrive, the room has to actually be accessible. The bathroom has to have grab bars. The shower has to roll in if that is what was advertised. The alarm has to flash for someone who is deaf if that was promised. If the hotel did not give you what they said they would, we want to hear what happened.',
  case_description_professional =
    'Title III''s reservation rule at 28 CFR §36.302(e), promulgated as part of DOJ''s 2010 final rule on the 2010 Standards for Accessible Design, requires hotels and reservation services to (1) describe the accessible features of guestrooms with sufficient detail to permit informed selection, (2) hold accessible rooms for guests with disabilities until all other rooms have been booked, (3) guarantee the specific room reserved, and (4) ensure the room is held for the reserving guest. Documented violations include "walk-and-pray" inventory practices that allow accessible rooms to be booked by non-disabled guests, OTAs (Expedia, Booking.com, Hotels.com) inheriting incorrect inventory data from PMS feeds, and post-booking cancellations once disability disclosure occurs. This intake captures the property, the booking channel, the booked features, and the failure mode required to evaluate a single-property claim, a chain-wide claim, or a putative OTA class.'
WHERE listing_id = (SELECT id FROM listings WHERE slug = 'hotel-accessible-room-fraud');

COMMIT;
