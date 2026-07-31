/**
 * POST /api/spot/create-checkout
 *
 *   POST {} -> { clientSecret, spotSessionId }
 *
 * Creates a pending_payment spot_session and an embedded Stripe Checkout
 * Session ($79 one-time), then returns the client_secret the browser mounts.
 * The amount is set server-side (SPOT_PRICE_CENTS) — the client never supplies
 * a price. Paid-state is NOT granted here; only the verified webhook flips it.
 *
 * Firewall: uses the standalone spotStripe helper (not the firm StripeClient).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../_cors.js';
import { makeClientsFromEnv } from '../_shared.js';
import { readSpotEnabled } from '../../src/lib/spot/spotAvailability.js';
import { makeSpotStore } from '../../src/lib/spot/spotStore.js';
import { createSpotCheckoutSession } from '../../src/lib/spot/spotStripe.js';

const SPOT_PRICE_CENTS = Number(process.env.SPOT_PRICE_CENTS) || 7900;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const clients = makeClientsFromEnv();

    if (!(await readSpotEnabled(clients.db))) {
      res.setHeader('Retry-After', '3600');
      return res.status(503).json({ error: 'Spot is currently unavailable.' });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) return res.status(503).json({ error: 'Payments are not configured.' });

    const store = makeSpotStore();
    const spotSessionId = await store.createSession({ amountCents: SPOT_PRICE_CENTS });
    const checkout = await createSpotCheckoutSession(secretKey, {
      spotSessionId,
      priceCents: SPOT_PRICE_CENTS,
    });
    await store.setCheckoutSessionId(spotSessionId, checkout.id);

    return res.status(200).json({ clientSecret: checkout.clientSecret, spotSessionId });
  } catch (err) {
    console.error('spot/create-checkout failed', err);
    return res.status(500).json({ error: 'Could not start checkout. Please try again.' });
  }
}
