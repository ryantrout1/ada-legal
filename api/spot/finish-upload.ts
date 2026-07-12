/**
 * POST /api/spot/finish-upload
 *
 *   POST { spotSessionId } -> { status, photoCount }
 *
 * Called when the buyer is done adding photos. Counts the uploaded photos and
 * flips the session paid → uploaded (the trigger for report generation in
 * Phase 3 — NOT the payment event). Conditional + idempotent: a second call on
 * an already-uploaded session is a no-op.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../_cors.js';
import { makeSpotStore } from '../../src/lib/spot/spotStore.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const spotSessionId =
    typeof req.body?.spotSessionId === 'string' ? req.body.spotSessionId : '';
  if (!spotSessionId) return res.status(400).json({ error: 'spotSessionId is required' });

  try {
    const store = makeSpotStore();
    const session = await store.getSession(spotSessionId);
    if (!session) return res.status(404).json({ error: 'Not found' });

    const photoCount = await store.countPhotos(spotSessionId);
    if (photoCount === 0) {
      return res.status(400).json({ error: 'Add at least one photo before finishing.' });
    }

    await store.markUploaded({ spotSessionId, photoCount });
    return res.status(200).json({ status: 'uploaded', photoCount });
  } catch (err) {
    console.error('spot/finish-upload failed', err);
    return res.status(500).json({ error: 'Could not finish the upload. Please try again.' });
  }
}
