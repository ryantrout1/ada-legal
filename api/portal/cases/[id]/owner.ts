/**
 * PATCH /api/portal/cases/[id]/owner   — reassign the matter owner (Phase 2)
 *
 * Body: { attorney_id }. Firm-scoped via requireAttorney; any firm member may
 * reassign (boutique-firm default — no owner-only gate). setCaseOwnerForFirm
 * guards both the case (must be the firm's + consented) and the target (must be
 * in the firm); null → 404. Writes an OWNER_CHANGED activity.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney } from '../../../_attorney.js';
import { applyCors } from '../../../_cors.js';
import { makeClientsFromEnv } from '../../../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAttorney(req, res);
  if (!auth) return;

  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id =
    typeof req.query.id === 'string'
      ? req.query.id
      : Array.isArray(req.query.id)
        ? req.query.id[0]
        : null;
  if (!id) return res.status(400).json({ error: 'id is required' });

  const body = (typeof req.body === 'object' && req.body ? req.body : {}) as {
    attorney_id?: unknown;
  };
  const attorneyId = typeof body.attorney_id === 'string' ? body.attorney_id : '';
  if (!attorneyId) return res.status(400).json({ error: 'attorney_id is required' });

  try {
    const clients = makeClientsFromEnv();
    const result = await clients.db.setCaseOwnerForFirm({
      caseId: id,
      lawFirmId: auth.lawFirmId,
      attorneyId,
    });
    if (!result) {
      return res.status(404).json({ error: 'Case not found, or that attorney is not in your firm' });
    }
    return res.status(200).json({ assigned_lawyer_id: result.caseRow.assignedLawyerId });
  } catch (err) {
    console.error('PATCH /api/portal/cases/[id]/owner failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
