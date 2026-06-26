/**
 * /api/portal/cases/[id]/tasks
 *   GET  — list tasks on a case
 *   POST — add a task { title, due_date?, priority? }
 *
 * Attorney-only, firm-scoped + consent-gated (404 when the case isn't this
 * firm's / isn't consented). Phase 4b.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney } from '../../../_attorney.js';
import { applyCors } from '../../../_cors.js';
import { makeClientsFromEnv } from '../../../_shared.js';
import type { TaskRow } from '../../../../src/engine/clients/types.js';

const PRIORITIES: ReadonlySet<string> = new Set(['high', 'medium', 'low']);
const DUE_RE = /^\d{4}-\d{2}-\d{2}$/;

function serialize(t: TaskRow) {
  return {
    id: t.id,
    case_id: t.caseId,
    title: t.title,
    due_date: t.dueDate,
    priority: t.priority,
    completed_at: t.completedAt,
    created_at: t.createdAt,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAttorney(req, res);
  if (!auth) return;

  const id =
    typeof req.query.id === 'string'
      ? req.query.id
      : Array.isArray(req.query.id)
        ? req.query.id[0]
        : null;
  if (!id) return res.status(400).json({ error: 'id is required' });

  try {
    const clients = makeClientsFromEnv();

    if (req.method === 'GET') {
      const tasks = await clients.db.listTasksForCase(id, auth.lawFirmId);
      if (tasks === null) return res.status(404).json({ error: 'Case not found' });
      return res.status(200).json({ tasks: tasks.map(serialize) });
    }

    if (req.method === 'POST') {
      const body = (typeof req.body === 'object' && req.body ? req.body : {}) as {
        title?: string;
        due_date?: string;
        priority?: string;
      };
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      if (!title) return res.status(400).json({ error: 'A task title is required' });
      if (title.length > 500) return res.status(400).json({ error: 'Title is too long' });

      const priority = body.priority ?? 'medium';
      if (!PRIORITIES.has(priority))
        return res.status(400).json({ error: 'priority must be high, medium, or low' });

      let dueDate: string | null = null;
      if (body.due_date) {
        if (!DUE_RE.test(body.due_date))
          return res.status(400).json({ error: 'due_date must be YYYY-MM-DD' });
        dueDate = body.due_date;
      }

      const task = await clients.db.addTaskForCase({
        caseId: id,
        lawFirmId: auth.lawFirmId,
        title,
        dueDate,
        priority,
        createdBy: null,
      });
      if (!task) return res.status(404).json({ error: 'Case not found' });
      return res.status(201).json({ task: serialize(task) });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('/api/portal/cases/[id]/tasks failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
