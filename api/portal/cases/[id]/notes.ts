/**
 * POST /api/portal/cases/[id]/notes  { body }
 *
 * Append an attorney note to a case (Phase 2d). Attorney-only, firm-scoped.
 * 404 when the case isn't this firm's.
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

  const body = (typeof req.body === 'object' && req.body ? req.body : {}) as { body?: string };
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (!text) return res.status(400).json({ error: 'A note body is required' });
  if (text.length > 5000) return res.status(400).json({ error: 'Note is too long' });

  try {
    const clients = makeClientsFromEnv();
    const ok = await clients.db.addCaseNoteForFirm({ caseId: id, lawFirmId: auth.lawFirmId, body: text });
    if (!ok) return res.status(404).json({ error: 'Case not found' });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('POST /api/portal/cases/[id]/notes failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
