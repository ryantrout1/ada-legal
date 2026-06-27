/**
 * GET    /api/portal/litigations/[id]   — full detail for the decide-to-accept view
 * POST   /api/portal/litigations/[id]   — opt this firm into a litigation
 * DELETE /api/portal/litigations/[id]   — opt this firm out
 *
 * Firm self-select toggle (Phase 5.x). Firm-scoped: the firm is resolved from
 * the authenticated attorney (requireAttorney), never from the request body,
 * so a firm can only ever change its own opt-in. Any firm member may toggle —
 * role doesn't gate self-select.
 *
 * POST validates the litigation exists and is in a routable status, so a stale
 * client can't pin a draft/closed/archived row. Both verbs are idempotent.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney } from '../../_attorney.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv } from '../../_shared.js';
import { toPortalLitigationDetail } from '../../../src/engine/portal/litigationDetail.js';

// Statuses Ada can match against (mirrors listActiveLitigation's allow-set).
// Opting into anything outside this set is pointless — it never routes.
const ROUTABLE_STATUSES = new Set(['active', 'compliance', 'investigating', 'tracking']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAttorney(req, res);
  if (!auth) return;

  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id =
    typeof req.query.id === 'string'
      ? req.query.id
      : Array.isArray(req.query.id)
        ? req.query.id[0]
        : null;
  if (!id) return res.status(400).json({ error: 'A litigation id is required' });

  try {
    const clients = makeClientsFromEnv();

    if (req.method === 'GET') {
      const lit = await clients.db.getLitigationById(id);
      // 404 for missing OR non-routable — the detail page only exists for
      // catalog items the firm could actually accept.
      if (!lit || !ROUTABLE_STATUSES.has(lit.status)) {
        return res.status(404).json({ error: 'Litigation not found' });
      }
      const assignments = await clients.db.listFirmAssignmentsForFirm(auth.lawFirmId);
      const accepted = assignments.some((a) => a.litigationListingId === id);
      return res.status(200).json(toPortalLitigationDetail(lit, accepted));
    }

    if (req.method === 'POST') {
      const lit = await clients.db.getLitigationById(id);
      if (!lit) return res.status(404).json({ error: 'Litigation not found' });
      if (!ROUTABLE_STATUSES.has(lit.status)) {
        return res.status(409).json({ error: 'This litigation is not accepting firms right now' });
      }
      const assignment = await clients.db.addFirmAssignment({
        litigationListingId: id,
        lawFirmId: auth.lawFirmId,
        assignedByUserId: auth.userId,
      });
      return res.status(200).json({ ok: true, accepted: true, assignment_id: assignment.id });
    }

    // DELETE
    const removed = await clients.db.removeFirmAssignment(id, auth.lawFirmId);
    return res.status(200).json({ ok: true, accepted: false, removed });
  } catch (err) {
    console.error(`${req.method} /api/portal/litigations/[id] failed`, err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
