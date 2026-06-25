/**
 * GET /api/admin/cases?lane=sourcing|general_queue|routed_firm|unplaced
 *
 * The admin cases / placement queue (Phase 3a). Lists the org's cases with an
 * optional lane filter ('unplaced' = sourcing/general_queue with no firm).
 * Admin-only.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv } from '../../_shared.js';
import type { CaseLane } from '../../../src/engine/cases/caseStateMachine.js';

const LANES: ReadonlySet<string> = new Set([
  'routed_firm',
  'sourcing',
  'general_queue',
  'self_help',
  'no_action',
  'unplaced',
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const laneRaw = typeof req.query.lane === 'string' ? req.query.lane : undefined;
  const lane = laneRaw && LANES.has(laneRaw) ? (laneRaw as CaseLane | 'unplaced') : undefined;

  try {
    const clients = makeClientsFromEnv();
    const org = await clients.db.getOrgByCode('adall');
    if (!org) return res.status(500).json({ error: 'Default organization not found' });

    const { cases } = await clients.db.listCasesForAdmin(org.id, lane ? { lane } : undefined);
    return res.status(200).json({
      cases: cases.map((c) => ({
        case_id: c.caseId,
        ada_session_id: c.adaSessionId,
        case_number: c.caseNumber,
        lane: c.lane,
        status: c.status,
        classification_title: c.classificationTitle,
        jurisdiction_state: c.jurisdictionState,
        consent_to_share: c.consentToShare,
        claimant_name: c.claimantName,
        claimant_email: c.claimantEmail,
        case_name: c.caseName,
        firm_id: c.firmId,
        firm_name: c.firmName,
        created_at: c.createdAt,
      })),
    });
  } catch (err) {
    console.error('GET /api/admin/cases failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
