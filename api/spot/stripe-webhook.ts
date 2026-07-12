/**
 * POST /api/spot/stripe-webhook
 *
 * The ONLY thing that grants paid-state. Verifies the Stripe signature over
 * the raw body (SPOT_STRIPE_WEBHOOK_SECRET), dedups, and on a Spot
 * checkout.session.completed flips the referenced spot_session to paid.
 *
 * This is a SEPARATE Stripe webhook endpoint from the firm one
 * (api/stripe/webhook.ts). Two isolations matter:
 *   1. It reuses only the pure verify (constructWebhookEvent) + dedup
 *      (recordWebhookEvent); the firm StripeClient/handler is untouched.
 *   2. The dedup key is namespaced `spot:<event.id>` so that if Stripe
 *      delivers a firm checkout.session.completed to this endpoint too, we
 *      don't claim the firm's event id and starve the firm webhook (which
 *      dedups on the bare id). resolveSpotCheckoutEvent returns null for any
 *      event lacking metadata.spot_session_id, so firm events are no-ops here.
 *
 * Signatures are HMACs over the EXACT raw body, so body parsing is disabled.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeClientsFromEnv } from '../_shared.js';
import { makeSpotStore } from '../../src/lib/spot/spotStore.js';
import { resolveSpotCheckoutEvent } from '../../src/lib/spot/spotStripe.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req: VercelRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.SPOT_STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(503).json({ error: 'SPOT_STRIPE_WEBHOOK_SECRET not configured' });
  }

  const signatureHeader = (req.headers['stripe-signature'] as string | undefined) ?? '';

  let rawBody: string;
  try {
    rawBody = await readRawBody(req);
  } catch {
    return res.status(400).json({ error: 'Could not read request body' });
  }

  const clients = makeClientsFromEnv();
  if (!clients.stripe) return res.status(503).json({ error: 'Stripe client not configured' });

  const verified = clients.stripe.constructWebhookEvent({ rawBody, signatureHeader, secret: webhookSecret });
  if (!verified.ok) return res.status(400).json({ error: `Invalid signature: ${verified.reason}` });
  const event = verified.event;

  // Idempotency gate — namespaced so we never collide with the firm webhook.
  const { inserted } = await clients.db.recordWebhookEvent({
    stripeEventId: `spot:${event.id}`,
    type: event.type,
    payload: event,
  });
  if (!inserted) return res.status(200).json({ received: true, duplicate: true });

  try {
    const resolved = resolveSpotCheckoutEvent(event);
    if (resolved) {
      await makeSpotStore().markPaid({
        spotSessionId: resolved.spotSessionId,
        paymentIntentId: resolved.paymentIntentId,
        email: resolved.email,
        amountCents: resolved.amountCents,
      });
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error(`spot/stripe-webhook processing failed for ${event.id} (${event.type}):`, err);
    return res.status(500).json({ error: 'processing failed' });
  }
}
