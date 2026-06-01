/**
 * /api/admin/photo-analyses/[id]
 *
 *   GET — full analysis (findings, scene, summary, risk, positives) plus
 *         any existing expert review, for the review detail page.
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

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({ error: 'Missing analysis id' });

  try {
    const clients = makeClientsFromEnv();
    const detail = await clients.db.getPhotoAnalysisForReview(id);
    if (!detail) return res.status(404).json({ error: 'Analysis not found' });
    return res.status(200).json(detail);
  } catch (err) {
    console.error('GET /api/admin/photo-analyses/[id] failed', err);
    return res.status(500).json({ error: 'Failed to load analysis' });
  }
}
