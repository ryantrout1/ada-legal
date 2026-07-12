/**
 * GET /api/spot/admin/report?slug=…  → { report }
 *
 * Internal admin preview: fetch one report's full content. requireAdmin-gated.
 * Ref: /plan Ada Spot Phase 3b.
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
  const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
  if (!slug) return res.status(400).json({ error: 'slug is required' });
  try {
    const report = await makeSpotStore().getReportBySlug(slug);
    if (!report) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ report });
  } catch (err) {
    console.error('spot/admin/report failed', err);
    return res.status(500).json({ error: 'Could not load the report.' });
  }
}
