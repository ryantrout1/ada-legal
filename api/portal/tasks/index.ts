/**
 * GET /api/portal/tasks — open tasks across the firm's consented cases.
 * Attorney-only, firm-scoped. Phase 4b.
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

  try {
    const clients = makeClientsFromEnv();
    const tasks = await clients.db.listOpenTasksForFirm(auth.lawFirmId);
    return res.status(200).json({
      tasks: tasks.map((t) => ({
        id: t.id,
        case_id: t.caseId,
        case_number: t.caseNumber,
        claimant_name: t.claimantName,
        title: t.title,
        due_date: t.dueDate,
        priority: t.priority,
        created_at: t.createdAt,
      })),
    });
  } catch (err) {
    console.error('/api/portal/tasks failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
