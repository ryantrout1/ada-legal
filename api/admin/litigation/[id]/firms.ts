/**
 * /api/admin/litigation/[id]/firms
 *
 *   GET — list the firms currently assigned to a litigation row
 *   PUT — replace the full assignment set: { law_firm_ids: string[] }
 *
 * Admin-only (requireAdmin — accepts the B44 bridge secret). This is the
 * routing fan-out the attorney portal reads: assigning a firm here surfaces
 * the litigation row's matched sessions in that firm's portal queue (criterion 4).
 *
 * Ref: .design/attorney-portal.md (GET/PUT /api/admin/litigation/[id]/firms).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../../_admin.js';
import { applyCors } from '../../../_cors.js';
import { makeClientsFromEnv } from '../../../_shared.js';
import { readJsonBody } from '../../../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const id =
    typeof req.query.id === 'string'
      ? req.query.id
      : Array.isArray(req.query.id)
      ? req.query.id[0]
      : null;
  if (!id) return res.status(400).json({ error: 'id is required' });

  if (req.method === 'GET') return handleGet(id, res);
  if (req.method === 'PUT') return handlePut(id, req, res, auth.userId);

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(id: string, res: VercelResponse) {
  try {
    const clients = makeClientsFromEnv();
    const assignments = await clients.db.listFirmAssignmentsForLitigation(id);
    return res.status(200).json({ law_firm_ids: assignments.map((a) => a.lawFirmId) });
  } catch (err) {
    console.error('GET /api/admin/litigation/[id]/firms failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}

async function handlePut(
  id: string,
  req: VercelRequest,
  res: VercelResponse,
  assignedByUserId: string | null,
) {
  try {
    const body = readJsonBody<{ law_firm_ids?: unknown }>(req);
    if (!Array.isArray(body.law_firm_ids)) {
      return res.status(400).json({ error: 'law_firm_ids (string[]) is required' });
    }
    const lawFirmIds = body.law_firm_ids.filter((x): x is string => typeof x === 'string');

    const clients = makeClientsFromEnv();
    const assignments = await clients.db.replaceFirmAssignmentsForLitigation(
      id,
      lawFirmIds,
      assignedByUserId,
    );
    return res.status(200).json({ law_firm_ids: assignments.map((a) => a.lawFirmId) });
  } catch (err) {
    console.error('PUT /api/admin/litigation/[id]/firms failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}
