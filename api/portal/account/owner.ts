/**
 * POST /api/portal/account/owner — owner role actions (owner-only).
 *
 * Actions:
 *   - promote   { attorney_id }     → make a firm member a co-owner
 *   - transfer  { to_attorney_id }  → hand ownership to a bound lawyer; the
 *                                     caller steps down to member
 *   - step_down {}                  → caller steps down (blocked if sole owner)
 *
 * The last-owner guard (canStepDown) ensures a firm is never left ownerless.
 * Every role change writes an audit row via setAttorneyFirmRole.
 *
 * Ref: /plan Phase 3.2, AC6.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireOwner } from '../../_attorney.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv } from '../../_shared.js';
import { canStepDown } from '../../../src/engine/portal/firmOwnership.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireOwner(req, res);
  if (!auth) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body ?? {}) as {
    action?: unknown;
    attorney_id?: unknown;
    to_attorney_id?: unknown;
  };
  const action = typeof body.action === 'string' ? body.action : '';
  const actor = { actorUserId: auth.userId, actorEmail: auth.email };

  try {
    const clients = makeClientsFromEnv();

    if (action === 'promote') {
      const targetId = typeof body.attorney_id === 'string' ? body.attorney_id : '';
      const target = targetId ? await clients.db.getAttorneyForFirm(targetId, auth.lawFirmId) : null;
      if (!target) return res.status(404).json({ error: 'Lawyer not found in your firm' });
      await clients.db.setAttorneyFirmRole(target.id, 'owner', actor);
      return res.status(200).json({ ok: true });
    }

    if (action === 'transfer') {
      const targetId = typeof body.to_attorney_id === 'string' ? body.to_attorney_id : '';
      const target = targetId ? await clients.db.getAttorneyForFirm(targetId, auth.lawFirmId) : null;
      if (!target) return res.status(404).json({ error: 'Lawyer not found in your firm' });
      if (!target.userId) {
        return res
          .status(400)
          .json({ error: 'That lawyer must sign in before they can become the owner' });
      }
      // Promote the target first so an owner always exists, then step down.
      await clients.db.setAttorneyFirmRole(target.id, 'owner', actor);
      await clients.db.setAttorneyFirmRole(auth.attorneyId, 'member', actor);
      return res.status(200).json({ ok: true });
    }

    if (action === 'step_down') {
      const roster = await clients.db.listAttorneysForFirm(auth.lawFirmId);
      if (!canStepDown(roster, auth.attorneyId)) {
        return res
          .status(400)
          .json({ error: 'You are the only owner — make someone else an owner first' });
      }
      await clients.db.setAttorneyFirmRole(auth.attorneyId, 'member', actor);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('POST /api/portal/account/owner failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
