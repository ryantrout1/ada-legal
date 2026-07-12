/**
 * GET /api/spot/report?slug=…  → { content }  (public)
 *
 * The hosted readout endpoint. Serves report content ONLY when the report is
 * released — pending/rejected drafts 404, so nothing leaks. The 60-bit slug is
 * the capability token (no auth). Ref: /plan Ada Spot Phase 4a.
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
  const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
  if (!slug) return res.status(400).json({ error: 'slug is required' });
  try {
    const report = await makeSpotStore().getReleasedReportBySlug(slug);
    if (!report) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ content: report.content });
  } catch (err) {
    console.error('spot/report failed', err);
    return res.status(500).json({ error: 'Could not load the report.' });
  }
}
