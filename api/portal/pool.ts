/**
 * GET /api/portal/pool
 *
 * The self-select pool browse (routing rebuild R4). Lists every consented,
 * unclaimed pool case the platform holds, filtered to the states THIS firm
 * covers, as de-identified cards — no claimant name/email/phone. Full contact
 * is revealed only when the firm claims the case (POST pool/[id]/claim), via
 * the normal firm queue / case detail.
 *
 * Firm scope + identity come from requireAttorney — the client never supplies a
 * firm id. Only eligible firms (active + subscribed/pilot) may claim, so an
 * ineligible firm sees an empty list with eligible=false (subscribe to claim).
 *
 * Ref: /plan "Self-select pool (R4)", Phase 1.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney } from '../_attorney.js';
import { applyCors } from '../_cors.js';
import { makeClientsFromEnv } from '../_shared.js';
import { firmCoversState } from '../../src/engine/routing/poolVisibility.js';
import { isFirmEligible } from '../../src/engine/routing/firmEligibility.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAttorney(req, res);
  if (!auth) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const clients = makeClientsFromEnv();
    const firm = await clients.db.readLawFirmById(auth.lawFirmId);
    if (!firm) return res.status(403).json({ error: 'Firm not found' });

    const eligible = isFirmEligible(firm);
    // Ineligible firms can't claim, so we don't surface the pool to them.
    if (!eligible) {
      return res.status(200).json({ eligible: false, cases: [] });
    }

    const all = await clients.db.listPoolCases();
    const cases = all
      .filter((c) => firmCoversState(firm, c.jurisdictionState))
      .map((c) => ({
        id: c.id,
        case_number: c.caseNumber,
        classification_title: c.classificationTitle,
        classification_standard: c.classificationStandard,
        jurisdiction_state: c.jurisdictionState,
        business_name: c.businessName,
        created_at: c.createdAt,
      }));

    return res.status(200).json({ eligible: true, cases });
  } catch (err) {
    console.error('GET /api/portal/pool failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
