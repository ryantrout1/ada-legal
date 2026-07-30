/**
 * GET /api/spot/session-status?id=<spot_session_id>
 *
 *   -> { status, buyerEmail }
 *
 * Server-side truth for the client: after Embedded Checkout's onComplete, the
 * browser polls this until status === 'paid' before unlocking upload. The
 * client's own notion of "paid" is never trusted — this reads the DB, which
 * only the verified webhook can advance.
 *
 * buyerEmail is here so the confirmation screen can name the address a report
 * is going to. getSession already read it; this used to drop it on the floor,
 * which is why that screen promised an email it could not name. The response
 * stays narrow otherwise — this endpoint is unauthenticated, guarded only by
 * the session id being an unguessable uuid, so Stripe ids and amounts do not
 * belong in it.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../_cors.js';
import { makeSpotStore } from '../../src/lib/spot/spotStore.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({ error: 'id is required' });

  try {
    const session = await makeSpotStore().getSession(id);
    if (!session) return res.status(404).json({ error: 'Not found' });
    // buyerEmail is explicitly null, never undefined: undefined vanishes
    // through JSON.stringify, and a missing key reads to the client as "this
    // deploy predates the field" rather than "no address on file".
    return res.status(200).json({ status: session.status, buyerEmail: session.buyerEmail ?? null });
  } catch (err) {
    console.error('spot/session-status failed', err);
    return res.status(500).json({ error: 'Could not read session status.' });
  }
}
