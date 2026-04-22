/**
 * POST /api/stripe/portal
 *
 * Step 23, Commit 4. Admin-only endpoint that mints a Stripe Customer
 * Portal session URL for a law firm. The firm admin (or us, acting
 * on their behalf) clicks through to manage their subscription:
 * update card, download invoices, cancel.
 *
 * The portal is the intended path for cancellation — we have
 * cancelSubscription on StripeClient for server-initiated cancel
 * (e.g. firm status = 'churned' in our admin), but for firm-driven
 * cancel we hand them the portal URL and let Stripe handle the UX.
 *
 * Flow:
 *   1. Admin opens a firm's detail page.
 *   2. Admin (or firm, later) clicks "Manage billing".
 *   3. UI calls POST /api/stripe/portal with { lawFirmId }.
 *   4. We look up the firm's stripeCustomerId, create a portal
 *      session, return { url }.
 *   5. UI redirects to the URL.
 *
 * Ref: Step 23, Commit 4.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_admin.js';
import { makeClientsFromEnv } from '../_shared.js';

interface PortalRequest {
  lawFirmId: string;
  returnUrl?: string;
}

function parseBody(body: unknown): PortalRequest | { error: string } {
  if (!body || typeof body !== 'object') {
    return { error: 'Request body must be a JSON object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b.lawFirmId !== 'string' || !b.lawFirmId) {
    return { error: 'lawFirmId is required' };
  }
  return {
    lawFirmId: b.lawFirmId,
    returnUrl: typeof b.returnUrl === 'string' ? b.returnUrl : undefined,
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

  const firm = await clients.db.readLawFirmById(parsed.lawFirmId);
  if (!firm) {
    return res.status(404).json({ error: 'Law firm not found' });
  }
  if (!firm.stripeCustomerId) {
    return res.status(400).json({
      error:
        'Law firm has no Stripe customer id. Nothing to manage — no subscription has been created.',
    });
  }

  const origin =
    (req.headers.origin as string | undefined) ??
    `https://${req.headers.host ?? 'ada.adalegallink.com'}`;
  const returnUrl =
    parsed.returnUrl ?? `${origin}/admin/firms/${parsed.lawFirmId}`;

  try {
    const result = await clients.stripe.createPortalSession({
      customerId: firm.stripeCustomerId,
      returnUrl,
    });
    return res.status(200).json({ url: result.url });
  } catch (err) {
    console.error('[stripe/portal] create session failed:', err);
    return res.status(502).json({
      error: err instanceof Error ? err.message : 'Stripe request failed',
    });
  }
}
