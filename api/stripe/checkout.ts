/**
 * POST /api/stripe/checkout
 *
 * Step 23, Commit 4. Admin-only endpoint that mints a Stripe Checkout
 * Session for a law firm + listing + tier combination. Returns the
 * Checkout URL for the admin UI to redirect to.
 *
 * The flow:
 *   1. Admin (Gina or Ryan) opens a firm's detail page in /admin
 *   2. Admin clicks "Start billing" on a listing row
 *   3. UI calls POST /api/stripe/checkout with { lawFirmId, listingId,
 *      tier, priceId }
 *   4. We look up the law_firm's stripeCustomerId (required — must be
 *      created upstream in the onboarding flow), verify the listing
 *      belongs to this firm, then create a Checkout Session.
 *   5. Metadata is stamped with { lawFirmId, listingId, tier } so the
 *      webhook handler in Commit 3 can reconstruct the SubscriptionRow
 *      from checkout.session.completed.
 *   6. We return { url } and the admin UI redirects the firm's browser
 *      to Stripe.
 *
 * Why admin-only rather than firm-side self-serve:
 *   During the pilot phase we (Anthropic side) control who transitions
 *   from pilot → paid. There's no firm-side login yet. Step 25 adds
 *   firm-auth login + a firm-scoped version of this endpoint.
 *
 * Config required (Vercel env):
 *   STRIPE_SECRET_KEY      — sk_test_... or sk_live_...
 *
 * Without it we return 503 with a clear error.
 *
 * Ref: Step 23, Commit 4.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_admin.js';
import { makeClientsFromEnv } from '../_shared.js';

interface CheckoutRequest {
  lawFirmId: string;
  listingId: string;
  /** 'basic' | 'premium' — must match one of the Stripe-side prices. */
  tier: 'basic' | 'premium';
  /** Stripe Price id. UI picks this based on tier + billing interval. */
  priceId: string;
  /** Where Stripe redirects after successful checkout. */
  successUrl?: string;
  /** Where Stripe redirects if the admin clicks back. */
  cancelUrl?: string;
}

function parseBody(body: unknown): CheckoutRequest | { error: string } {
  if (!body || typeof body !== 'object') {
    return { error: 'Request body must be a JSON object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b.lawFirmId !== 'string' || !b.lawFirmId) {
    return { error: 'lawFirmId is required' };
  }
  if (typeof b.listingId !== 'string' || !b.listingId) {
    return { error: 'listingId is required' };
  }
  if (b.tier !== 'basic' && b.tier !== 'premium') {
    return { error: "tier must be 'basic' or 'premium'" };
  }
  if (typeof b.priceId !== 'string' || !b.priceId) {
    return { error: 'priceId is required' };
  }
  return {
    lawFirmId: b.lawFirmId,
    listingId: b.listingId,
    tier: b.tier,
    priceId: b.priceId,
    successUrl: typeof b.successUrl === 'string' ? b.successUrl : undefined,
    cancelUrl: typeof b.cancelUrl === 'string' ? b.cancelUrl : undefined,
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const parsed = parseBody(req.body);
  if ('error' in parsed) {
    return res.status(400).json({ error: parsed.error });
  }

  const clients = makeClientsFromEnv();
  if (!clients.stripe) {
    return res
      .status(503)
      .json({ error: 'STRIPE_SECRET_KEY is not configured' });
  }

  // Look up the firm — we need stripeCustomerId to attach the session.
  const firm = await clients.db.readLawFirmById(parsed.lawFirmId);
  if (!firm) {
    return res.status(404).json({ error: 'Law firm not found' });
  }
  if (!firm.stripeCustomerId) {
    return res.status(400).json({
      error:
        'Law firm has no Stripe customer id. Create the customer in Stripe first (admin onboarding flow) and save it to the firm record.',
    });
  }

  // Verify the listing belongs to this firm. Cheap check but prevents
  // a mis-wired admin UI from attaching a payment to the wrong firm.
  const listing = await clients.db.readListingById(parsed.listingId);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }
  if (listing.lawFirmId !== parsed.lawFirmId) {
    return res.status(400).json({
      error: 'Listing does not belong to the specified law firm',
    });
  }

  // Default redirects — the admin-UI should override these with its
  // own pages, but fall back to something sensible.
  const origin =
    (req.headers.origin as string | undefined) ??
    `https://${req.headers.host ?? 'ada.adalegallink.com'}`;
  const successUrl =
    parsed.successUrl ?? `${origin}/admin/firms/${parsed.lawFirmId}?checkout=success`;
  const cancelUrl =
    parsed.cancelUrl ?? `${origin}/admin/firms/${parsed.lawFirmId}?checkout=cancel`;

  try {
    const result = await clients.stripe.createCheckoutSession({
      customerId: firm.stripeCustomerId,
      priceId: parsed.priceId,
      successUrl,
      cancelUrl,
      metadata: {
        lawFirmId: parsed.lawFirmId,
        listingId: parsed.listingId,
        tier: parsed.tier,
      },
    });
    return res.status(200).json({
      id: result.id,
      url: result.url,
    });
  } catch (err) {
    console.error('[stripe/checkout] create session failed:', err);
    return res.status(502).json({
      error: err instanceof Error ? err.message : 'Stripe request failed',
    });
  }
}
