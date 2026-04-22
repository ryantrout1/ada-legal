/**
 * POST /api/stripe/webhook
 *
 * Step 23, Commit 3. Receives Stripe webhook events, verifies the
 * signature, dedups on stripe_event_id, and syncs the three
 * subscription-lifecycle events into our subscriptions table.
 *
 * Vercel Node function body-parsing note:
 *   Stripe signatures are HMACs over the EXACT raw request body. If
 *   we let Vercel/body-parser turn it into JSON we lose whitespace
 *   and the signature check fails. We disable body parsing via the
 *   exported `config.api.bodyParser = false` and read the stream
 *   ourselves into a string.
 *
 * Events we handle (all others ACK'd + ignored):
 *   - checkout.session.completed
 *       Checkout has finished paying. We look up the subscription
 *       object by stripe id and UPSERT a SubscriptionRow so
 *       v_active_listings picks it up.
 *
 *   - customer.subscription.updated
 *       Status/period/cancel-at-period-end changed. Sync those
 *       fields into the existing row. No-op if we have no row
 *       (Stripe sent us a sub we don't know about — log, 200).
 *
 *   - customer.subscription.deleted
 *       Subscription fully ended. Mark status='canceled'.
 *
 * Idempotency:
 *   Every event is INSERT'd into stripe_webhook_events FIRST. If the
 *   insert collides on stripe_event_id (replay), we respond 200
 *   immediately without processing again. Stripe retries on 5xx or
 *   timeouts for up to 3 days, so this matters — without it a
 *   transient network hiccup could double-write a subscription.
 *
 * Response codes (per Stripe best practices):
 *   200 — processed, or was already processed, or ignored-event-type
 *   400 — bad signature or malformed body
 *   500 — internal error processing the event (Stripe retries)
 *
 * Ref: Step 23, Commit 3.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeClientsFromEnv } from '../_shared.js';
import type { StripeWebhookEvent } from '../../src/engine/clients/stripeClient.js';
import type {
  AdaClients,
  SubscriptionRow,
} from '../../src/engine/clients/types.js';

// Disable default body parsing so we can read the raw body for
// signature verification.
export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req: VercelRequest): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Uint8Array));
  }
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Return 503 rather than 500 so Stripe retries until ops fixes
    // the env var. 500 also retries but implies a code bug.
    return res
      .status(503)
      .json({ error: 'STRIPE_WEBHOOK_SECRET not configured' });
  }

  const sigHeader =
    (req.headers['stripe-signature'] as string | undefined) ?? '';

  let rawBody: string;
  try {
    rawBody = await readRawBody(req);
  } catch (err) {
    console.error('[stripe/webhook] failed to read body:', err);
    return res.status(400).json({ error: 'Could not read request body' });
  }

  const clients = makeClientsFromEnv();
  if (!clients.stripe) {
    // Should not happen when STRIPE_WEBHOOK_SECRET is set, but guard.
    return res.status(503).json({ error: 'Stripe client not configured' });
  }

  const verifyResult = clients.stripe.constructWebhookEvent({
    rawBody,
    signatureHeader: sigHeader,
    secret: webhookSecret,
  });
  if (!verifyResult.ok) {
    console.warn(
      `[stripe/webhook] signature verify failed: ${verifyResult.reason}`,
    );
    return res.status(400).json({ error: `verify_failed: ${verifyResult.reason}` });
  }

  const event = verifyResult.event;

  // Idempotency gate: try to insert event. If already present, no-op.
  const { inserted } = await clients.db.recordWebhookEvent({
    stripeEventId: event.id,
    type: event.type,
    payload: event,
  });
  if (!inserted) {
    console.log(`[stripe/webhook] replay ignored: ${event.id}`);
    return res.status(200).json({ received: true, replay: true });
  }

  // Process business logic. Each handler is responsible for catching
  // its own errors so we can record processing status on the event
  // row, then surface 500 to Stripe for retry.
  let processingError: string | null = null;
  try {
    await dispatchEvent(event, clients);
  } catch (err) {
    processingError = err instanceof Error ? err.message : String(err);
    console.error(
      `[stripe/webhook] processing failed for ${event.id} (${event.type}):`,
      err,
    );
  }

  // Record final status on the event row (best-effort; don't fail the
  // response on logging).
  try {
    await clients.db.markWebhookEventProcessed(event.id, processingError);
  } catch (err) {
    console.error('[stripe/webhook] mark-processed failed:', err);
  }

  if (processingError) {
    return res.status(500).json({
      received: true,
      processed: false,
      error: processingError,
    });
  }
  return res.status(200).json({ received: true, processed: true });
}

// ─── Event dispatch ──────────────────────────────────────────────────────────

export async function dispatchEvent(
  event: StripeWebhookEvent,
  clients: AdaClients,
): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event, clients);
      return;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event, clients);
      return;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event, clients);
      return;
    default:
      // Explicitly ACK unknown events. Stripe expects a 200 — if we
      // 404'd these Stripe would retry for 3 days filling our logs.
      console.log(`[stripe/webhook] ignoring event type: ${event.type}`);
      return;
  }
}

// ─── Handlers ────────────────────────────────────────────────────────────────

/**
 * checkout.session.completed fires after Checkout succeeds. The
 * session object includes a subscription id (for subscription mode).
 * We use it plus the metadata we stamped at createCheckoutSession
 * time to build a SubscriptionRow.
 */
async function handleCheckoutCompleted(
  event: StripeWebhookEvent,
  clients: AdaClients,
): Promise<void> {
  const session = event.data.object as Record<string, unknown>;
  const stripeSubId = session.subscription as string | null;
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  if (!stripeSubId) {
    // Session without a subscription (one-time payment or setup mode) —
    // not something we use for Ada. Ignore.
    return;
  }
  const lawFirmId = metadata.lawFirmId;
  const listingId = metadata.listingId ?? null;
  const tier = (metadata.tier as SubscriptionRow['tier']) ?? 'basic';
  if (!lawFirmId) {
    throw new Error(
      `checkout.session.completed missing metadata.lawFirmId on session ${session.id}`,
    );
  }

  // If we already have a row for this stripe sub, reuse its id; else
  // generate a new one. We rely on the existing writeSubscription
  // upsert semantics (unique key on stripeSubscriptionId).
  const existing = await clients.db.readSubscriptionByStripeId(stripeSubId);
  const row: SubscriptionRow = {
    id: existing?.id ?? clients.random.uuid(),
    lawFirmId,
    listingId,
    stripeSubscriptionId: stripeSubId,
    tier,
    status: 'active',
    // checkout.session.completed doesn't carry period_end — that
    // arrives on the subsequent customer.subscription.updated event.
    currentPeriodEnd: existing?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: false,
  };
  await clients.db.writeSubscription(row);
}

/**
 * customer.subscription.updated fires for every subscription state
 * change: period rolls forward, status transitions, cancel_at_period_end
 * toggles, etc. Sync the current values into our row.
 */
async function handleSubscriptionUpdated(
  event: StripeWebhookEvent,
  clients: AdaClients,
): Promise<void> {
  const sub = event.data.object as Record<string, unknown>;
  const stripeSubId = sub.id as string;
  const existing = await clients.db.readSubscriptionByStripeId(stripeSubId);
  if (!existing) {
    // We got an update for a sub we never saw a checkout for. Log
    // and move on — possible out-of-order delivery (webhook retry
    // race).
    console.warn(
      `[stripe/webhook] subscription.updated for unknown sub ${stripeSubId}; ignoring`,
    );
    return;
  }

  const status = normalizeStatus(sub.status as string);
  const cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
  const currentPeriodEnd = (sub.current_period_end as number | null)
    ? new Date((sub.current_period_end as number) * 1000).toISOString()
    : null;

  await clients.db.writeSubscription({
    ...existing,
    status,
    cancelAtPeriodEnd,
    currentPeriodEnd,
  });
}

/**
 * customer.subscription.deleted fires after the subscription fully
 * ends (either immediate cancel, or after cancel_at_period_end
 * rolled through). Mark local row canceled; the view stops
 * surfacing the listing.
 */
async function handleSubscriptionDeleted(
  event: StripeWebhookEvent,
  clients: AdaClients,
): Promise<void> {
  const sub = event.data.object as Record<string, unknown>;
  const stripeSubId = sub.id as string;
  const existing = await clients.db.readSubscriptionByStripeId(stripeSubId);
  if (!existing) {
    console.warn(
      `[stripe/webhook] subscription.deleted for unknown sub ${stripeSubId}; ignoring`,
    );
    return;
  }
  await clients.db.writeSubscription({
    ...existing,
    status: 'canceled',
  });
}

function normalizeStatus(raw: string): SubscriptionRow['status'] {
  const allowed: SubscriptionRow['status'][] = [
    'active',
    'trialing',
    'past_due',
    'canceled',
    'unpaid',
  ];
  if ((allowed as string[]).includes(raw)) {
    return raw as SubscriptionRow['status'];
  }
  // Stripe has 'incomplete', 'incomplete_expired', 'paused' — treat as
  // past_due for our purposes (not active, not hard-canceled).
  return 'past_due';
}
