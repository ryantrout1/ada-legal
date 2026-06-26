/**
 * PATCH /api/portal/cases/[id]/tasks/[taskId]  — mark a task complete.
 *
 * Attorney-only, firm-scoped + consent-gated (404 when the task's case isn't
 * this firm's). Phase 4b.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney } from '../../../../_attorney.js';
import { applyCors } from '../../../../_cors.js';
import { makeClientsFromEnv } from '../../../../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAttorney(req, res);
  if (!auth) return;

  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const taskId =
    typeof req.query.taskId === 'string'
      ? req.query.taskId
      : Array.isArray(req.query.taskId)
        ? req.query.taskId[0]
        : null;
  if (!taskId) return res.status(400).json({ error: 'taskId is required' });

  try {
    const clients = makeClientsFromEnv();
    const ok = await clients.db.completeTaskForCase({ taskId, lawFirmId: auth.lawFirmId });
    if (!ok) return res.status(404).json({ error: 'Task not found' });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('/api/portal/cases/[id]/tasks/[taskId] failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
