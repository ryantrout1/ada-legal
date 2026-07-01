/**
 * /api/admin/firms/[id]
 *
 *   GET   — fetch a single firm
 *   PATCH — update a firm (partial)
 *
 * Admin-only. The firm must exist and belong to the admin's org.
 *
 * Ref: Step 25, Commit 1.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv } from '../../_shared.js';
import { mergeFirmPatch } from '../../../src/engine/firmPatch.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return; // preflight handled

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  const clients = makeClientsFromEnv();
  const org = await clients.db.getOrgByCode('adall');
  if (!org) {
    return res.status(500).json({ error: 'Default organization not found' });
  }

  const existing = await clients.db.readLawFirmById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Firm not found' });
  }
  if (existing.orgId !== org.id) {
    // Cross-org access — treat as not found to avoid leaking existence.
    return res.status(404).json({ error: 'Firm not found' });
  }

  if (req.method === 'GET') {
    // Admin detail view: return firm plus its roster, listings and
    // subscriptions so the detail page can render in one round-trip. All
    // three are small per-firm (tens, not thousands).
    const [attorneys, listings, subscriptions] = await Promise.all([
      clients.db.listAttorneysForFirm(id),
      clients.db.listListingsForFirm(id),
      clients.db.listSubscriptionsForFirm(id),
    ]);
    return res.status(200).json({
      firm: existing,
      attorneys,
      listings,
      subscriptions,
    });
  }

  if (req.method === 'PATCH') {
    const body = (req.body ?? {}) as Record<string, unknown>;

    // Validation + undefined-means-keep merge live in the pure
    // mergeFirmPatch seam (unit-tested) — the handler just maps results.
    const result = mergeFirmPatch(existing, body);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }

    try {
      await clients.db.writeLawFirm(result.updated);
      return res.status(200).json({ firm: result.updated });
    } catch (err) {
      console.error('[admin/firms PATCH] failed:', err);
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  res.setHeader('Allow', 'GET, PATCH');
  return res.status(405).json({ error: 'Method not allowed' });
}
