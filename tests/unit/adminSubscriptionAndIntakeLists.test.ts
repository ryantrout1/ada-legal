/**
 * Tests for listAllSubscriptionsForAdmin + listIntakesForAdmin on the
 * in-memory DbClient. Both methods join across firms/listings to
 * resolve display names and enforce org scoping.
 *
 * Ref: Step 25, Commit 6.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type {
  LawFirmRow,
  ListingRow,
  SubscriptionRow,
} from '@/engine/clients/types';
import type { AdaSessionState } from '@/engine/types';

const ORG_A = '00000000-0000-4000-8000-0000000000a1';
const ORG_B = '00000000-0000-4000-8000-0000000000b1';
const FIRM_A1 = '00000000-0000-4000-8000-00000000aa01';
const FIRM_A2 = '00000000-0000-4000-8000-00000000aa02';
const FIRM_B1 = '00000000-0000-4000-8000-00000000bb01';

function firm(
  id: string,
  orgId: string,
  name: string,
  overrides: Partial<LawFirmRow> = {},
): LawFirmRow {
  return {
    id,
    orgId,
    name,
    primaryContact: null,
    email: null,
    phone: null,
    stripeCustomerId: null,
    status: 'active',
    isPilot: false,
    ...overrides,
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
    status: 'published',
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

function intakeSession(
  sessionId: string,
  orgId: string,
  listingId: string | null,
  overrides: Partial<AdaSessionState> = {},
): AdaSessionState {
  return {
    sessionId,
    orgId,
    sessionType: 'class_action_intake',
    status: 'completed',
    readingLevel: 'standard',
    anonSessionId: '00000000-0000-4000-8000-00000000cccc',
    userId: null,
    listingId,
    conversationHistory: [],
    extractedFields: {},
    classification: null,
    metadata: {},
    accessibilitySettings: {},
    isTest: false,
    ...overrides,
  };
}

// ─── listAllSubscriptionsForAdmin ───────────────────────────────────────────

describe('listAllSubscriptionsForAdmin', () => {
  it('scopes to orgId via firm join', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm(FIRM_A1, ORG_A, 'A'));
    await clients.db.writeLawFirm(firm(FIRM_B1, ORG_B, 'B'));
    await clients.db.writeSubscription(
      sub('00000000-0000-4000-8000-000000002101', FIRM_A1),
    );
    await clients.db.writeSubscription(
      sub('00000000-0000-4000-8000-000000002102', FIRM_B1),
    );
    const result = await clients.db.listAllSubscriptionsForAdmin({
      orgId: ORG_A,
    });
    expect(result.subscriptions).toHaveLength(1);
    expect(result.subscriptions[0]!.subscription.lawFirmId).toBe(FIRM_A1);
    expect(result.subscriptions[0]!.lawFirmName).toBe('A');
  });

  it('resolves listing title when subscription is listing-scoped', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm(FIRM_A1, ORG_A, 'A'));
    const LIST_ID = '00000000-0000-4000-8000-000000002201';
    await clients.db.writeListing(listing(LIST_ID, FIRM_A1, 'Hotel fraud'));
    await clients.db.writeSubscription(
      sub('00000000-0000-4000-8000-000000002202', FIRM_A1, { listingId: LIST_ID }),
    );
    const result = await clients.db.listAllSubscriptionsForAdmin({
      orgId: ORG_A,
    });
    expect(result.subscriptions[0]!.listingTitle).toBe('Hotel fraud');
  });

  it('returns null listingTitle when subscription is firm-wide', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm(FIRM_A1, ORG_A, 'A'));
    await clients.db.writeSubscription(
      sub('00000000-0000-4000-8000-000000002301', FIRM_A1),
    );
    const result = await clients.db.listAllSubscriptionsForAdmin({
      orgId: ORG_A,
    });
    expect(result.subscriptions[0]!.listingTitle).toBeNull();
  });

  it('filters by status and tier', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm(FIRM_A1, ORG_A, 'A'));
    await clients.db.writeSubscription(
      sub('00000000-0000-4000-8000-000000002401', FIRM_A1, {
        status: 'active',
        tier: 'basic',
      }),
    );
    await clients.db.writeSubscription(
      sub('00000000-0000-4000-8000-000000002402', FIRM_A1, {
        status: 'canceled',
        tier: 'basic',
      }),
    );
    await clients.db.writeSubscription(
      sub('00000000-0000-4000-8000-000000002403', FIRM_A1, {
        status: 'active',
        tier: 'premium',
      }),
    );

    const activeBasic = await clients.db.listAllSubscriptionsForAdmin({
      orgId: ORG_A,
      status: 'active',
      tier: 'basic',
    });
    expect(activeBasic.subscriptions).toHaveLength(1);
    expect(activeBasic.subscriptions[0]!.subscription.id).toBe(
      '00000000-0000-4000-8000-000000002401',
    );
  });

  it('filters by lawFirmId', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm(FIRM_A1, ORG_A, 'A1'));
    await clients.db.writeLawFirm(firm(FIRM_A2, ORG_A, 'A2'));
    await clients.db.writeSubscription(
      sub('00000000-0000-4000-8000-000000002501', FIRM_A1),
    );
    await clients.db.writeSubscription(
      sub('00000000-0000-4000-8000-000000002502', FIRM_A2),
    );
    const result = await clients.db.listAllSubscriptionsForAdmin({
      orgId: ORG_A,
      lawFirmId: FIRM_A2,
    });
    expect(result.subscriptions).toHaveLength(1);
    expect(result.subscriptions[0]!.lawFirmName).toBe('A2');
  });

  it('returns empty for unknown org', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm(FIRM_A1, ORG_A, 'A'));
    await clients.db.writeSubscription(
      sub('00000000-0000-4000-8000-000000002601', FIRM_A1),
    );
    const result = await clients.db.listAllSubscriptionsForAdmin({
      orgId: '00000000-0000-4000-8000-0000000000ff',
    });
    expect(result.subscriptions).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });
});

// ─── listIntakesForAdmin ────────────────────────────────────────────────────

describe('listIntakesForAdmin', () => {
  it('only includes class_action_intake sessions, not other session types', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm(FIRM_A1, ORG_A, 'A'));
    const LIST_ID = '00000000-0000-4000-8000-000000003101';
    await clients.db.writeListing(listing(LIST_ID, FIRM_A1, 'Listing'));

    await clients.db.writeSession({
      state: intakeSession(
        '00000000-0000-4000-8000-000000003201',
        ORG_A,
        LIST_ID,
      ),
    });
    await clients.db.writeSession({
      state: intakeSession(
        '00000000-0000-4000-8000-000000003202',
        ORG_A,
        null,
        { sessionType: 'public_ada' },
      ),
    });

    const result = await clients.db.listIntakesForAdmin({ orgId: ORG_A });
    expect(result.intakes).toHaveLength(1);
    expect(result.intakes[0]!.sessionId).toBe(
      '00000000-0000-4000-8000-000000003201',
    );
  });

  it('scopes to org via listing → firm chain', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm(FIRM_A1, ORG_A, 'A'));
    await clients.db.writeLawFirm(firm(FIRM_B1, ORG_B, 'B'));
    const A_LIST = '00000000-0000-4000-8000-000000003301';
    const B_LIST = '00000000-0000-4000-8000-000000003302';
    await clients.db.writeListing(listing(A_LIST, FIRM_A1, 'A'));
    await clients.db.writeListing(listing(B_LIST, FIRM_B1, 'B'));

    await clients.db.writeSession({
      state: intakeSession(
        '00000000-0000-4000-8000-000000003401',
        ORG_A,
        A_LIST,
      ),
    });
    await clients.db.writeSession({
      state: intakeSession(
        '00000000-0000-4000-8000-000000003402',
        ORG_B,
        B_LIST,
      ),
    });

    const orgA = await clients.db.listIntakesForAdmin({ orgId: ORG_A });
    expect(orgA.intakes).toHaveLength(1);
    expect(orgA.intakes[0]!.lawFirmName).toBe('A');
  });

  it('excludes is_test sessions by default', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm(FIRM_A1, ORG_A, 'A'));
    const LIST_ID = '00000000-0000-4000-8000-000000003501';
    await clients.db.writeListing(listing(LIST_ID, FIRM_A1, 'L'));

    await clients.db.writeSession({
      state: intakeSession(
        '00000000-0000-4000-8000-000000003601',
        ORG_A,
        LIST_ID,
      ),
    });
    await clients.db.writeSession({
      state: intakeSession(
        '00000000-0000-4000-8000-000000003602',
        ORG_A,
        LIST_ID,
        { isTest: true },
      ),
    });

    const defaultList = await clients.db.listIntakesForAdmin({ orgId: ORG_A });
    expect(defaultList.intakes).toHaveLength(1);
    expect(defaultList.intakes[0]!.isTest).toBe(false);

    const withTest = await clients.db.listIntakesForAdmin({
      orgId: ORG_A,
      includeTest: true,
    });
    expect(withTest.intakes).toHaveLength(2);
  });

  it('filters by outcome (qualified / disqualified)', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm(FIRM_A1, ORG_A, 'A'));
    const LIST_ID = '00000000-0000-4000-8000-000000003701';
    await clients.db.writeListing(listing(LIST_ID, FIRM_A1, 'L'));

    await clients.db.writeSession({
      state: intakeSession(
        '00000000-0000-4000-8000-000000003801',
        ORG_A,
        LIST_ID,
        { metadata: { outcome: 'qualified' } },
      ),
    });
    await clients.db.writeSession({
      state: intakeSession(
        '00000000-0000-4000-8000-000000003802',
        ORG_A,
        LIST_ID,
        { metadata: { outcome: 'disqualified' } },
      ),
    });

    const qualified = await clients.db.listIntakesForAdmin({
      orgId: ORG_A,
      outcome: 'qualified',
    });
    expect(qualified.intakes).toHaveLength(1);
    expect(qualified.intakes[0]!.outcome).toBe('qualified');
  });

  it('filters by lawFirmId through the listing', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm(FIRM_A1, ORG_A, 'A1'));
    await clients.db.writeLawFirm(firm(FIRM_A2, ORG_A, 'A2'));
    const A1_LIST = '00000000-0000-4000-8000-000000003901';
    const A2_LIST = '00000000-0000-4000-8000-000000003902';
    await clients.db.writeListing(listing(A1_LIST, FIRM_A1, 'A1-list'));
    await clients.db.writeListing(listing(A2_LIST, FIRM_A2, 'A2-list'));

    await clients.db.writeSession({
      state: intakeSession(
        '00000000-0000-4000-8000-00000000aa01',
        ORG_A,
        A1_LIST,
      ),
    });
    await clients.db.writeSession({
      state: intakeSession(
        '00000000-0000-4000-8000-00000000aa02',
        ORG_A,
        A2_LIST,
      ),
    });

    const result = await clients.db.listIntakesForAdmin({
      orgId: ORG_A,
      lawFirmId: FIRM_A2,
    });
    expect(result.intakes).toHaveLength(1);
    expect(result.intakes[0]!.lawFirmName).toBe('A2');
  });

  it('returns empty for unknown org', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm(FIRM_A1, ORG_A, 'A'));
    const LIST_ID = '00000000-0000-4000-8000-00000000ab01';
    await clients.db.writeListing(listing(LIST_ID, FIRM_A1, 'L'));
    await clients.db.writeSession({
      state: intakeSession(
        '00000000-0000-4000-8000-00000000ab02',
        ORG_A,
        LIST_ID,
      ),
    });
    const result = await clients.db.listIntakesForAdmin({
      orgId: '00000000-0000-4000-8000-0000000000ff',
    });
    expect(result.intakes).toHaveLength(0);
  });
});
