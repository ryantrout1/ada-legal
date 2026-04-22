/**
 * Tests for StripeClient + verifyStripeSignature + StubStripeClient.
 *
 * Same pattern as resendEmailClient.test.ts:
 *   - Mock global fetch
 *   - Assert request shape, retry behavior, error paths
 *   - Test signature verification separately (pure function)
 *
 * Ref: Step 23, Commit 2.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  StripeClient,
  StubStripeClient,
  verifyStripeSignature,
} from '@/engine/clients/stripeClient';

const KEY = 'sk_test_abcdefghijk';

function mockJson(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockStatus(status: number, body = ''): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/plain' },
  });
}

// ─── createCheckoutSession ───────────────────────────────────────────────────

describe('StripeClient.createCheckoutSession', () => {
  const originalFetch = globalThis.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns id + url on success', async () => {
    fetchMock.mockResolvedValueOnce(
      mockJson(200, { id: 'cs_test_abc', url: 'https://checkout.stripe.com/c/pay/cs_test_abc' }),
    );
    const c = new StripeClient(KEY);
    const result = await c.createCheckoutSession({
      customerId: 'cus_123',
      priceId: 'price_basic_monthly',
      successUrl: 'https://example.com/ok',
      cancelUrl: 'https://example.com/cancel',
    });
    expect(result.id).toBe('cs_test_abc');
    expect(result.url).toBe('https://checkout.stripe.com/c/pay/cs_test_abc');
  });

  it('POSTs to /v1/checkout/sessions with form-encoded body', async () => {
    fetchMock.mockResolvedValueOnce(mockJson(200, { id: 'cs_1', url: 'u' }));
    const c = new StripeClient(KEY);
    await c.createCheckoutSession({
      customerId: 'cus_123',
      priceId: 'price_x',
      successUrl: 'https://ok',
      cancelUrl: 'https://cancel',
    });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.stripe.com/v1/checkout/sessions');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe(`Bearer ${KEY}`);
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(init.body).toContain('customer=cus_123');
    expect(init.body).toContain('mode=subscription');
    expect(init.body).toContain('line_items%5B0%5D%5Bprice%5D=price_x');
  });

  it('serializes metadata into nested bracket keys', async () => {
    fetchMock.mockResolvedValueOnce(mockJson(200, { id: 'cs_1', url: 'u' }));
    const c = new StripeClient(KEY);
    await c.createCheckoutSession({
      customerId: 'cus_1',
      priceId: 'price_1',
      successUrl: 'https://ok',
      cancelUrl: 'https://cancel',
      metadata: { lawFirmId: 'lf_abc', listingId: 'l_xyz' },
    });
    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.body).toContain('metadata%5BlawFirmId%5D=lf_abc');
    expect(init.body).toContain('metadata%5BlistingId%5D=l_xyz');
  });

  it('4xx: throws without retry', async () => {
    fetchMock.mockResolvedValueOnce(mockStatus(400, 'Invalid price id'));
    const c = new StripeClient(KEY);
    await expect(
      c.createCheckoutSession({
        customerId: 'cus_1',
        priceId: 'price_bogus',
        successUrl: 'https://ok',
        cancelUrl: 'https://cancel',
      }),
    ).rejects.toThrow(/Stripe 400/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('5xx: retries once then throws', async () => {
    fetchMock
      .mockResolvedValueOnce(mockStatus(503))
      .mockResolvedValueOnce(mockStatus(503));
    const c = new StripeClient(KEY);
    await expect(
      c.createCheckoutSession({
        customerId: 'cus_1',
        priceId: 'price_1',
        successUrl: 'https://ok',
        cancelUrl: 'https://cancel',
      }),
    ).rejects.toThrow(/Stripe 503/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('5xx then 200: succeeds', async () => {
    fetchMock
      .mockResolvedValueOnce(mockStatus(503))
      .mockResolvedValueOnce(mockJson(200, { id: 'cs_2', url: 'u' }));
    const c = new StripeClient(KEY);
    const result = await c.createCheckoutSession({
      customerId: 'cus_1',
      priceId: 'price_1',
      successUrl: 'https://ok',
      cancelUrl: 'https://cancel',
    });
    expect(result.id).toBe('cs_2');
  });
});

// ─── createPortalSession ─────────────────────────────────────────────────────

describe('StripeClient.createPortalSession', () => {
  const originalFetch = globalThis.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns url', async () => {
    fetchMock.mockResolvedValueOnce(
      mockJson(200, { url: 'https://billing.stripe.com/p/abc' }),
    );
    const c = new StripeClient(KEY);
    const result = await c.createPortalSession({
      customerId: 'cus_1',
      returnUrl: 'https://example.com/back',
    });
    expect(result.url).toMatch(/billing\.stripe\.com/);
  });

  it('POSTs to /v1/billing_portal/sessions', async () => {
    fetchMock.mockResolvedValueOnce(mockJson(200, { url: 'u' }));
    const c = new StripeClient(KEY);
    await c.createPortalSession({
      customerId: 'cus_1',
      returnUrl: 'https://ok',
    });
    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.stripe.com/v1/billing_portal/sessions');
  });
});

// ─── cancelSubscription ──────────────────────────────────────────────────────

describe('StripeClient.cancelSubscription', () => {
  const originalFetch = globalThis.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('atPeriodEnd=true POSTs update with cancel_at_period_end', async () => {
    const cancelAt = 1730000000;
    fetchMock.mockResolvedValueOnce(mockJson(200, { cancel_at: cancelAt }));
    const c = new StripeClient(KEY);
    const result = await c.cancelSubscription({
      subscriptionId: 'sub_abc',
      atPeriodEnd: true,
    });
    expect(result.canceled).toBe(true);
    expect(result.cancelAt).toBe(new Date(cancelAt * 1000).toISOString());
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.stripe.com/v1/subscriptions/sub_abc');
    expect(init.method).toBe('POST');
    expect(init.body).toContain('cancel_at_period_end=true');
  });

  it('atPeriodEnd=false DELETEs the subscription', async () => {
    fetchMock.mockResolvedValueOnce(mockJson(200, {}));
    const c = new StripeClient(KEY);
    const result = await c.cancelSubscription({
      subscriptionId: 'sub_abc',
      atPeriodEnd: false,
    });
    expect(result.canceled).toBe(true);
    expect(result.cancelAt).toBeNull();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.stripe.com/v1/subscriptions/sub_abc');
    expect(init.method).toBe('DELETE');
  });

  it('URL-encodes subscription id with special chars', async () => {
    fetchMock.mockResolvedValueOnce(mockJson(200, {}));
    const c = new StripeClient(KEY);
    await c.cancelSubscription({
      subscriptionId: 'sub weird/id',
      atPeriodEnd: false,
    });
    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.stripe.com/v1/subscriptions/sub%20weird%2Fid');
  });
});

// ─── verifyStripeSignature ───────────────────────────────────────────────────

describe('verifyStripeSignature', () => {
  const SECRET = 'whsec_test_0123456789abcdef';

  function signBody(body: string, secret: string, timestamp: number): string {
    const sig = createHmac('sha256', secret)
      .update(`${timestamp}.${body}`, 'utf8')
      .digest('hex');
    return `t=${timestamp},v1=${sig}`;
  }

  it('verifies a well-formed, in-tolerance signature', () => {
    const body = JSON.stringify({
      id: 'evt_test',
      type: 'checkout.session.completed',
      created: 1700000000,
      data: { object: {} },
    });
    const ts = 1700000000;
    const header = signBody(body, SECRET, ts);
    const result = verifyStripeSignature({
      rawBody: body,
      signatureHeader: header,
      secret: SECRET,
      nowSeconds: ts + 30,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.event.id).toBe('evt_test');
    expect(result.event.type).toBe('checkout.session.completed');
  });

  it('rejects weak secret', () => {
    const result = verifyStripeSignature({
      rawBody: '{}',
      signatureHeader: 't=1,v1=abc',
      secret: '',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('secret_invalid');
  });

  it('rejects missing header', () => {
    const result = verifyStripeSignature({
      rawBody: '{}',
      signatureHeader: '',
      secret: SECRET,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('header_missing');
  });

  it('rejects malformed header (no t= or v1=)', () => {
    const result = verifyStripeSignature({
      rawBody: '{}',
      signatureHeader: 'garbage',
      secret: SECRET,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('header_malformed');
  });

  it('rejects stale signature (>tolerance old)', () => {
    const body = '{}';
    const ts = 1700000000;
    const header = signBody(body, SECRET, ts);
    const result = verifyStripeSignature({
      rawBody: body,
      signatureHeader: header,
      secret: SECRET,
      nowSeconds: ts + 400, // >300s tolerance
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('stale');
  });

  it('rejects future signature (>60s ahead)', () => {
    const body = '{}';
    const ts = 1700000000;
    const header = signBody(body, SECRET, ts);
    const result = verifyStripeSignature({
      rawBody: body,
      signatureHeader: header,
      secret: SECRET,
      nowSeconds: ts - 120, // 120s in the past → ts is 120s in future
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('future');
  });

  it('rejects signature with wrong secret', () => {
    const body = '{}';
    const ts = 1700000000;
    const header = signBody(body, SECRET, ts);
    const result = verifyStripeSignature({
      rawBody: body,
      signatureHeader: header,
      secret: 'whsec_DIFFERENT_SECRET',
      nowSeconds: ts,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('signature_mismatch');
  });

  it('rejects tampered body', () => {
    const originalBody = JSON.stringify({ id: 'evt_1' });
    const ts = 1700000000;
    const header = signBody(originalBody, SECRET, ts);
    const result = verifyStripeSignature({
      rawBody: JSON.stringify({ id: 'evt_EVIL' }),
      signatureHeader: header,
      secret: SECRET,
      nowSeconds: ts,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('signature_mismatch');
  });

  it('rejects malformed JSON body even with valid signature', () => {
    const body = 'not-json';
    const ts = 1700000000;
    const header = signBody(body, SECRET, ts);
    const result = verifyStripeSignature({
      rawBody: body,
      signatureHeader: header,
      secret: SECRET,
      nowSeconds: ts,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('body_malformed');
  });

  it('accepts multiple v1 signatures (secret rotation scenario)', () => {
    const body = '{}';
    const ts = 1700000000;
    const sig1 = createHmac('sha256', SECRET)
      .update(`${ts}.${body}`, 'utf8')
      .digest('hex');
    const header = `t=${ts},v1=wrongsig,v1=${sig1}`;
    const result = verifyStripeSignature({
      rawBody: body,
      signatureHeader: header,
      secret: SECRET,
      nowSeconds: ts,
    });
    expect(result.ok).toBe(true);
  });
});

// ─── StubStripeClient ────────────────────────────────────────────────────────

describe('StubStripeClient', () => {
  it('throws on every outbound call with a clear message', async () => {
    const s = new StubStripeClient();
    await expect(
      s.createCheckoutSession({
        customerId: 'c',
        priceId: 'p',
        successUrl: 's',
        cancelUrl: 'c',
      }),
    ).rejects.toThrow(/STRIPE_SECRET_KEY is not configured/);
    await expect(
      s.createPortalSession({ customerId: 'c', returnUrl: 'r' }),
    ).rejects.toThrow(/STRIPE_SECRET_KEY is not configured/);
    await expect(
      s.cancelSubscription({ subscriptionId: 's', atPeriodEnd: false }),
    ).rejects.toThrow(/STRIPE_SECRET_KEY is not configured/);
  });

  it('constructWebhookEvent returns stripe_not_configured (does NOT throw)', () => {
    const s = new StubStripeClient();
    const result = s.constructWebhookEvent({
      rawBody: '{}',
      signatureHeader: 't=1,v1=x',
      secret: 'whsec_x',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('stripe_not_configured');
  });
});
