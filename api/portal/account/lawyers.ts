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

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clients = makeClientsFromEnv();

  if (req.method === 'POST') {
    try {
      const body = (req.body ?? {}) as { name?: unknown; email?: unknown };
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const email = typeof body.email === 'string' ? body.email.trim() : '';
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }
      const firm = await clients.db.readLawFirmById(auth.lawFirmId);
      if (!firm) return res.status(400).json({ error: 'No firm linked to your account' });

      const existing = await clients.db.listAttorneysForFirm(auth.lawFirmId);
      if (existing.some((a) => (a.email ?? '').toLowerCase() === email.toLowerCase())) {
        return res.status(409).json({ error: 'A lawyer with that email is already in your firm' });
      }

      const created = await clients.db.createAttorney({
        orgId: firm.orgId,
        name,
        email,
        practiceAreas: [],
        lawFirmId: auth.lawFirmId,
        firmRole: 'member',
        status: 'pending',
      });

      return res.status(201).json({
        lawyer: {
          id: created.id,
          name: created.name,
          email: created.email,
          status: created.status,
          firm_role: created.firmRole ?? 'member',
          bound: false,
          is_self: false,
          ready: false,
          missing_count: 0,
        },
      });
    } catch (err) {
      console.error('POST /api/portal/account/lawyers failed', err);
      return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
    }
  }

  try {
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
        bound: !!a.userId,
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
