/**
 * POST /api/portal/pool/[id]/claim
 *
 * Atomically claim a pool case for this firm (routing rebuild R4). First click
 * wins: the DB guard (lane='pool' AND firm_id IS NULL AND consented) means
 * exactly one concurrent claim succeeds; a lost race gets 409. On success the
 * case becomes this firm's normal worked case (firm_id + assigned + status
 * 'investigating') and shows in the firm's queue with full claimant contact.
 *
 * Eligible firms only (active + subscribed/pilot) — an unvetted firm can't grab
 * a claimant's case + PII. Firm + attorney come from requireAttorney.
 *
 * Ref: /plan "Self-select pool (R4)", Phase 1.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney } from '../../../_attorney.js';
import { applyCors } from '../../../_cors.js';
import { makeClientsFromEnv } from '../../../_shared.js';
import { isFirmEligible } from '../../../../src/engine/routing/firmEligibility.js';

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
    const firm = await clients.db.readLawFirmById(auth.lawFirmId);
    if (!firm) return res.status(403).json({ error: 'Firm not found' });
    if (!isFirmEligible(firm)) {
      return res.status(403).json({ error: 'This firm is not eligible to claim pool cases' });
    }

    const result = await clients.db.claimPoolCase({
      caseId: id,
      lawFirmId: auth.lawFirmId,
      attorneyId: auth.attorneyId,
    });
    if (!result) {
      // Lost the race, already claimed, not a pool case, or not consented.
      return res.status(409).json({ error: 'This case is no longer available to claim' });
    }

    return res.status(200).json({ ok: true, case_id: result.caseRow.id });
  } catch (err) {
    console.error('POST /api/portal/pool/[id]/claim failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
