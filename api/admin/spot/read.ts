/**
 * /api/admin/spot/read
 *
 *   GET (?id=…) → one free read in full: the analysis it stored (the same
 *   PhotoAnalysisOutput the user was shown) and the URL of its retained photo,
 *   when one survives.
 *
 * This is the read side of the free-reads admin: the list endpoint
 * (/api/admin/spot/reads) returns only metadata, and the photo is now kept for
 * training, so there needs to be a way to see what a given free read actually
 * was — the findings the user saw, next to the photo they uploaded.
 *
 * Admin-gated. photoUrl is null for reads taken before retention was on and for
 * reads whose photo the 90-day sweep has since removed.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeSpotStore } from '../../../src/lib/spot/spotStore.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({ error: 'id is required' });

  try {
    const read = await makeSpotStore().getFreeRead(id);
    if (!read) return res.status(404).json({ error: 'Free read not found' });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ read });
  } catch (err) {
    console.error('/api/admin/spot/read failed', err);
    return res.status(500).json({ error: 'Could not load the free read.' });
  }
}
