/**
 * /api/admin/photo-reviews/eval
 *
 *   GET — accuracy rollup of expert reviews grouped by engine (model)
 *         version: confirmations, false positives (over-flagged),
 *         partials, wrong-cites, and missed findings (false negatives).
 *         This is how an engine change is measured before/after.
 *
 * Admin-only.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv } from '../../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const clients = makeClientsFromEnv();
    const rows = await clients.db.getPhotoReviewEvalSummary();
    return res.status(200).json({ rows });
  } catch (err) {
    console.error('GET /api/admin/photo-reviews/eval failed', err);
    return res.status(500).json({ error: 'Failed to compute eval summary' });
  }
}
