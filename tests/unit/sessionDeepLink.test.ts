/**
 * Tests for the listing_slug deep-link behavior on createSession.
 *
 * /api/ada/session accepts an optional listing_slug. When set and the
 * slug resolves to an ACTIVE listing, the new session is created as
 * class_action_intake with listingId set — equivalent to what
 * match_listing would do post-creation, but server-enforced at session
 * creation so the user-consent gate (the click on the public listing
 * page) is structurally satisfied without an LLM round-trip.
 *
 * Invalid or inactive slugs silently fall back to a regular public_ada
 * session — no 400, no error. The directory page is heavily cached
 * and a slug might go archive-state between page load and button click.
 *
 * Ref: Step 26, Commit 1.
 */

import { describe, it, expect } from 'vitest';
import { createSession } from '@/engine/session/sessionRepo';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type {
  LawFirmRow,
  ListingRow,
  SubscriptionRow,
} from '@/engine/clients/types';

const ORG_ID = '00000000-0000-4000-8000-000000000001';
const FIRM_ID = '00000000-0000-4000-8000-00000000aa01';
const LIST_ID = '00000000-0000-4000-8000-00000000aa02';

function firm(overrides: Partial<LawFirmRow> = {}): LawFirmRow {
  return {
    id: FIRM_ID,
    orgId: ORG_ID,
    name: 'Test Firm',
    primaryContact: null,
    email: null,
    phone: null,
    stripeCustomerId: null,
    status: 'active',
    isPilot: true, // pilot so no subscription needed to surface
    ...overrides,
  };
}

function listing(overrides: Partial<ListingRow> = {}): ListingRow {
  return {
    id: LIST_ID,
    lawFirmId: FIRM_ID,
    title: 'Hotel fraud',
    slug: 'hotel-fraud',
    category: 'ada_title_iii',
    shortDescription: null,
    fullDescription: null,
    eligibilitySummary: null,
    status: 'published',
    tier: 'basic',
    ...overrides,
  };
}

describe('session creation with listing_slug (deep-link)', () => {
  it('resolves an active slug into a class_action_intake session with listingId set', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm());
    await clients.db.writeListing(listing());

    // This mirrors the two-line resolution in api/ada/session.ts:
    // look up the slug in v_active_listings, then pass listingId to
    // createSession with the class_action_intake type.
    const active = await clients.db.listActiveListings();
    const match = active.find((r) => r.slug === 'hotel-fraud');
    expect(match).toBeDefined();

    const session = createSession(clients, {
      orgId: ORG_ID,
      sessionType: 'class_action_intake',
      anonSessionId: '00000000-0000-4000-8000-00000000bbbb',
      userId: null,
      readingLevel: 'standard',
      listingId: match!.listingId,
    });

    expect(session.sessionType).toBe('class_action_intake');
    expect(session.listingId).toBe(LIST_ID);
    expect(session.status).toBe('active');
  });

  it('a draft listing does not appear in active listings (would fall back to public_ada)', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm());
    await clients.db.writeListing(listing({ status: 'draft' }));

    const active = await clients.db.listActiveListings();
    const match = active.find((r) => r.slug === 'hotel-fraud');
    expect(match).toBeUndefined();

    // Endpoint would fall back: no listingId resolved, session is public_ada
    const session = createSession(clients, {
      orgId: ORG_ID,
      sessionType: 'public_ada',
      anonSessionId: '00000000-0000-4000-8000-00000000cccc',
      userId: null,
      readingLevel: 'standard',
    });
    expect(session.sessionType).toBe('public_ada');
    expect(session.listingId).toBeNull();
  });

  it('an archived listing does not appear in active listings', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm());
    await clients.db.writeListing(listing({ status: 'archived' }));

    const active = await clients.db.listActiveListings();
    const match = active.find((r) => r.slug === 'hotel-fraud');
    expect(match).toBeUndefined();
  });

  it('a suspended firm does not surface its listings in active', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm({ status: 'suspended' }));
    await clients.db.writeListing(listing());

    const active = await clients.db.listActiveListings();
    const match = active.find((r) => r.slug === 'hotel-fraud');
    expect(match).toBeUndefined();
  });

  it('a canceled subscription on a non-pilot firm does not surface', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm({ isPilot: false }));
    await clients.db.writeListing(listing());
    const sub: SubscriptionRow = {
      id: '00000000-0000-4000-8000-00000000dd01',
      lawFirmId: FIRM_ID,
      listingId: LIST_ID,
      stripeSubscriptionId: 'sub_cancelled',
      tier: 'basic',
      status: 'canceled',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: true,
    };
    await clients.db.writeSubscription(sub);

    const active = await clients.db.listActiveListings();
    const match = active.find((r) => r.slug === 'hotel-fraud');
    expect(match).toBeUndefined();
  });

  it('unknown slug returns no match (endpoint falls back to public_ada)', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm());
    await clients.db.writeListing(listing());

    const active = await clients.db.listActiveListings();
    const match = active.find((r) => r.slug === 'does-not-exist');
    expect(match).toBeUndefined();
  });
});
