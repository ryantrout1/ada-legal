/**
 * Tests for pilot-mode behavior in listActiveListings + LawFirmRow.
 *
 * Pilot mode is a firm-level flag that lets us onboard firms without a
 * Stripe subscription. A pilot firm's listings surface as "live" to
 * end users immediately, with subscriptionId=null and
 * subscriptionTier='pilot' in the returned row.
 *
 * These tests exercise the in-memory DbClient, which mirrors the
 * v_active_listings view from migration 0005.
 *
 * Ref: Step 23, Commit 1.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type {
  LawFirmRow,
  ListingRow,
  SubscriptionRow,
} from '@/engine/clients/types';

const ORG_ID = '00000000-0000-4000-8000-000000000001';
const FIRM_ID = '00000000-0000-4000-8000-000000000a01';
const LIST_ID = '00000000-0000-4000-8000-000000000a02';

function makeFirm(overrides: Partial<LawFirmRow> = {}): LawFirmRow {
  return {
    id: FIRM_ID,
    orgId: ORG_ID,
    name: 'Acme ADA Law',
    primaryContact: null,
    email: 'intake@acme.example',
    phone: null,
    stripeCustomerId: null,
    status: 'active',
    isPilot: false,
    ...overrides,
  };
}

function makeListing(overrides: Partial<ListingRow> = {}): ListingRow {
  return {
    id: LIST_ID,
    lawFirmId: FIRM_ID,
    title: 'Test case',
    slug: 'test-case',
    category: 'ada_title_iii',
    shortDescription: null,
    fullDescription: null,
    eligibilitySummary: null,
    status: 'published',
    tier: 'basic',
    ...overrides,
  };
}

function makeSub(overrides: Partial<SubscriptionRow> = {}): SubscriptionRow {
  return {
    id: '00000000-0000-4000-8000-000000000b01',
    lawFirmId: FIRM_ID,
    listingId: LIST_ID,
    stripeSubscriptionId: 'sub_test_123',
    tier: 'basic',
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 30 * 86400_000).toISOString(),
    cancelAtPeriodEnd: false,
    ...overrides,
  };
}

describe('pilot mode — listActiveListings', () => {
  it('pilot firm surfaces its listing WITHOUT a subscription', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm({ isPilot: true }));
    await clients.db.writeListing(makeListing());
    // No subscriptions seeded — pilot firm should still surface.

    const rows = await clients.db.listActiveListings();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.isPilot).toBe(true);
    expect(rows[0]!.subscriptionId).toBeNull();
    expect(rows[0]!.subscriptionTier).toBe('pilot');
    expect(rows[0]!.currentPeriodEnd).toBeNull();
  });

  it('non-pilot firm WITHOUT a subscription does NOT surface', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm({ isPilot: false }));
    await clients.db.writeListing(makeListing());

    const rows = await clients.db.listActiveListings();
    expect(rows).toHaveLength(0);
  });

  it('non-pilot firm WITH active subscription surfaces normally', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm({ isPilot: false }));
    await clients.db.writeListing(makeListing());
    await clients.db.writeSubscription(makeSub());

    const rows = await clients.db.listActiveListings();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.isPilot).toBe(false);
    expect(rows[0]!.subscriptionId).toBe('00000000-0000-4000-8000-000000000b01');
    expect(rows[0]!.subscriptionTier).toBe('basic');
  });

  it('pilot firm IGNORES its subscriptions (only one row per listing)', async () => {
    // If a firm is in pilot AND somehow has a paid sub (shouldn't happen
    // in practice but we should handle it), we emit only ONE pilot row.
    // Otherwise flipping from pilot to paid would cause duplicate rows
    // during the transition.
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm({ isPilot: true }));
    await clients.db.writeListing(makeListing());
    await clients.db.writeSubscription(makeSub());

    const rows = await clients.db.listActiveListings();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.isPilot).toBe(true);
    expect(rows[0]!.subscriptionTier).toBe('pilot');
  });

  it('suspended pilot firm does NOT surface', async () => {
    // isPilot doesn't override firm-level status. If the firm is
    // suspended, its listings go dark regardless.
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm({ isPilot: true, status: 'suspended' }));
    await clients.db.writeListing(makeListing());

    const rows = await clients.db.listActiveListings();
    expect(rows).toHaveLength(0);
  });

  it('unpublished listing does NOT surface even with pilot firm', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm({ isPilot: true }));
    await clients.db.writeListing(makeListing({ status: 'draft' }));

    const rows = await clients.db.listActiveListings();
    expect(rows).toHaveLength(0);
  });

  it('writeLawFirm + readLawFirmById round-trips isPilot', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm({ isPilot: true }));
    const row = await clients.db.readLawFirmById(FIRM_ID);
    expect(row).not.toBeNull();
    expect(row!.isPilot).toBe(true);
  });

  it('flipping a firm from pilot to non-pilot removes the listing from active', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm({ isPilot: true }));
    await clients.db.writeListing(makeListing());

    expect(await clients.db.listActiveListings()).toHaveLength(1);

    // Flip pilot off. No subscription yet → listing goes dark.
    await clients.db.writeLawFirm(makeFirm({ isPilot: false }));
    expect(await clients.db.listActiveListings()).toHaveLength(0);

    // Add a subscription → back online, now as a paid listing.
    await clients.db.writeSubscription(makeSub());
    const rows = await clients.db.listActiveListings();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.isPilot).toBe(false);
    expect(rows[0]!.subscriptionTier).toBe('basic');
  });
});
