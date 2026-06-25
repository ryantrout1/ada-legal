/**
 * GET /api/portal/queue
 *
 * The attorney portal landing queue: matched sessions routed to the signed-in
 * attorney's firm, with firm-scoped summary counts and gray-out flags.
 *
 * Query: ?page=N&page_size=M&handled=true|false|all  (default handled=false).
 *
 * Attorney-only (requireAttorney). Firm scoping is enforced server-side via the
 * resolved law_firm_id — the client never supplies a firm id.
 *
 * Ref: .design/attorney-portal.md (GET /api/portal/queue).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney } from '../_attorney.js';
import { applyCors } from '../_cors.js';
import { makeClientsFromEnv } from '../_shared.js';

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
    const result = await clients.db.listCasesForFirm(auth.lawFirmId);

    const row = (c: (typeof result.groups.new)[number]) => ({
      case_id: c.caseId,
      ada_session_id: c.adaSessionId,
      case_number: c.caseNumber,
      status: c.status,
      lane: c.lane,
      case_name: c.caseName,
      classification_title: c.classificationTitle,
      jurisdiction_state: c.jurisdictionState,
      claimant_name: c.claimantName,
      claimant_email: c.claimantEmail,
      claimant_phone: c.claimantPhone,
      routed_at: c.routedAt,
      first_contact_due: c.firstContactDue,
      created_at: c.createdAt,
    });

    return res.status(200).json({
      counts: result.counts,
      groups: {
        new: result.groups.new.map(row),
        working: result.groups.working.map(row),
        resolved: result.groups.resolved.map(row),
      },
    });
  } catch (err) {
    console.error('GET /api/portal/queue failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}


