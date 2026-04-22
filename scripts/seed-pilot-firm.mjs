#!/usr/bin/env node
/**
 * Seed a pilot law firm + listing + listing_config in Neon.
 *
 * Step 25 prep commit: puts real data in prod so you (and Ada) have
 * something to transact against while the admin UI is being built.
 * The firm is seeded with is_pilot=true so its listings surface in
 * v_active_listings without a Stripe subscription (Phase C Step 23).
 *
 * Safe to re-run: the firm is upserted keyed by (org_id, name) and the
 * listing is upserted keyed by slug. The config is upserted keyed by
 * listing_id. Nothing is deleted.
 *
 * Usage:
 *   export DATABASE_URL="postgres://..."
 *   node scripts/seed-pilot-firm.mjs                  # applies to prod
 *   node scripts/seed-pilot-firm.mjs --dry-run        # prints what would change
 *
 * Edit the CONFIG block below to customize the seed for a different
 * pilot firm + case.
 */

import { neon } from '@neondatabase/serverless';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function die(msg) {
  console.error(`[seed] error: ${msg}`);
  process.exit(1);
}

function log(msg) {
  console.log(`[seed] ${msg}`);
}

const dryRun = process.argv.includes('--dry-run');
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  die('DATABASE_URL is not set. Export it first.');
}
const sql = neon(dbUrl);

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Edit this block to seed a different firm + listing.

const ORG_CODE = 'adall';

const FIRM = {
  name: 'Desert Disability Rights Group',
  primaryContact: 'Pilot Partner (placeholder)',
  email: 'pilot@adalegallink.com',
  phone: null,
  status: 'active',
  isPilot: true,
};

const LISTING = {
  title: 'Hotel booking accessible-room fraud',
  slug: 'hotel-accessible-room-fraud',
  category: 'ada_title_iii',
  shortDescription:
    'You booked an accessible hotel room and the hotel failed to provide one, refused to guarantee it, or cancelled your booking after the fact.',
  fullDescription:
    'Under ADA Title III and DOJ 2010 Standards, hotels and online travel agencies must let guests reserve specific accessible rooms on the same terms as any other room, including guaranteeing that the accessible features will be available on arrival. This class action targets hotels and booking platforms that list accessible rooms online but then substitute non-accessible rooms, refuse to guarantee features (roll-in shower, grab bars, visual alarms), or cancel reservations after discovering the guest has a disability. 28 CFR §36.302(e).',
  eligibilitySummary:
    'If you booked a room listed as accessible and the hotel did not provide what was booked, you may qualify.',
  status: 'published',
  tier: 'basic',
};

const CONFIG = {
  caseDescription:
    'Hotels are required under ADA Title III and 28 CFR §36.302(e) to offer accessible rooms on the same terms as other rooms, and to guarantee the specific accessibility features when a guest books them. When a hotel advertises an accessible room, accepts a booking for one, and then fails to deliver (the room is not accessible, key features are missing, or the reservation is cancelled), that may be a violation. This intake collects the facts needed to assess a potential class claim against the hotel or booking platform.',
  eligibilityCriteria: [
    {
      description:
        'You booked a hotel room that was advertised or listed as accessible (any language: accessible, ADA, mobility-accessible, wheelchair-accessible, roll-in shower, etc.)',
      kind: 'required',
    },
    {
      description:
        'You have a disability and needed the specific accessibility features of the room you booked',
      kind: 'required',
    },
    {
      description:
        'The hotel did not provide what you booked: the room lacked the advertised features, was substituted for a non-accessible room, or the booking was cancelled',
      kind: 'required',
    },
    {
      description:
        'You have a copy or record of the original booking confirmation showing the room was listed as accessible',
      kind: 'preferred',
    },
    {
      description: 'The incident happened in the last 2 years',
      kind: 'preferred',
    },
    {
      description:
        'You were outside the US at the time of booking or stay (ADA only applies to US public accommodations)',
      kind: 'disqualifying',
    },
  ],
  requiredFields: [
    {
      name: 'hotel_name',
      description: 'The name of the hotel or lodging',
      required: true,
      type: 'string',
    },
    {
      name: 'hotel_city',
      description: 'City where the hotel is located',
      required: true,
      type: 'string',
    },
    {
      name: 'hotel_state',
      description: 'US state (2-letter code if possible, otherwise full name) where the hotel is located',
      required: true,
      type: 'string',
    },
    {
      name: 'booking_date',
      description: 'Date the reservation was made',
      required: true,
      type: 'date',
    },
    {
      name: 'incident_date',
      description:
        'Date the issue occurred (arrival date when the room was not as booked, or date the booking was cancelled)',
      required: true,
      type: 'date',
    },
    {
      name: 'what_went_wrong',
      description:
        'A short description in the user\'s own words of what the hotel did: room was not accessible, features missing, booking cancelled, substituted, etc.',
      required: true,
      type: 'free_text',
    },
    {
      name: 'has_booking_confirmation',
      description:
        'Does the user still have a copy of the original booking confirmation (email, screenshot, or PDF)?',
      required: true,
      type: 'yes_no',
    },
    {
      name: 'booking_platform',
      description:
        'How the booking was made: hotel website, phone, or a third-party platform (Expedia, Booking.com, Hotels.com, etc.)',
      required: false,
      type: 'free_text',
    },
  ],
  disqualifyingConditions: [
    'Booking was for a hotel outside the United States',
    'User does not have a disability',
    'User did not actually book an accessible room (e.g. they were upgraded and then downgraded)',
  ],
  adaPromptOverride: null,
};

// ─── Preamble ─────────────────────────────────────────────────────────────────

log(
  `\n  MODE: ${dryRun ? 'DRY-RUN (no writes)' : 'WRITE'}\n  ORG:  ${ORG_CODE}\n  FIRM: ${FIRM.name} (is_pilot=${FIRM.isPilot})\n  LIST: ${LISTING.slug}\n`,
);

// ─── 1. Verify org exists ────────────────────────────────────────────────────

const orgRows = await sql.query(
  `SELECT id, display_name FROM organizations WHERE org_code = $1 LIMIT 1`,
  [ORG_CODE],
);
if (orgRows.length === 0) {
  die(`Organization with org_code='${ORG_CODE}' not found. Seed the org first.`);
}
const orgId = orgRows[0].id;
log(`found org ${orgId} (${orgRows[0].display_name})`);

// ─── 2. Upsert firm ──────────────────────────────────────────────────────────

let firmId;
const existingFirm = await sql.query(
  `SELECT id, name, is_pilot FROM law_firms WHERE org_id = $1 AND name = $2 LIMIT 1`,
  [orgId, FIRM.name],
);

if (existingFirm.length > 0) {
  firmId = existingFirm[0].id;
  log(
    `found existing firm ${firmId} (is_pilot=${existingFirm[0].is_pilot} → ${FIRM.isPilot})`,
  );
  if (!dryRun) {
    await sql.query(
      `UPDATE law_firms
         SET primary_contact = $1,
             email = $2,
             phone = $3,
             status = $4,
             is_pilot = $5,
             updated_at = now()
       WHERE id = $6`,
      [
        FIRM.primaryContact,
        FIRM.email,
        FIRM.phone,
        FIRM.status,
        FIRM.isPilot,
        firmId,
      ],
    );
    log(`updated firm`);
  } else {
    log(`[dry-run] would update firm`);
  }
} else {
  if (!dryRun) {
    const created = await sql.query(
      `INSERT INTO law_firms
         (org_id, name, primary_contact, email, phone, status, is_pilot)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        orgId,
        FIRM.name,
        FIRM.primaryContact,
        FIRM.email,
        FIRM.phone,
        FIRM.status,
        FIRM.isPilot,
      ],
    );
    firmId = created[0].id;
    log(`created firm ${firmId}`);
  } else {
    firmId = '00000000-0000-0000-0000-dryrunfirm00';
    log(`[dry-run] would create firm`);
  }
}

// ─── 3. Upsert listing ───────────────────────────────────────────────────────

let listingId;
const existingListing = await sql.query(
  `SELECT id, law_firm_id, status FROM listings WHERE slug = $1 LIMIT 1`,
  [LISTING.slug],
);

if (existingListing.length > 0) {
  listingId = existingListing[0].id;
  if (existingListing[0].law_firm_id !== firmId) {
    die(
      `Listing with slug='${LISTING.slug}' already exists under a different firm ` +
        `(${existingListing[0].law_firm_id}). Refusing to overwrite. Either rename ` +
        `the slug in CONFIG or delete the existing listing.`,
    );
  }
  log(
    `found existing listing ${listingId} (status=${existingListing[0].status} → ${LISTING.status})`,
  );
  if (!dryRun) {
    await sql.query(
      `UPDATE listings
         SET title = $1,
             category = $2,
             short_description = $3,
             full_description = $4,
             eligibility_summary = $5,
             status = $6,
             tier = $7,
             updated_at = now()
       WHERE id = $8`,
      [
        LISTING.title,
        LISTING.category,
        LISTING.shortDescription,
        LISTING.fullDescription,
        LISTING.eligibilitySummary,
        LISTING.status,
        LISTING.tier,
        listingId,
      ],
    );
    log(`updated listing`);
  } else {
    log(`[dry-run] would update listing`);
  }
} else {
  if (!dryRun) {
    const created = await sql.query(
      `INSERT INTO listings
         (law_firm_id, title, slug, category, short_description, full_description,
          eligibility_summary, status, tier)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        firmId,
        LISTING.title,
        LISTING.slug,
        LISTING.category,
        LISTING.shortDescription,
        LISTING.fullDescription,
        LISTING.eligibilitySummary,
        LISTING.status,
        LISTING.tier,
      ],
    );
    listingId = created[0].id;
    log(`created listing ${listingId}`);
  } else {
    listingId = '00000000-0000-0000-0000-dryrunlist000';
    log(`[dry-run] would create listing`);
  }
}

// ─── 4. Upsert config ────────────────────────────────────────────────────────

const existingConfig = await sql.query(
  `SELECT id FROM listing_configs WHERE listing_id = $1 LIMIT 1`,
  [listingId],
);

if (existingConfig.length > 0) {
  log(`found existing config ${existingConfig[0].id}`);
  if (!dryRun) {
    await sql.query(
      `UPDATE listing_configs
         SET case_description = $1,
             eligibility_criteria = $2::jsonb,
             required_fields = $3::jsonb,
             disqualifying_conditions = $4::jsonb,
             ada_prompt_override = $5,
             updated_at = now()
       WHERE listing_id = $6`,
      [
        CONFIG.caseDescription,
        JSON.stringify(CONFIG.eligibilityCriteria),
        JSON.stringify(CONFIG.requiredFields),
        JSON.stringify(CONFIG.disqualifyingConditions),
        CONFIG.adaPromptOverride,
        listingId,
      ],
    );
    log(`updated config`);
  } else {
    log(`[dry-run] would update config`);
  }
} else {
  if (!dryRun) {
    await sql.query(
      `INSERT INTO listing_configs
         (listing_id, case_description, eligibility_criteria, required_fields,
          disqualifying_conditions, ada_prompt_override)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6)`,
      [
        listingId,
        CONFIG.caseDescription,
        JSON.stringify(CONFIG.eligibilityCriteria),
        JSON.stringify(CONFIG.requiredFields),
        JSON.stringify(CONFIG.disqualifyingConditions),
        CONFIG.adaPromptOverride,
      ],
    );
    log(`created config`);
  } else {
    log(`[dry-run] would create config`);
  }
}

// ─── 5. Verify by reading from v_active_listings ─────────────────────────────

if (!dryRun) {
  const activeRows = await sql.query(
    `SELECT listing_id, title, is_pilot, subscription_tier
       FROM v_active_listings
      WHERE listing_id = $1`,
    [listingId],
  );
  if (activeRows.length === 0) {
    log(
      `WARNING: listing did NOT surface in v_active_listings. Check status=published + firm.status=active + (is_pilot OR active sub).`,
    );
  } else {
    log(
      `\u2713 listing is live in v_active_listings: "${activeRows[0].title}" (is_pilot=${activeRows[0].is_pilot}, tier=${activeRows[0].subscription_tier})`,
    );
  }
}

log(`\n  DONE.\n`);
