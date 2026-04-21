/**
 * GET /api/admin/sessions
 *
 * Admin-only: returns a paginated list of ada_sessions with summary
 * metadata. Used by the admin sessions overview page.
 *
 * Query params:
 *   status        — active | completed | abandoned. Omit for all.
 *   include_test  — "true" to include is_test rows. Default false.
 *   page          — 1-based. Default 1.
 *   page_size     — 1..100. Default 25.
 *
 * Response: 200 OK
 *   { "sessions": [...], "total_count": n, "page": n, "page_size": n }
 *
 * Never returns conversation content — only counts and status. Admin
 * session detail (coming next) returns redacted content.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { makeClientsFromEnv } from '../../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  try {
    const statusRaw = typeof req.query.status === 'string' ? req.query.status : undefined;
    const status =
      statusRaw === 'active' || statusRaw === 'completed' || statusRaw === 'abandoned'
        ? statusRaw
        : undefined;

    const includeTest =
      typeof req.query.include_test === 'string' &&
      req.query.include_test.toLowerCase() === 'true';

    const pageRaw = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : NaN;
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

    const pageSizeRaw =
      typeof req.query.page_size === 'string' ? parseInt(req.query.page_size, 10) : NaN;
    const pageSize =
      Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 ? Math.min(pageSizeRaw, 100) : 25;

    const clients = makeClientsFromEnv();
    const result = await clients.db.listSessionsForAdmin({
      status,
      includeTest,
      page,
      pageSize,
    });

    return res.status(200).json({
      sessions: result.sessions.map((s) => ({
        session_id: s.sessionId,
        status: s.status,
        reading_level: s.readingLevel,
        classification_title: s.classificationTitle,
        message_count: s.messageCount,
        extracted_field_count: s.extractedFieldCount,
        created_at: s.createdAt,
        updated_at: s.updatedAt,
        is_test: s.isTest,
      })),
      total_count: result.totalCount,
      page: result.page,
      page_size: result.pageSize,
    });
  } catch (err) {
    console.error('GET /api/admin/sessions failed', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return res.status(500).json({ error: message });
  }
}
