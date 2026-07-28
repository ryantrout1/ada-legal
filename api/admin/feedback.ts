/**
 * /api/admin/feedback — the feedback inbox.
 *
 *   GET   — messages, filtered by triage state. Defaults to what still
 *           needs attention rather than everything ever sent.
 *   PATCH — move one message between new / reviewed / archived.
 *
 * New endpoint (M6), so no additive constraint applies. Reads the table
 * the public FeedbackModal writes to.
 *
 * Testimonials are the reason this needs care: a submission carries
 * `testimonial_consent`, and anything marked as a testimonial without
 * that flag must never be treated as quotable. The endpoint returns the
 * flag verbatim rather than pre-filtering, so the admin page can show
 * "someone said something kind but did not agree to be quoted" — which
 * is information Gina wants — while making the quotable set unambiguous.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_admin.js';
import { applyCors } from '../_cors.js';
import { makeClientsFromEnv } from '../_shared.js';
import { isFeedbackStatus, FEEDBACK_STATUSES } from '../../src/engine/clients/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET' && req.method !== 'PATCH') {
    res.setHeader('Allow', 'GET, PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  if (req.method === 'PATCH') {
    const body = (req.body ?? {}) as { id?: unknown; status?: unknown };
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) return res.status(400).json({ error: 'id is required' });

    // Named, not dropped. A status the column will not take comes back
    // with the field and what it accepts, rather than a 500 from the
    // CHECK or a quiet no-op that looks like it worked.
    if (!isFeedbackStatus(body.status)) {
      return res.status(400).json({
        error: `status must be one of: ${FEEDBACK_STATUSES.join(', ')}`,
        field: 'status',
      });
    }

    try {
      const clients = makeClientsFromEnv();
      const updated = await clients.db.updateFeedbackStatus(id, body.status);
      if (!updated) return res.status(404).json({ error: 'No such feedback' });
      return res.status(200).json({ feedback: updated });
    } catch (err) {
      console.error('PATCH /api/admin/feedback failed', err);
      return res.status(500).json({ error: 'Could not update feedback' });
    }
  }

  try {
    const clients = makeClientsFromEnv();

    // Default to what still needs attention. Archived stays reachable
    // through the filter — it is out of the way, not gone.
    const raw = typeof req.query.status === 'string' ? req.query.status : 'new';
    const status = raw === 'all' ? undefined : raw;
    if (status !== undefined && !isFeedbackStatus(status)) {
      return res.status(400).json({
        error: `status must be 'all' or one of: ${FEEDBACK_STATUSES.join(', ')}`,
        field: 'status',
      });
    }

    const rows = await clients.db.listFeedback({ status });

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      feedback: rows.map((r) => ({
        id: r.id,
        feedback_type: r.feedbackType,
        message: r.message,
        name: r.name,
        email: r.email,
        display_name: r.displayName,
        location: r.location,
        testimonial_consent: r.testimonialConsent,
        page: r.page,
        page_url: r.pageUrl,
        status: r.status,
        created_at: r.createdAt,
      })),
      total: rows.length,
    });
  } catch (err) {
    console.error('GET /api/admin/feedback failed', err);
    return res.status(500).json({ error: 'Could not load feedback' });
  }
}
