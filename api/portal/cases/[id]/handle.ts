/**
 * POST /api/portal/cases/[id]/handle
 *
 * Mark a case handled by the signed-in attorney's firm. Idempotent — a second
 * call is a no-op (one-bit state, DO2: permanent in v1). 204 on success.
 *
 * Guarded by the same firm-scoped access boundary as the case detail: the firm
 * must be assigned to the session's litigation row, else 404.
 *
 * Ref: .design/attorney-portal.md (POST /api/portal/cases/[id]/handle).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney } from '../../../_attorney.js';
import { applyCors } from '../../../_cors.js';
import { makeClientsFromEnv } from '../../../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAttorney(req, res);
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

  try {
    const clients = makeClientsFromEnv();

    // Enforce the firm-scoped boundary: the firm must have access to this case
    // (assigned to its litigation row) before it can mark it handled.
    const detail = await clients.db.getPortalCaseForFirm(id, auth.lawFirmId);
    if (!detail) return res.status(404).json({ error: 'Case not found' });

    await clients.db.markFirmSessionHandled(id, auth.lawFirmId, auth.userId);
    return res.status(204).end();
  } catch (err) {
    console.error('POST /api/portal/cases/[id]/handle failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}
