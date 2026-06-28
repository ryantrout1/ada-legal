/**
 * GET /api/portal/firm/attorneys
 *
 * The firm roster as a lightweight {id, name} list — member-accessible (any
 * attorney), unlike /api/portal/account/lawyers which is owner-only. Powers the
 * reassign-owner picker (Phase 2). Firm-scoped via requireAttorney.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney } from '../../_attorney.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv } from '../../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAttorney(req, res);
  if (!auth) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const clients = makeClientsFromEnv();
    const roster = await clients.db.listAttorneysForFirm(auth.lawFirmId);
    const attorneys = roster
      .filter((a) => a.status !== 'archived')
      .map((a) => ({ id: a.id, name: a.name }));
    return res.status(200).json({ attorneys });
  } catch (err) {
    console.error('GET /api/portal/firm/attorneys failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
