/**
 * GET /api/public/litigation
 *
 * Public read-only list of active litigation listings (class actions,
 * DOJ enforcement actions, consent decrees, pattern-of-practice intake,
 * and regulatory challenges).
 * Used by Ada's prompt context and by the public Active Cases browse
 * page on adalegallink.com.
 *
 * Query params (all optional):
 *   kind   — 'class' | 'enforcement_action' | 'consent_decree' |
 *            'pattern_of_practice' | 'regulatory_challenge' (default: all)
 *   state  — two-letter code, e.g. 'AZ'. Matches rows whose
 *            affected_states contains the state, OR whose affected_states
 *            is empty (treated as nationwide).
 *   search — case-insensitive substring match across case_name +
 *            eligibility + short_description. (Phase 6a)
 *   limit  — max rows (default 50, max 200). (Phase 6a: bumped from
 *            default 20 / max 50 so the public browse page can load the
 *            full active set on first paint without pagination.)
 *
 * Always returns rows whose status is one of: active, compliance,
 * investigating, tracking. Drafts, closed, and archived rows never
 * appear here.
 *
 * Cache: public for 5 min, CDN for 15 min, SWR 24h. Same as listings.
 *
 * Ref: /plan Phase 2 (initial); /plan Phase 6a (search + limits).
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
    const validKinds: ReadonlySet<LitigationKind> = new Set([
      'class',
      'enforcement_action',
      'consent_decree',
      'pattern_of_practice',
      'regulatory_challenge',
    ]);
    const kind: LitigationKind | undefined =
      kindRaw && validKinds.has(kindRaw as LitigationKind)
        ? (kindRaw as LitigationKind)
        : undefined;

    const stateRaw = typeof req.query.state === 'string' ? req.query.state : undefined;
    const state = stateRaw ? stateRaw.toUpperCase() : undefined;

    // Phase 6a: search filter. Empty string → no filter. Trim and length-
    // cap to keep the ILIKE pattern reasonable (Drizzle parameterizes, so
    // no injection vector; the cap is purely a DoS-shape guard).
    const searchRaw = typeof req.query.search === 'string' ? req.query.search : undefined;
    const search = searchRaw && searchRaw.trim().length > 0
      ? searchRaw.trim().slice(0, 200)
      : undefined;

    // Phase 6a: bumped default 20 → 50, cap 50 → 200.
    const limitRaw = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : NaN;
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 50;

    const clients = makeClientsFromEnv();
    // Phase A3a: surface the 4 page-visible statuses. Ada's prompt
    // context uses the default ['active']; this endpoint serves the
    // public /lawsuits directory, which renders settled-
    // compliance, DOJ-investigation, and regulatory-challenge rows
    // alongside active ones. Admin-only statuses (draft/closed/
    // archived) are never returned regardless of what's requested.
    const rows = await clients.db.listActiveLitigation({
      kind,
      state,
      search,
      limit,
      statuses: ['active', 'compliance', 'investigating', 'tracking'],
    });

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
