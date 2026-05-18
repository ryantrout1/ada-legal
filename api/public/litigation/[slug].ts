/**
 * GET /api/public/litigation/[slug]
 *
 * Public detail endpoint for the /Lawsuits Active Cases page. Returns
 * a single active litigation row joined with the lead attorney's name.
 *
 * Drafts, settled, closed, and archived rows return 404 — same as a
 * nonexistent slug. The same cache headers as the list endpoint apply.
 *
 * Ref: /plan Phase 6a
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeClientsFromEnv } from '../../_shared.js';
import { applyCors } from '../../_cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return; // preflight handled

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
  if (!slug) {
    return res.status(400).json({ error: 'slug is required' });
  }

  try {
    const clients = makeClientsFromEnv();
    const org = await clients.db.getOrgByCode('adall');
    if (!org) {
      return res.status(500).json({ error: 'Default organization not found' });
    }

    const row = await clients.db.readActiveLitigationBySlug({
      orgId: org.id,
      slug,
    });
    if (!row) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.setHeader(
      'Cache-Control',
      'public, max-age=300, s-maxage=900, stale-while-revalidate=86400',
    );
    return res.status(200).json({ litigation: row });
  } catch (err) {
    console.error('[public/litigation/:slug GET] failed:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
