/**
 * POST /api/spot/admin/reject  { slug }  → { rejected }
 *
 * requireAdmin. Rejects a pending report (no email; session stays in_review so
 * the reviewer can regenerate a better one via the A/B). Ref: /plan 4a.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { readJsonBody } from '../../_shared.js';
import { makeSpotStore } from '../../../src/lib/spot/spotStore.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const body = readJsonBody<{ slug?: unknown }>(req);
  const slug = typeof body?.slug === 'string' ? body.slug : '';
  if (!slug) return res.status(400).json({ error: 'slug is required' });
  try {
    const rejected = await makeSpotStore().rejectReport({ slug, reviewedBy: auth.email ?? 'admin' });
    return res.status(200).json({ rejected });
  } catch (err) {
    console.error('spot/admin/reject failed', err);
    return res.status(500).json({ error: 'Could not reject the report.' });
  }
}
