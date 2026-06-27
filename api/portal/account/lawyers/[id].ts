/**
 * GET /api/portal/account/lawyers/[id] — one lawyer's profile (owner-only).
 *
 * Read-only view of a firm lawyer's full profile + go-live readiness, scoped
 * to the owner's firm: getAttorneyForFirm returns null for any attorney
 * outside the firm, which we surface as 404. Same shape as the lawyer's own
 * Account so the owner sees exactly what that lawyer sees.
 *
 * Ref: /plan Phase 3.1.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireOwner } from '../../../_attorney.js';
import { applyCors } from '../../../_cors.js';
import { makeClientsFromEnv } from '../../../_shared.js';
import { computeReadiness } from '../../../../src/engine/portal/accountReadiness.js';
import { toAccountAttorney, toAccountFirm } from '../../../../src/engine/portal/accountView.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireOwner(req, res);
  if (!auth) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
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
    const attorney = await clients.db.getAttorneyForFirm(id, auth.lawFirmId);
    if (!attorney) return res.status(404).json({ error: 'Lawyer not found in your firm' });
    const firm = await clients.db.readLawFirmById(auth.lawFirmId);

    return res.status(200).json({
      attorney: toAccountAttorney(attorney),
      firm: firm ? toAccountFirm(firm) : null,
      readiness: computeReadiness(attorney, firm),
      bound: !!attorney.userId,
    });
  } catch (err) {
    console.error('GET /api/portal/account/lawyers/[id] failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
