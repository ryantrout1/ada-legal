/**
 * PATCH /api/portal/cases/[id]/engaged
 *
 * Mark that the firm has signed the client, or clear the marker.
 *
 * Fee agreements happen off-platform and the system deliberately stays out of
 * them. This records only that it happened, which is what turns "a firm is
 * looking at this" into "a firm has this case" — and it is the only figure
 * that says whether an intake became actual representation.
 *
 * NOT a pipeline stage. Engagement is orthogonal to status: a matter can be
 * engaged while still investigating, or reach demand_sent unsigned. Keeping it
 * separate avoids forcing a false order onto two independent facts.
 *
 * Body: { engaged: boolean }. Firm-scoped + consent-gated; writes an ENGAGED
 * (or ENGAGEMENT_CLEARED) activity row. 404 when the case isn't this firm's.
 *
 * Ref: Phase 5 §7.5.
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

  const raw = (req.body ?? {}) as { engaged?: unknown };
  if (typeof raw.engaged !== 'boolean') {
    return res.status(400).json({ error: 'engaged must be true or false' });
  }

  try {
    const clients = makeClientsFromEnv();
    const result = await clients.db.setCaseEngaged({
      caseId: id,
      lawFirmId: auth.lawFirmId,
      engaged: raw.engaged,
    });
    if (!result) return res.status(404).json({ error: 'Case not found' });
    return res.status(200).json({ engaged_at: result.engagedAt });
  } catch (err) {
    console.error('PATCH /api/portal/cases/[id]/engaged failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
