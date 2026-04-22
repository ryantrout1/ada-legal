/**
 * Tests for the admin-side firm-scoped list queries:
 *   - listListingsForFirm(lawFirmId) — every listing for that firm,
 *     any status, newest first.
 *   - listSubscriptionsForFirm(lawFirmId) — every Stripe subscription
 *     row for that firm, any status, newest first.
 *
 * Used by the firm detail page at /admin/firms/:id.
 *
 * Ref: Step 25, Commit 2.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type {
  LawFirmRow,
  ListingRow,
  SubscriptionRow,
} from '@/engine/clients/types';

const ORG = '00000000-0000-4000-8000-0000000000a1';
const FIRM_A = '00000000-0000-4000-8000-00000000aa01';
const FIRM_B = '00000000-0000-4000-8000-00000000aa02';

function firm(id: string, name: string): LawFirmRow {
  return {
    id,
    orgId: ORG,
    name,
    primaryContact: null,
    email: null,
    phone: null,
    stripeCustomerId: null,
    status: 'active',
    isPilot: false,
  };
}

function listing(
  id: string,
  lawFirmId: string,
  title: string,
  overrides: Partial<ListingRow> = {},
): ListingRow {
  return {
    id,
    lawFirmId,
    title,
    slug: title.toLowerCase().replace(/\s+/g, '-'),
    category: 'ada_title_iii',
    shortDescription: null,
    fullDescription: null,
    eligibilitySummary: null,
    status: 'draft',
    tier: 'basic',
    ...overrides,
  };
}

function sub(
  id: string,
  lawFirmId: string,
  overrides: Partial<SubscriptionRow> = {},
): SubscriptionRow {
  return {
    id,
    lawFirmId,
    listingId: null,
    stripeSubscriptionId: null,
    tier: 'basic',
    status: 'active',
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    ...overrides,
  };
}

// ─── listListingsForFirm ────────────────────────────────────────────────────

describe('listListingsForFirm', () => {
  it('returns listings belonging to the firm only', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm(FIRM_A, 'A'));
    await clients.db.writeLawFirm(firm(FIRM_B, 'B'));
    await clients.db.writeListing(
      listing('00000000-0000-4000-8000-00000000bb01', FIRM_A, 'A one'),
    );
    await clients.db.writeListing(
      listing('00000000-0000-4000-8000-00000000bb02', FIRM_A, 'A two'),
    );
    await clients.db.writeListing(
      listing('00000000-0000-4000-8000-00000000bb03', FIRM_B, 'B one'),
    );
    const result = await clients.db.listListingsForFirm(FIRM_A);
    expect(result).toHaveLength(2);
    expect(result.every((l) => l.lawFirmId === FIRM_A)).toBe(true);
  });

  it('includes listings of every status (draft + published + archived)', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm(FIRM_A, 'A'));
    await clients.db.writeListing(
      listing('00000000-0000-4000-8000-00000000bc01', FIRM_A, 'Draft one', {
        status: 'draft',
      }),
    );
    await clients.db.writeListing(
      listing('00000000-0000-4000-8000-00000000bc02', FIRM_A, 'Published one', {
        status: 'published',
      }),
    );
    await clients.db.writeListing(
      listing('00000000-0000-4000-8000-00000000bc03', FIRM_A, 'Archived one', {
        status: 'archived',
      }),
    );
    const result = await clients.db.listListingsForFirm(FIRM_A);
    expect(result).toHaveLength(3);
    expect(new Set(result.map((l) => l.status))).toEqual(
      new Set(['draft', 'published', 'archived']),
    );
  });

  it('returns empty array for firm with no listings', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm(FIRM_A, 'A'));
    const result = await clients.db.listListingsForFirm(FIRM_A);
    expect(result).toEqual([]);
  });

  it('returns empty array for unknown firm id', async () => {
    const clients = makeInMemoryClients();
    const result = await clients.db.listListingsForFirm(
      '00000000-0000-4000-8000-00000000ffff',
    );
    expect(result).toEqual([]);
  });
});

// ─── listSubscriptionsForFirm ───────────────────────────────────────────────

describe('listSubscriptionsForFirm', () => {
  it('returns subscriptions belonging to the firm only', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm(FIRM_A, 'A'));
    await clients.db.writeLawFirm(firm(FIRM_B, 'B'));
    await clients.db.writeSubscription(
      sub('00000000-0000-4000-8000-00000000cc01', FIRM_A),
    );
    await clients.db.writeSubscription(
      sub('00000000-0000-4000-8000-00000000cc02', FIRM_A),
    );
    await clients.db.writeSubscription(
      sub('00000000-0000-4000-8000-00000000cc03', FIRM_B),
    );
    const result = await clients.db.listSubscriptionsForFirm(FIRM_A);
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.lawFirmId === FIRM_A)).toBe(true);
  });

  it('includes subscriptions of every status (active, canceled, past_due)', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm(FIRM_A, 'A'));
    await clients.db.writeSubscription(
      sub('00000000-0000-4000-8000-00000000cd01', FIRM_A, { status: 'active' }),
    );
    await clients.db.writeSubscription(
      sub('00000000-0000-4000-8000-00000000cd02', FIRM_A, { status: 'canceled' }),
    );
    await clients.db.writeSubscription(
      sub('00000000-0000-4000-8000-00000000cd03', FIRM_A, { status: 'past_due' }),
    );
    const result = await clients.db.listSubscriptionsForFirm(FIRM_A);
    expect(result).toHaveLength(3);
    expect(new Set(result.map((s) => s.status))).toEqual(
      new Set(['active', 'canceled', 'past_due']),
    );
  });

  it('returns empty array for firm with no subscriptions', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm(FIRM_A, 'A'));
    const result = await clients.db.listSubscriptionsForFirm(FIRM_A);
    expect(result).toEqual([]);
  });
});
