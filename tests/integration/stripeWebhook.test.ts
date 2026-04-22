/**
 * Integration tests for the Stripe webhook dispatcher.
 *
 * We test the business logic directly (dispatchEvent) rather than the
 * HTTP handler because the HTTP surface is thin pass-through. This
 * lets us verify the three subscription-lifecycle handlers without
 * mocking req/res.
 *
 * Also covers idempotency via the DbClient's recordWebhookEvent
 * (Map-based unique guard in the in-memory impl, ON CONFLICT in
 * Neon).
 *
 * Ref: Step 23, Commit 3.
 */

import { describe, it, expect } from 'vitest';
import { dispatchEvent } from '../../api/stripe/webhook.js';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type {
  LawFirmRow,
  ListingRow,
  SubscriptionRow,
} from '@/engine/clients/types';
import type { StripeWebhookEvent } from '@/engine/clients/stripeClient';

const ORG_ID = '00000000-0000-4000-8000-000000000001';
const FIRM_ID = '00000000-0000-4000-8000-000000000a01';
const LIST_ID = '00000000-0000-4000-8000-000000000a02';
const STRIPE_SUB_ID = 'sub_test_abc123';

function makeFirm(overrides: Partial<LawFirmRow> = {}): LawFirmRow {
  return {
    id: FIRM_ID,
    orgId: ORG_ID,
    name: 'Acme ADA Law',
    primaryContact: null,
    email: 'intake@acme.example',
    phone: null,
    stripeCustomerId: 'cus_test_abc',
    status: 'active',
    isPilot: false,
    ...overrides,
  };
}

function makeListing(): ListingRow {
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
  };
}

function checkoutCompletedEvent(overrides: {
  id?: string;
  metadata?: Record<string, string>;
  stripeSubscriptionId?: string | null;
} = {}): StripeWebhookEvent {
  const subId =
    'stripeSubscriptionId' in overrides
      ? overrides.stripeSubscriptionId
      : STRIPE_SUB_ID;
  return {
    id: overrides.id ?? 'evt_checkout_1',
    type: 'checkout.session.completed',
    created: 1700000000,
    data: {
      object: {
        id: 'cs_test_xyz',
        subscription: subId,
        metadata: overrides.metadata ?? {
          lawFirmId: FIRM_ID,
          listingId: LIST_ID,
          tier: 'basic',
        },
      },
    },
  };
}

function subscriptionUpdatedEvent(overrides: {
  id?: string;
  stripeSubId?: string;
  status?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: number | null;
} = {}): StripeWebhookEvent {
  return {
    id: overrides.id ?? 'evt_update_1',
    type: 'customer.subscription.updated',
    created: 1700000001,
    data: {
      object: {
        id: overrides.stripeSubId ?? STRIPE_SUB_ID,
        status: overrides.status ?? 'active',
        cancel_at_period_end: overrides.cancelAtPeriodEnd ?? false,
        current_period_end:
          overrides.currentPeriodEnd !== undefined
            ? overrides.currentPeriodEnd
            : 1800000000,
      },
    },
  };
}

function subscriptionDeletedEvent(overrides: {
  id?: string;
  stripeSubId?: string;
} = {}): StripeWebhookEvent {
  return {
    id: overrides.id ?? 'evt_delete_1',
    type: 'customer.subscription.deleted',
    created: 1700000002,
    data: {
      object: {
        id: overrides.stripeSubId ?? STRIPE_SUB_ID,
        status: 'canceled',
      },
    },
  };
}

// ─── checkout.session.completed ──────────────────────────────────────────────

describe('webhook: checkout.session.completed', () => {
  it('creates a new SubscriptionRow with metadata fields', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm());
    await clients.db.writeListing(makeListing());

    await dispatchEvent(checkoutCompletedEvent(), clients);

    const row = await clients.db.readSubscriptionByStripeId(STRIPE_SUB_ID);
    expect(row).not.toBeNull();
    expect(row!.lawFirmId).toBe(FIRM_ID);
    expect(row!.listingId).toBe(LIST_ID);
    expect(row!.tier).toBe('basic');
    expect(row!.status).toBe('active');
    expect(row!.cancelAtPeriodEnd).toBe(false);
  });

  it('reuses existing id when the stripe sub already has a row', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm());
    await clients.db.writeListing(makeListing());

    const existingId = '00000000-0000-4000-8000-0000000000ff';
    await clients.db.writeSubscription({
      id: existingId,
      lawFirmId: FIRM_ID,
      listingId: LIST_ID,
      stripeSubscriptionId: STRIPE_SUB_ID,
      tier: 'basic',
      status: 'trialing',
      currentPeriodEnd: '2026-05-01T00:00:00.000Z',
      cancelAtPeriodEnd: false,
    });

    await dispatchEvent(checkoutCompletedEvent(), clients);

    const row = await clients.db.readSubscriptionByStripeId(STRIPE_SUB_ID);
    expect(row!.id).toBe(existingId);
    expect(row!.currentPeriodEnd).toBe('2026-05-01T00:00:00.000Z');
    // upgraded from trialing → active after checkout completes
    expect(row!.status).toBe('active');
  });

  it('throws when metadata.lawFirmId is missing', async () => {
    const clients = makeInMemoryClients();
    await expect(
      dispatchEvent(
        checkoutCompletedEvent({ metadata: { tier: 'basic' } }),
        clients,
      ),
    ).rejects.toThrow(/missing metadata\.lawFirmId/);
  });

  it('ignores checkout sessions with no subscription (one-time payment)', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm());
    await dispatchEvent(
      checkoutCompletedEvent({ stripeSubscriptionId: null }),
      clients,
    );
    // No subscription row should have been created
    const all = (clients.db as unknown as { subscriptionRows: SubscriptionRow[] })
      .subscriptionRows;
    expect(all).toHaveLength(0);
  });

  it('defaults tier to basic when not in metadata', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm());
    await dispatchEvent(
      checkoutCompletedEvent({
        metadata: { lawFirmId: FIRM_ID, listingId: LIST_ID },
      }),
      clients,
    );
    const row = await clients.db.readSubscriptionByStripeId(STRIPE_SUB_ID);
    expect(row!.tier).toBe('basic');
  });
});

// ─── customer.subscription.updated ───────────────────────────────────────────

describe('webhook: customer.subscription.updated', () => {
  async function seedExistingSubscription(
    clients: ReturnType<typeof makeInMemoryClients>,
  ): Promise<void> {
    await clients.db.writeLawFirm(makeFirm());
    await clients.db.writeListing(makeListing());
    await clients.db.writeSubscription({
      id: '00000000-0000-4000-8000-0000000000ff',
      lawFirmId: FIRM_ID,
      listingId: LIST_ID,
      stripeSubscriptionId: STRIPE_SUB_ID,
      tier: 'basic',
      status: 'active',
      currentPeriodEnd: '2026-05-01T00:00:00.000Z',
      cancelAtPeriodEnd: false,
    });
  }

  it('syncs status + period + cancel flag', async () => {
    const clients = makeInMemoryClients();
    await seedExistingSubscription(clients);

    await dispatchEvent(
      subscriptionUpdatedEvent({
        status: 'past_due',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: 1800000000, // new period
      }),
      clients,
    );

    const row = await clients.db.readSubscriptionByStripeId(STRIPE_SUB_ID);
    expect(row!.status).toBe('past_due');
    expect(row!.cancelAtPeriodEnd).toBe(true);
    expect(row!.currentPeriodEnd).toBe(new Date(1800000000 * 1000).toISOString());
  });

  it('normalizes unknown statuses to past_due', async () => {
    const clients = makeInMemoryClients();
    await seedExistingSubscription(clients);

    await dispatchEvent(
      subscriptionUpdatedEvent({ status: 'incomplete' }),
      clients,
    );

    const row = await clients.db.readSubscriptionByStripeId(STRIPE_SUB_ID);
    expect(row!.status).toBe('past_due');
  });

  it('no-ops when the sub is unknown (out-of-order delivery)', async () => {
    const clients = makeInMemoryClients();
    // No writeSubscription seeded.

    await dispatchEvent(
      subscriptionUpdatedEvent({ stripeSubId: 'sub_unknown' }),
      clients,
    );

    const row = await clients.db.readSubscriptionByStripeId('sub_unknown');
    expect(row).toBeNull();
  });

  it('preserves listingId + lawFirmId (only mutates status/period/cancel)', async () => {
    const clients = makeInMemoryClients();
    await seedExistingSubscription(clients);

    await dispatchEvent(subscriptionUpdatedEvent({}), clients);

    const row = await clients.db.readSubscriptionByStripeId(STRIPE_SUB_ID);
    expect(row!.lawFirmId).toBe(FIRM_ID);
    expect(row!.listingId).toBe(LIST_ID);
  });

  it('handles null current_period_end', async () => {
    const clients = makeInMemoryClients();
    await seedExistingSubscription(clients);

    await dispatchEvent(
      subscriptionUpdatedEvent({ currentPeriodEnd: null }),
      clients,
    );

    const row = await clients.db.readSubscriptionByStripeId(STRIPE_SUB_ID);
    expect(row!.currentPeriodEnd).toBeNull();
  });
});

// ─── customer.subscription.deleted ───────────────────────────────────────────

describe('webhook: customer.subscription.deleted', () => {
  it('marks existing sub as canceled', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(makeFirm());
    await clients.db.writeListing(makeListing());
    await clients.db.writeSubscription({
      id: '00000000-0000-4000-8000-0000000000ff',
      lawFirmId: FIRM_ID,
      listingId: LIST_ID,
      stripeSubscriptionId: STRIPE_SUB_ID,
      tier: 'basic',
      status: 'active',
      currentPeriodEnd: '2026-05-01T00:00:00.000Z',
      cancelAtPeriodEnd: false,
    });

    await dispatchEvent(subscriptionDeletedEvent(), clients);

    const row = await clients.db.readSubscriptionByStripeId(STRIPE_SUB_ID);
    expect(row!.status).toBe('canceled');
  });

  it('no-ops for unknown sub', async () => {
    const clients = makeInMemoryClients();
    await dispatchEvent(
      subscriptionDeletedEvent({ stripeSubId: 'sub_unknown' }),
      clients,
    );
    // No row should exist
    const row = await clients.db.readSubscriptionByStripeId('sub_unknown');
    expect(row).toBeNull();
  });
});

// ─── Unknown event types ─────────────────────────────────────────────────────

describe('webhook: unknown event types', () => {
  it('ignores unknown event types without throwing', async () => {
    const clients = makeInMemoryClients();
    const weirdEvent: StripeWebhookEvent = {
      id: 'evt_weird',
      type: 'something.we.do.not.handle',
      created: 1700000000,
      data: { object: {} },
    };
    await expect(dispatchEvent(weirdEvent, clients)).resolves.toBeUndefined();
  });
});

// ─── Idempotency via recordWebhookEvent ──────────────────────────────────────

describe('webhook idempotency', () => {
  it('recordWebhookEvent returns inserted=true first time, false on replay', async () => {
    const clients = makeInMemoryClients();
    const row = {
      stripeEventId: 'evt_abc',
      type: 'checkout.session.completed',
      payload: { foo: 'bar' },
    };
    const first = await clients.db.recordWebhookEvent(row);
    const second = await clients.db.recordWebhookEvent(row);
    expect(first.inserted).toBe(true);
    expect(second.inserted).toBe(false);
  });

  it('markWebhookEventProcessed stamps processedAt + error', async () => {
    const clients = makeInMemoryClients();
    await clients.db.recordWebhookEvent({
      stripeEventId: 'evt_xyz',
      type: 'checkout.session.completed',
      payload: {},
    });
    await clients.db.markWebhookEventProcessed('evt_xyz', null);
    const stored = (clients.db as unknown as {
      webhookEvents: Map<string, { processedAt: string | null; error: string | null }>;
    }).webhookEvents.get('evt_xyz');
    expect(stored!.processedAt).not.toBeNull();
    expect(stored!.error).toBeNull();
  });

  it('markWebhookEventProcessed records processing errors', async () => {
    const clients = makeInMemoryClients();
    await clients.db.recordWebhookEvent({
      stripeEventId: 'evt_bad',
      type: 'customer.subscription.updated',
      payload: {},
    });
    await clients.db.markWebhookEventProcessed('evt_bad', 'upstream fault');
    const stored = (clients.db as unknown as {
      webhookEvents: Map<string, { error: string | null }>;
    }).webhookEvents.get('evt_bad');
    expect(stored!.error).toBe('upstream fault');
  });
});
