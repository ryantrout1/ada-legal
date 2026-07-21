/**
 * POST /api/portal/cases/[id]/contact
 *
 * Attorney self-attests that they have made first contact with the claimant.
 * Stamps cases.contacted_at = now() and writes a CONTACT_LOGGED activity.
 * Firm-scoped + consent-gated; write-once (a second call is a no-op that
 * returns the existing timestamp — self-attest, no un-mark). 404 when the case
 * isn't this firm's or isn't consented.
 *
 * No body. Logging contact is not a status change (the case stays new /
 * investigating / etc), so this is its own single-purpose endpoint rather than
 * a transition — same shape as sol.ts.
 *
 * Ref: /plan contact-logging phase 1.
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
    const result = await clients.db.markCaseContacted({ caseId: id, lawFirmId: auth.lawFirmId });
    if (!result.ok) return res.status(404).json({ error: 'Case not found' });
    return res.status(200).json({ contacted_at: result.contactedAt });
  } catch (err) {
    console.error('POST /api/portal/cases/[id]/contact failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
