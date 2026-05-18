/**
 * GET /api/public/litigation
 *
 * Public read-only list of active litigation (class + mass actions).
 * Used by Ada's prompt context and by any future public-facing
 * directory page.
 *
 * Query params (all optional):
 *   kind  — 'class' | 'mass' (default: both)
 *   state — two-letter code, e.g. 'AZ'. Matches rows whose
 *           affected_states contains the state, OR whose affected_states
 *           is empty (treated as nationwide).
 *   limit — max rows (default 20, max 50)
 *
 * Always filters status='active'. Drafts, settled, closed, archived
 * rows never appear here.
 *
 * Cache: public for 5 min, CDN for 15 min, SWR 24h. Same as listings.
 *
 * Ref: /plan Phase 2
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeClientsFromEnv } from '../../_shared.js';
import { applyCors } from '../../_cors.js';
import type { LitigationKind } from '../../../src/engine/clients/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const kindRaw = typeof req.query.kind === 'string' ? req.query.kind : undefined;
    const kind: LitigationKind | undefined =
      kindRaw === 'class' || kindRaw === 'mass' ? kindRaw : undefined;

    const stateRaw = typeof req.query.state === 'string' ? req.query.state : undefined;
    const state = stateRaw ? stateRaw.toUpperCase() : undefined;

    const limitRaw = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : NaN;
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 50) : 20;

    const clients = makeClientsFromEnv();
    const rows = await clients.db.listActiveLitigation({ kind, state, limit });

    res.setHeader(
      'Cache-Control',
      'public, max-age=300, s-maxage=900, stale-while-revalidate=86400',
    );
    return res.status(200).json({
      litigation: rows,
      total_count: rows.length,
    });
  } catch (err) {
    console.error('GET /api/public/litigation failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}
