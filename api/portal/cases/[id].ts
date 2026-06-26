/**
 * GET /api/portal/cases/[id]
 *
 * Full case package for a single matched session, scoped to the signed-in
 * attorney's firm: contact info, matched case, qualifying-question answers,
 * and the conversation transcript.
 *
 * 404 when the session doesn't exist OR the firm has no assignment for the
 * session's litigation row (the firm-scoped access boundary — a 404, not 403,
 * so we don't leak the existence of out-of-scope cases).
 *
 * Ref: .design/attorney-portal.md (GET /api/portal/cases/[id]).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney } from '../../_attorney.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv } from '../../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAttorney(req, res);
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
    const d = await clients.db.getCaseDetailForFirm(id, auth.lawFirmId);
    if (!d) return res.status(404).json({ error: 'Case not found' });

    return res.status(200).json({
      case_id: d.caseId,
      ada_session_id: d.adaSessionId,
      case_number: d.caseNumber,
      status: d.status,
      lane: d.lane,
      classification_title: d.classificationTitle,
      jurisdiction_state: d.jurisdictionState,
      consent_to_share: d.consentToShare,
      routed_at: d.routedAt,
      first_contact_due: d.firstContactDue,
      created_at: d.createdAt,
      case_name: d.caseName,
      sol_date: d.solDate,
      claimant_name: d.claimantName,
      claimant_email: d.claimantEmail,
      claimant_phone: d.claimantPhone,
      qualifying_answers: d.qualifyingAnswers,
      transcript: d.transcript,
      activity: d.activity.map((a) => ({
        event_type: a.eventType,
        summary: a.summary,
        actor_type: a.actorType,
        created_at: a.createdAt,
      })),
    });
  } catch (err) {
    console.error('GET /api/portal/cases/[id] failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}
