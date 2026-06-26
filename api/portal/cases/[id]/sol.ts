/**
 * PATCH /api/portal/cases/[id]/sol
 *
 * Set (or clear, with null) the attorney-set statute-of-limitations date on a
 * case. ATTORNEY-SET ONLY — the server never computes a limitations deadline
 * (UPL / malpractice). Firm-scoped + consent-gated; writes a SOL_SET activity.
 *
 * Body: { sol_date: "YYYY-MM-DD" | null }. 404 when the case isn't this firm's,
 * 400 on an invalid date.
 *
 * Ref: Phase 5 §7.3.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney } from '../../../_attorney.js';
import { applyCors } from '../../../_cors.js';
import { makeClientsFromEnv } from '../../../_shared.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

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

  const raw = (req.body ?? {}) as { sol_date?: unknown };
  let solDate: string | null;
  if (raw.sol_date === null || raw.sol_date === undefined || raw.sol_date === '') {
    solDate = null;
  } else if (typeof raw.sol_date === 'string' && ISO_DATE.test(raw.sol_date) && !Number.isNaN(Date.parse(raw.sol_date))) {
    solDate = raw.sol_date;
  } else {
    return res.status(400).json({ error: 'sol_date must be a YYYY-MM-DD date or null' });
  }

  try {
    const clients = makeClientsFromEnv();
    const ok = await clients.db.setCaseSolDate({ caseId: id, lawFirmId: auth.lawFirmId, solDate });
    if (!ok) return res.status(404).json({ error: 'Case not found' });
    return res.status(200).json({ sol_date: solDate });
  } catch (err) {
    console.error('PATCH /api/portal/cases/[id]/sol failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
