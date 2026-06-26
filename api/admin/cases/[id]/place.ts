/**
 * POST /api/admin/cases/[id]/place  { firm_id }
 *
 * Place an unplaced case to a firm (Phase 3b): sets firm_id + lane=routed_firm
 * + SLA, writes a PLACED activity. The case then appears in that firm's
 * workspace queue once consented. Admin-only. 404 when case/firm not in org.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../../_admin.js';
import { applyCors } from '../../../_cors.js';
import { makeClientsFromEnv } from '../../../_shared.js';
import { sendPlacementNotification } from '../../../../src/engine/notifications/routingNotifications.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id =
    typeof req.query.id === 'string'
      ? req.query.id
      : Array.isArray(req.query.id)
        ? req.query.id[0]
        : null;
  if (!id) return res.status(400).json({ error: 'id is required' });

  const body = (typeof req.body === 'object' && req.body ? req.body : {}) as { firm_id?: string };
  const firmId = typeof body.firm_id === 'string' ? body.firm_id : '';
  if (!firmId) return res.status(400).json({ error: 'firm_id is required' });

  try {
    const clients = makeClientsFromEnv();
    const org = await clients.db.getOrgByCode('adall');
    if (!org) return res.status(500).json({ error: 'Default organization not found' });

    const result = await clients.db.placeCaseToFirm({ caseId: id, orgId: org.id, firmId });
    if (!result) return res.status(404).json({ error: 'Case or firm not found' });

    await clients.audit.log({
      orgId: org.id,
      actorType: auth.via === 'clerk' ? 'user' : 'system',
      actorId: auth.userId,
      action: 'case.placed',
      resourceType: 'case',
      resourceId: id,
      metadata: { firmId },
    });

    // Phase 3 fast-follow: notify the firm it's been matched. Self-gates on
    // consent (an unconsented placement no-ops; the later consent fires the
    // firm + claimant emails instead). Isolated soft-fail — never blocks the
    // placement response.
    try {
      await sendPlacementNotification({ email: clients.email, db: clients.db }, result.caseRow);
    } catch (notifyErr) {
      console.error('placement notification failed', notifyErr);
    }

    return res.status(200).json({ ok: true, lane: result.caseRow.lane, firm_id: firmId });
  } catch (err) {
    console.error('POST /api/admin/cases/[id]/place failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
