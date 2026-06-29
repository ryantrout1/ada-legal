/**
 * GET /api/portal/agenda — the "Needs attention" feed for the firm (build-list #2).
 *
 * Key dates (SOL deadlines + open task due dates, bucketed) and follow-up
 * (matters gone quiet, or new past first-contact). Attorney-only, firm-scoped,
 * consent-gated. SOL is read straight from the matter — never computed here.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney } from '../../_attorney.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv } from '../../_shared.js';
import { buildAgenda } from '../../../src/engine/cases/agenda.js';

const STALE_DAYS = 14;

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

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
    const inputs = await clients.db.getAgendaInputsForFirm(auth.lawFirmId);
    const agenda = buildAgenda({ ...inputs, today: todayUtc(), staleDays: STALE_DAYS });
    return res.status(200).json({
      key_dates: agenda.keyDates.map((k) => ({
        kind: k.kind,
        case_id: k.caseId,
        case_number: k.caseNumber,
        client_name: k.clientName,
        title: k.title,
        due_date: k.dueDate,
        bucket: k.bucket,
        priority: k.priority,
        task_id: k.taskId,
      })),
      follow_up: agenda.followUp.map((f) => ({
        case_id: f.caseId,
        case_number: f.caseNumber,
        client_name: f.clientName,
        status: f.status,
        reason: f.reason,
        days_since_activity: f.daysSinceActivity,
        last_activity_at: f.lastActivityAt,
      })),
    });
  } catch (err) {
    console.error('/api/portal/agenda failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
