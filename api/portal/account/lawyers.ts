/**
 * GET /api/portal/account/lawyers — the firm roster (owner-only).
 *
 * Returns every attorney in the owner's firm with a readiness summary, so an
 * owner can see who's on the team and who isn't yet ready to go live. Firm is
 * derived from the session; an owner only ever sees their own firm.
 *
 * Ref: /plan Phase 3.1 (Lawyers in my firm).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireOwner } from '../../_attorney.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv } from '../../_shared.js';
import { computeReadiness } from '../../../src/engine/portal/accountReadiness.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireOwner(req, res);
  if (!auth) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const clients = makeClientsFromEnv();
    const [roster, firm] = await Promise.all([
      clients.db.listAttorneysForFirm(auth.lawFirmId),
      clients.db.readLawFirmById(auth.lawFirmId),
    ]);

    const lawyers = roster.map((a) => {
      const readiness = computeReadiness(a, firm);
      return {
        id: a.id,
        name: a.name,
        email: a.email,
        status: a.status,
        firm_role: a.firmRole ?? 'member',
        is_self: a.id === auth.attorneyId,
        ready: readiness.ready,
        missing_count: readiness.missing.length,
      };
    });

    return res.status(200).json({ lawyers });
  } catch (err) {
    console.error('GET /api/portal/account/lawyers failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
