/**
 * Stripe client.
 *
 * Step 23, Commit 2. Calls the Stripe HTTP API directly via fetch. We
 * don't use the stripe-node SDK because the surface we need is small
 * (Checkout, Portal, cancel, webhook verify) and the SDK bundles ~1 MB
 * of legacy support we don't use elsewhere.
 *
 * Same design pattern as ResendEmailClient (Step 24):
 *   - Real impl (StripeClient) for prod, with STRIPE_SECRET_KEY
 *   - Stub (StubStripeClient) for dev/test when the key is absent;
 *     throws on every call with a clear "not configured" message
 *   - Unified AdaStripeClient interface
 *
 * The four operations we need:
 *   1. createCheckoutSession: redirects firm admin to Stripe Checkout
 *      to pay for a subscription on behalf of their law firm.
 *   2. createPortalSession: redirects firm admin to Stripe Customer
 *      Portal to manage their subscription (update card, cancel,
 *      view invoices).
 *   3. cancelSubscription: server-initiated cancellation (e.g. firm
 *      status changes to 'churned' in admin).
 *   4. constructWebhookEvent: verifies + parses an incoming webhook
 *      payload using the signing secret. Webhook handler uses this.
 *
 * Webhook-signature verification is specified by Stripe:
 *   https://stripe.com/docs/webhooks/signatures
 * The Stripe-Signature header is a list of key-value pairs:
 *   t=<timestamp>,v1=<hmac-sha256 of signed_payload>
 * signed_payload is `${timestamp}.${raw_body}`. We reject signatures
 * older than 5 minutes to prevent replay attacks at the transport
 * layer (there's also app-level idempotency via stripe_webhook_events
 * in Commit 3).
 *
 * Ref: Step 23, Commit 2.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

// ─── Public interface ────────────────────────────────────────────────────────

export interface StripeCheckoutSessionOptions {
  /** Firm's Stripe customer id (created if needed upstream). */
  customerId: string;
  /** Price id corresponding to the chosen tier. */
  priceId: string;
  /** URL to redirect to on successful checkout. */
  successUrl: string;
  /** URL to redirect to if the user clicks back. */
  cancelUrl: string;
  /** Opaque metadata echoed back on webhook events. */
  metadata?: Record<string, string>;
}

export interface StripeCheckoutSessionResult {
  id: string;
  url: string;
}

export interface StripePortalSessionOptions {
  customerId: string;
  returnUrl: string;
}

export interface StripePortalSessionResult {
  url: string;
}

export interface StripeCancelSubscriptionOptions {
  subscriptionId: string;
  /** If true, cancel at period end. Otherwise cancel immediately. */
  atPeriodEnd: boolean;
}

export interface StripeCancelSubscriptionResult {
  canceled: boolean;
  cancelAt: string | null;
}

export interface StripeWebhookVerifyOptions {
  rawBody: string;
  signatureHeader: string;
  secret: string;
  /** Override for tests. Default 300 seconds. */
  toleranceSeconds?: number;
  /** Override for tests. Default now in seconds. */
  nowSeconds?: number;
}

/**
 * A minimal Stripe event shape. We don't type every Stripe event —
 * the webhook handler narrows by type at use site.
 */
export interface StripeWebhookEvent {
  id: string;
  type: string;
  created: number;
  data: {
    object: Record<string, unknown>;
    previous_attributes?: Record<string, unknown>;
  };
}

export type WebhookVerifyResult =
  | { ok: true; event: StripeWebhookEvent }
  | { ok: false; reason: string };

export interface AdaStripeClient {
  createCheckoutSession(
    opts: StripeCheckoutSessionOptions,
  ): Promise<StripeCheckoutSessionResult>;
  createPortalSession(
    opts: StripePortalSessionOptions,
  ): Promise<StripePortalSessionResult>;
  cancelSubscription(
    opts: StripeCancelSubscriptionOptions,
  ): Promise<StripeCancelSubscriptionResult>;
  /**
   * Verify a webhook signature and parse the body. Pure function — no
   * network calls. Safe to call inline in the webhook handler.
   */
  constructWebhookEvent(opts: StripeWebhookVerifyOptions): WebhookVerifyResult;
}

// ─── Real impl ───────────────────────────────────────────────────────────────

export class StripeClient implements AdaStripeClient {
  constructor(private readonly secretKey: string) {}

  async createCheckoutSession(
    opts: StripeCheckoutSessionOptions,
  ): Promise<StripeCheckoutSessionResult> {
    // Stripe expects x-www-form-urlencoded with bracket-nested keys.
    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('customer', opts.customerId);
    params.set('line_items[0][price]', opts.priceId);
    params.set('line_items[0][quantity]', '1');
    params.set('success_url', opts.successUrl);
    params.set('cancel_url', opts.cancelUrl);
    if (opts.metadata) {
      for (const [k, v] of Object.entries(opts.metadata)) {
        params.set(`metadata[${k}]`, v);
      }
    }

    const json = (await this.post(
      '/v1/checkout/sessions',
      params,
    )) as { id: string; url: string };
    return { id: json.id, url: json.url };
  }

  async createPortalSession(
    opts: StripePortalSessionOptions,
  ): Promise<StripePortalSessionResult> {
    const params = new URLSearchParams();
    params.set('customer', opts.customerId);
    params.set('return_url', opts.returnUrl);
    const json = (await this.post(
      '/v1/billing_portal/sessions',
      params,
    )) as { url: string };
    return { url: json.url };
  }

  async cancelSubscription(
    opts: StripeCancelSubscriptionOptions,
  ): Promise<StripeCancelSubscriptionResult> {
    const id = encodeURIComponent(opts.subscriptionId);
    if (opts.atPeriodEnd) {
      // Update the subscription with cancel_at_period_end=true.
      const params = new URLSearchParams();
      params.set('cancel_at_period_end', 'true');
      const json = (await this.post(`/v1/subscriptions/${id}`, params)) as {
        cancel_at: number | null;
      };
      return {
        canceled: true,
        cancelAt: json.cancel_at ? new Date(json.cancel_at * 1000).toISOString() : null,
      };
    }
    // Immediate cancel: DELETE /v1/subscriptions/{id}.
    await this.request(`/v1/subscriptions/${id}`, { method: 'DELETE' });
    return { canceled: true, cancelAt: null };
  }

  constructWebhookEvent(opts: StripeWebhookVerifyOptions): WebhookVerifyResult {
    return verifyStripeSignature(opts);
  }

  // ─── HTTP helpers ────────────────────────────────────────────────────────

  private async post(
    path: string,
    params: URLSearchParams,
  ): Promise<unknown> {
    return this.request(path, {
      method: 'POST',
      body: params.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  private async request(
    path: string,
    init: { method: string; body?: string; headers?: Record<string, string> },
  ): Promise<unknown> {
    // Retry policy: same as ResendEmailClient — one retry on 5xx or
    // network error, no retry on 4xx.
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(`https://api.stripe.com${path}`, {
          method: init.method,
          body: init.body,
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            ...(init.headers ?? {}),
          },
        });
        if (res.ok) {
          // DELETE returns a body too in Stripe's API.
          return await res.json();
        }
        if (res.status >= 400 && res.status < 500) {
          const text = await res.text().catch(() => '');
          throw new NonRetriableStripeError(
            `Stripe ${res.status}: ${text.slice(0, 300)}`,
          );
        }
        lastError = new Error(`Stripe ${res.status}`);
      } catch (err) {
        if (err instanceof NonRetriableStripeError) throw err;
        lastError = err;
        if (attempt === 1) break;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error('Stripe request failed after retry.');
  }
}

class NonRetriableStripeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonRetriableStripeError';
  }
}

// ─── Stub ────────────────────────────────────────────────────────────────────

export class StubStripeClient implements AdaStripeClient {
  private notConfigured(): never {
    throw new Error(
      'StripeClient: STRIPE_SECRET_KEY is not configured. Set it in Vercel env.',
    );
  }
  async createCheckoutSession(
    _opts: StripeCheckoutSessionOptions,
  ): Promise<StripeCheckoutSessionResult> {
    this.notConfigured();
  }
  async createPortalSession(
    _opts: StripePortalSessionOptions,
  ): Promise<StripePortalSessionResult> {
    this.notConfigured();
  }
  async cancelSubscription(
    _opts: StripeCancelSubscriptionOptions,
  ): Promise<StripeCancelSubscriptionResult> {
    this.notConfigured();
  }
  constructWebhookEvent(_opts: StripeWebhookVerifyOptions): WebhookVerifyResult {
    return { ok: false, reason: 'stripe_not_configured' };
  }
}

// ─── Signature verification (pure) ───────────────────────────────────────────

/**
 * Verify a Stripe webhook signature per Stripe's documented scheme.
 * Returns a discriminated result union; never throws under normal use.
 *
 * Algorithm (from Stripe docs):
 *   1. Parse the Stripe-Signature header. It's a comma-separated list
 *      of key=value pairs. We need t (timestamp, seconds) and v1
 *      (HMAC-SHA256 signature, hex-encoded).
 *   2. Compute expected = HMAC-SHA256(secret, `${t}.${rawBody}`).
 *   3. Compare expected against each v1 entry using timing-safe
 *      compare.
 *   4. Check the timestamp is within tolerance of now (replay
 *      protection at transport layer).
 *   5. Parse the raw body as JSON and return the event.
 *
 * Reasons returned on failure:
 *   - secret_invalid     secret arg is missing or too short
 *   - header_missing     Stripe-Signature header empty
 *   - header_malformed   Couldn't parse t= or v1= from header
 *   - signature_mismatch v1 signature didn't match expected
 *   - stale              timestamp older than tolerance (replay?)
 *   - future             timestamp more than 60s in the future
 *   - body_malformed     JSON.parse failed on the raw body
 *   - stripe_not_configured  stub only
 */
export function verifyStripeSignature(
  opts: StripeWebhookVerifyOptions,
): WebhookVerifyResult {
  if (typeof opts.secret !== 'string' || opts.secret.length < 8) {
    return { ok: false, reason: 'secret_invalid' };
  }
  if (typeof opts.signatureHeader !== 'string' || opts.signatureHeader === '') {
    return { ok: false, reason: 'header_missing' };
  }

  // Parse "t=<ts>,v1=<sig>,v1=<sig>..."
  let timestamp: number | null = null;
  const signatures: string[] = [];
  for (const piece of opts.signatureHeader.split(',')) {
    const eqIdx = piece.indexOf('=');
    if (eqIdx < 0) continue;
    const key = piece.slice(0, eqIdx).trim();
    const val = piece.slice(eqIdx + 1).trim();
    if (key === 't') {
      const n = Number(val);
      if (Number.isFinite(n)) timestamp = n;
    } else if (key === 'v1') {
      signatures.push(val);
    }
  }
  if (timestamp === null || signatures.length === 0) {
    return { ok: false, reason: 'header_malformed' };
  }

  // Timing check
  const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000);
  const tolerance = opts.toleranceSeconds ?? 300; // 5 min default
  if (now - timestamp > tolerance) {
    return { ok: false, reason: 'stale' };
  }
  if (timestamp - now > 60) {
    return { ok: false, reason: 'future' };
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${opts.rawBody}`;
  const expected = createHmac('sha256', opts.secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  const expectedBuf = Buffer.from(expected, 'utf8');

  // Match against any v1 entry (timing-safe)
  let matched = false;
  for (const sig of signatures) {
    if (sig.length !== expected.length) continue;
    const sigBuf = Buffer.from(sig, 'utf8');
    if (timingSafeEqual(expectedBuf, sigBuf)) {
      matched = true;
      break;
    }
  }
  if (!matched) {
    return { ok: false, reason: 'signature_mismatch' };
  }

  // Parse body
  let event: StripeWebhookEvent;
  try {
    event = JSON.parse(opts.rawBody) as StripeWebhookEvent;
  } catch {
    return { ok: false, reason: 'body_malformed' };
  }
  return { ok: true, event };
}
