/**
 * Ada Spot — Stripe (SDK-free, isolated from the firm subscription flow).
 *
 * The repo deliberately avoids the ~1MB stripe SDK: it talks to Stripe's REST
 * API directly and verifies webhooks via raw HMAC (StripeClient). Ada Spot
 * follows the same pattern in its OWN module so the firm subscription client
 * (StripeClient / api/stripe/*) is never touched — a change here can't affect
 * the paying-attorney flow.
 *
 * Paid-state is established only by the verified Spot webhook (see
 * api/spot/stripe-webhook.ts); this module builds the embedded one-time
 * Checkout Session and resolves the completion event. The amount is set
 * server-side here — the client never supplies a price.
 */

import type { StripeWebhookEvent } from '../../engine/clients/stripeClient.js';

export interface SpotCheckoutInput {
  spotSessionId: string;
  priceCents: number;
}

export interface SpotCheckoutSession {
  id: string;
  clientSecret: string;
}

export interface ResolvedSpotCheckout {
  spotSessionId: string;
  paymentIntentId?: string;
  email?: string;
  /**
   * The CARDHOLDER name, not the subject of the report. Stripe collects it
   * for card payments in `payment` mode without being asked. Undefined when
   * Stripe sent nothing usable — see readName.
   */
  name?: string;
  amountCents?: number;
}

/**
 * customer_details is whatever Stripe sent, so this is a boundary.
 *
 * A name arriving as a number, a null, or three spaces has to become
 * undefined here. Downstream it lands in an admin list beside "no buyer on
 * file", and a blank that a reader cannot tell from an absent one is worse
 * than either.
 */
function readName(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed || undefined;
}

/**
 * Build the x-www-form-urlencoded params for an embedded, one-time Checkout
 * Session. `ui_mode=embedded_page` + `redirect_on_completion=never` keeps the whole
 * flow on /spot (client mounts the form, then polls session-status) — no
 * external URLs. Pure + testable.
 */
export function buildSpotCheckoutParams(input: SpotCheckoutInput): URLSearchParams {
  const p = new URLSearchParams();
  p.set('mode', 'payment');
  p.set('ui_mode', 'embedded_page');
  p.set('redirect_on_completion', 'never');
  p.set('line_items[0][price_data][currency]', 'usd');
  p.set('line_items[0][price_data][product_data][name]', 'Spot accessibility report');
  p.set('line_items[0][price_data][unit_amount]', String(input.priceCents));
  p.set('line_items[0][quantity]', '1');
  p.set('metadata[spot_session_id]', input.spotSessionId);
  p.set('payment_intent_data[metadata][spot_session_id]', input.spotSessionId);
  return p;
}

/**
 * Create the embedded Checkout Session via Stripe's REST API. Mirrors
 * StripeClient's auth (Bearer secret, form-encoded) without importing it, so
 * the firm client stays untouched. Returns the client_secret the browser
 * mounts.
 */
export async function createSpotCheckoutSession(
  secretKey: string,
  input: SpotCheckoutInput,
): Promise<SpotCheckoutSession> {
  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: buildSpotCheckoutParams(input).toString(),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Stripe checkout session create failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  const json = (await res.json()) as { id: string; client_secret: string };
  return { id: json.id, clientSecret: json.client_secret };
}

/**
 * Resolve a verified webhook event into the Spot session it settles, or null.
 * Only checkout.session.completed carrying metadata.spot_session_id belongs to
 * Ada Spot; a firm-subscription checkout (no spot_session_id) resolves to null
 * so this handler never touches it.
 */
export function resolveSpotCheckoutEvent(event: StripeWebhookEvent): ResolvedSpotCheckout | null {
  if (event.type !== 'checkout.session.completed') return null;
  const session = event.data?.object ?? {};
  const metadata = (session.metadata as Record<string, unknown> | undefined) ?? {};
  const spotSessionId = typeof metadata.spot_session_id === 'string' ? metadata.spot_session_id : '';
  if (!spotSessionId) return null;

  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : undefined;
  const details = session.customer_details as { email?: unknown; name?: unknown } | undefined;
  const email =
    (details && typeof details.email === 'string' ? details.email : undefined) ??
    (typeof session.customer_email === 'string' ? session.customer_email : undefined);
  const name = readName(details?.name);
  const amountCents = typeof session.amount_total === 'number' ? session.amount_total : undefined;

  return { spotSessionId, paymentIntentId, email, name, amountCents };
}
