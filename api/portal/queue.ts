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
import type { PortalQueueOptions } from '../../src/engine/clients/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAttorney(req, res);
  if (!auth) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const opts: PortalQueueOptions = {
      page: intParam(req.query.page),
      pageSize: intParam(req.query.page_size),
      handled: handledParam(req.query.handled),
    };

    const clients = makeClientsFromEnv();
    const result = await clients.db.listPortalQueueForFirm(auth.lawFirmId, opts);

    return res.status(200).json({
      summary: {
        open_count: result.summary.openCount,
        handled_count: result.summary.handledCount,
      },
      cases: result.cases.map((c) => ({
        session_id: c.sessionId,
        case_name: c.caseName,
        user_name: c.userName,
        user_email: c.userEmail,
        user_phone: c.userPhone,
        matched_at: c.matchedAt,
        handled_by_other_firm: c.handledByOtherFirm,
        handled_by_this_firm: c.handledByThisFirm,
      })),
      total_count: result.totalCount,
      page: result.page,
      page_size: result.pageSize,
    });
  } catch (err) {
    console.error('GET /api/portal/queue failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}

function intParam(v: unknown): number | undefined {
  const raw = typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined;
  if (raw == null) return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : undefined;
}

function handledParam(v: unknown): 'true' | 'false' | 'all' | undefined {
  const raw = typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined;
  if (raw === 'true' || raw === 'false' || raw === 'all') return raw;
  return undefined;
}
