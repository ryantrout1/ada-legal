/**
 * Tests for the Ch1 DbClient surface (Step 19).
 *
 * Ch1 is the law-firm / listings / subscriptions layer that powers
 * later steps: match_listing tool (20), routing engine (22),
 * Stripe billing (23), attorney handoff (24).
 *
 * These tests run against InMemoryDbClient (the seam) and lock in
 * the behavior that NeonDbClient must mirror. The active-listings
 * filter logic in particular has subtle corners — published vs
 * draft, active vs suspended firm, active vs canceled sub,
 * period_end in the past — each one is a potential production bug
 * if we drift.
 *
 * Ref: Step 19 Ch1 schema wiring. See migration 0004 for the
 * canonical v_active_listings definition.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type {
  LawFirmRow,
  ListingRow,
  SubscriptionRow,
} from '@/engine/clients/types';

// Fixed UUIDs so we can reason about identity in assertions.
const ORG_ID     = '00000000-0000-4000-8000-000000000001';
const FIRM_A     = '00000000-0000-4000-8000-000000000a01';
const FIRM_B     = '00000000-0000-4000-8000-000000000b01';
const LISTING_A  = '00000000-0000-4000-8000-000000000a02';
const LISTING_B  = '00000000-0000-4000-8000-000000000b02';
const LISTING_C  = '00000000-0000-4000-8000-000000000c02';
const CFG_A      = '00000000-0000-4000-8000-000000000a03';
const SUB_A      = '00000000-0000-4000-8000-000000000a04';
const SUB_B      = '00000000-0000-4000-8000-000000000b04';

// Factory helpers so each test starts from a clean, obvious state.
function makeFirm(overrides: Partial<LawFirmRow> = {}): LawFirmRow {
  return {
    id: FIRM_A,
    orgId: ORG_ID,
    name: 'Acme ADA Law',
    primaryContact: 'Counsel',
    email: 'counsel@example.com',
    phone: null,
    stripeCustomerId: null,
    status: 'active',
    ...overrides,
  };
}

function makeListing(overrides: Partial<ListingRow> = {}): ListingRow {
  return {
    id: LISTING_A,
    lawFirmId: FIRM_A,
    title: 'Wheelchair access cases — AZ',
    slug: 'az-wheelchair-access',
    category: 'ada_title_iii',
    shortDescription: 'We take ADA Title III access cases in Arizona.',
    fullDescription: null,
    eligibilitySummary: null,
    status: 'published',
    tier: 'basic',
    ...overrides,
  };
}

function makeSub(overrides: Partial<SubscriptionRow> = {}): SubscriptionRow {
  return {
    id: SUB_A,
    lawFirmId: FIRM_A,
    listingId: LISTING_A,
    stripeSubscriptionId: 'sub_test_001',
    tier: 'basic',
    status: 'active',
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    ...overrides,
  };
}

// ─── law_firms ────────────────────────────────────────────────────────────────

describe('DbClient.writeLawFirm / readLawFirmById', () => {
  it('round-trips a law firm', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm());
    const read = await clients.db.readLawFirmById(FIRM_A);
    expect(read).not.toBeNull();
    expect(read!.name).toBe('Acme ADA Law');
    expect(read!.status).toBe('active');
  });

  it('updates on re-write with the same id', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm({ name: 'Old name' }));
    await clients.db.writeLawFirm(makeFirm({ name: 'New name' }));
    const read = await clients.db.readLawFirmById(FIRM_A);
    expect(read?.name).toBe('New name');
  });

  it('returns null for unknown id', async () => {
    const clients = makeInMemoryClients();
    expect(await clients.db.readLawFirmById(FIRM_A)).toBeNull();
  });
});

// ─── listings ─────────────────────────────────────────────────────────────────

describe('DbClient listings', () => {
  it('round-trips via slug and id', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm());
    await clients.db.writeListing(makeListing());

    const bySlug = await clients.db.readListingBySlug('az-wheelchair-access');
    const byId = await clients.db.readListingById(LISTING_A);
    expect(bySlug?.title).toBe('Wheelchair access cases — AZ');
    expect(byId?.title).toBe('Wheelchair access cases — AZ');
  });

  it('returns null for unknown slug or id', async () => {
    const clients = makeInMemoryClients();
    expect(await clients.db.readListingBySlug('nope')).toBeNull();
    expect(await clients.db.readListingById(LISTING_A)).toBeNull();
  });

  it('updates in place on re-write with same id', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm());
    await clients.db.writeListing(makeListing({ title: 'First' }));
    await clients.db.writeListing(makeListing({ title: 'Second' }));
    const read = await clients.db.readListingById(LISTING_A);
    expect(read?.title).toBe('Second');
  });
});

// ─── listing_configs ──────────────────────────────────────────────────────────

describe('DbClient listing_configs', () => {
  it('round-trips a config and reads it back by listing id', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm());
    await clients.db.writeListing(makeListing());
    await clients.db.writeListingConfig({
      id: CFG_A,
      listingId: LISTING_A,
      caseDescription: 'We take ADA Title III path-of-travel cases.',
      eligibilityCriteria: [{ field: 'location_state', op: 'eq', value: 'AZ' }],
      requiredFields: [{ name: 'business_name', type: 'string', required: true }],
      disqualifyingConditions: ['claim_too_old'],
      adaPromptOverride: null,
    });
    const read = await clients.db.readListingConfigForListing(LISTING_A);
    expect(read?.caseDescription).toContain('Title III');
    expect(read?.disqualifyingConditions).toEqual(['claim_too_old']);
  });

  it('returns null when no config attached', async () => {
    const clients = makeInMemoryClients();
    expect(
      await clients.db.readListingConfigForListing(LISTING_A),
    ).toBeNull();
  });
});

// ─── subscriptions ────────────────────────────────────────────────────────────

describe('DbClient subscriptions', () => {
  it('round-trips a subscription', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeSubscription(makeSub());
    const read = await clients.db.readSubscriptionById(SUB_A);
    expect(read?.status).toBe('active');
    expect(read?.tier).toBe('basic');
  });

  it('updates on re-write (simulates Stripe webhook replay)', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeSubscription(makeSub({ status: 'active' }));
    await clients.db.writeSubscription(makeSub({ status: 'canceled' }));
    const read = await clients.db.readSubscriptionById(SUB_A);
    expect(read?.status).toBe('canceled');
  });
});

// ─── listActiveListings (the business logic) ──────────────────────────────────

describe('DbClient.listActiveListings', () => {
  it('returns empty when nothing seeded', async () => {
    const clients = makeInMemoryClients();
    const rows = await clients.db.listActiveListings();
    expect(rows).toEqual([]);
  });

  it('returns a listing that is published + firm active + sub active', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm());
    await clients.db.writeListing(makeListing());
    await clients.db.writeSubscription(makeSub());
    const rows = await clients.db.listActiveListings();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.listingId).toBe(LISTING_A);
    expect(rows[0]!.lawFirmName).toBe('Acme ADA Law');
    expect(rows[0]!.subscriptionId).toBe(SUB_A);
  });

  it('EXCLUDES a draft listing', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm());
    await clients.db.writeListing(makeListing({ status: 'draft' }));
    await clients.db.writeSubscription(makeSub());
    const rows = await clients.db.listActiveListings();
    expect(rows).toEqual([]);
  });

  it('EXCLUDES a listing whose firm is suspended', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm({ status: 'suspended' }));
    await clients.db.writeListing(makeListing());
    await clients.db.writeSubscription(makeSub());
    const rows = await clients.db.listActiveListings();
    expect(rows).toEqual([]);
  });

  it('EXCLUDES a listing whose sub is canceled', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm());
    await clients.db.writeListing(makeListing());
    await clients.db.writeSubscription(makeSub({ status: 'canceled' }));
    const rows = await clients.db.listActiveListings();
    expect(rows).toEqual([]);
  });

  it('EXCLUDES a listing whose sub period is in the past', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm());
    await clients.db.writeListing(makeListing());
    await clients.db.writeSubscription(
      makeSub({
        currentPeriodEnd: new Date(Date.now() - 3_600_000).toISOString(),
      }),
    );
    const rows = await clients.db.listActiveListings();
    expect(rows).toEqual([]);
  });

  it('INCLUDES a listing whose sub has no period end (open-ended)', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm());
    await clients.db.writeListing(makeListing());
    await clients.db.writeSubscription(makeSub({ currentPeriodEnd: null }));
    const rows = await clients.db.listActiveListings();
    expect(rows).toHaveLength(1);
  });

  it('INCLUDES trialing subscriptions (treated as active)', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm());
    await clients.db.writeListing(makeListing());
    await clients.db.writeSubscription(makeSub({ status: 'trialing' }));
    const rows = await clients.db.listActiveListings();
    expect(rows).toHaveLength(1);
  });

  it('filters by category when provided', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm());
    await clients.db.writeListing(
      makeListing({ id: LISTING_A, slug: 'a', category: 'ada_title_iii' }),
    );
    await clients.db.writeListing(
      makeListing({ id: LISTING_B, slug: 'b', category: 'ada_title_i' }),
    );
    await clients.db.writeSubscription(
      makeSub({ id: SUB_A, listingId: LISTING_A }),
    );
    await clients.db.writeSubscription(
      makeSub({ id: SUB_B, listingId: LISTING_B }),
    );
    const rows = await clients.db.listActiveListings({ category: 'ada_title_iii' });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.listingId).toBe(LISTING_A);
  });

  it('filters by lawFirmId when provided', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm({ id: FIRM_A, name: 'Firm A' }));
    await clients.db.writeLawFirm(makeFirm({ id: FIRM_B, name: 'Firm B' }));
    await clients.db.writeListing(
      makeListing({ id: LISTING_A, slug: 'a', lawFirmId: FIRM_A }),
    );
    await clients.db.writeListing(
      makeListing({ id: LISTING_C, slug: 'c', lawFirmId: FIRM_B }),
    );
    await clients.db.writeSubscription(
      makeSub({ id: SUB_A, listingId: LISTING_A, lawFirmId: FIRM_A }),
    );
    await clients.db.writeSubscription(
      makeSub({ id: SUB_B, listingId: LISTING_C, lawFirmId: FIRM_B }),
    );
    const rows = await clients.db.listActiveListings({ lawFirmId: FIRM_B });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.lawFirmName).toBe('Firm B');
  });
});
