/**
 * GET /api/spot/admin/reports  → { reports: [...] }
 *
 * Internal admin preview: list recent Ada Spot reports for review + the model
 * A/B. requireAdmin-gated (Clerk session or bridge secret). Own surface — NOT
 * the bench /admin/photo-review. Ref: /plan Ada Spot Phase 3b.
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
  try {
    const reports = await makeSpotStore().listReports(100);
    return res.status(200).json({ reports });
  } catch (err) {
    console.error('spot/admin/reports failed', err);
    return res.status(500).json({ error: 'Could not load reports.' });
  }
}
