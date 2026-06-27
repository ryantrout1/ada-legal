/**
 * POST /api/portal/cases/[id]/transition
 *
 * Drive a case through the workspace lifecycle (Phase 2c). Body:
 *   { action: 'accept'|'decline'|'send_demand'|'begin_negotiation'|'resolve',
 *     reason?, resolution_type?, resolution_notes? }
 *
 * Attorney-only, firm-scoped server-side. 404 when the case isn't this firm's
 * (or isn't consented); 409 on an illegal transition for the current status.
 *
 * Ref: /plan Phase 2c.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney } from '../../../_attorney.js';
import { applyCors } from '../../../_cors.js';
import { makeClientsFromEnv } from '../../../_shared.js';
import {
  IllegalCaseTransitionError,
  type CaseTransition,
} from '../../../../src/engine/cases/caseStateMachine.js';

const ALLOWED: ReadonlySet<CaseTransition> = new Set<CaseTransition>([
  'accept',
  'decline',
  'send_demand',
  'begin_negotiation',
  'resolve',
]);

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

  const body = (typeof req.body === 'object' && req.body ? req.body : {}) as {
    action?: string;
    reason?: string;
    resolution_type?: string;
    resolution_notes?: string;
  };
  const action = body.action as CaseTransition | undefined;
  if (!action || !ALLOWED.has(action)) {
    return res.status(400).json({ error: 'Unknown or disallowed action' });
  }

  try {
    const clients = makeClientsFromEnv();
    const result = await clients.db.transitionCaseForFirm({
      caseId: id,
      lawFirmId: auth.lawFirmId,
      transition: action,
      reason: body.reason,
      resolutionType: body.resolution_type,
      resolutionNotes: body.resolution_notes,
      // Whoever accepts owns the matter; the db applies this only on 'accept'.
      assignedLawyerId: auth.attorneyId,
    });
    if (!result) return res.status(404).json({ error: 'Case not found' });
    return res.status(200).json({ status: result.caseRow.status });
  } catch (err) {
    if (err instanceof IllegalCaseTransitionError) {
      return res.status(409).json({ error: err.message });
    }
    console.error('POST /api/portal/cases/[id]/transition failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
