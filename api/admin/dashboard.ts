/**
 * GET /api/admin/dashboard — the at-a-glance counts.
 *
 * New endpoint (M6). One round trip instead of six, because the
 * dashboard is the landing page and six parallel admin fetches on every
 * load is a slow first impression for the person who uses this tool most.
 *
 * Counts only — no PII, no row contents. If a tile needs detail, the
 * tile links to the page that owns it.
 *
 * THE CONTRACT EVERY COUNT HERE HOLDS: a tile's number must equal the
 * number of rows on the page that tile links to. Test sessions are
 * excluded everywhere a session is counted. See the query below for the
 * per-tile predicates and the reason each one exists.
 *
 * Ref: /plan admin dashboard parity, Phase 1.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from 'drizzle-orm';
import { requireAdmin } from '../_admin.js';
import { applyCors } from '../_cors.js';
import { makeDb } from '../../src/db/client.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  try {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    const db = makeDb(url);

    // Single round trip. Each count is independently null-safe so one
    // missing table cannot blank the whole dashboard.
    //
    // EVERY PREDICATE HERE IS LOAD-BEARING. The first version of this
    // query counted `count(*) FROM ada_sessions` and rendered 303 while
    // Base44 — the tool Gina actually uses — showed 25. Both were
    // "right": ours counted every session ever recorded including the
    // Playwright personas that run against this database constantly.
    // A dashboard number gets repeated to firms and to funders, so an
    // unfiltered count is not a cosmetic bug.
    //
    // The rules each tile follows, and why:
    //   sessions   — 30-day window, is_test = false. Matches B44's
    //                analytics?days=30&include_test=false.
    //   intakes    — session_type = 'class_action_intake', is_test =
    //                false. This is the SAME predicate getAdminAnalytics
    //                uses for intakesTotal and the SAME rows
    //                /api/admin/intakes lists. It previously counted any
    //                session with completed_at set, so the tile's number
    //                did not match the page the tile opens.
    //   firms      — status = 'active'. Agreed with B44 by luck; the
    //                first deactivated firm would have diverged it.
    //   listings   — status = 'published'.
    //   litigation — status = 'active' (class + mass live in one table).
    //
    // A count that disagrees with the list behind it is worse than no
    // count, because it looks authoritative.
    const result = await db.execute<{
      sessions: number;
      intakes: number;
      cases_unplaced: number;
      firms: number;
      attorneys: number;
      feedback_new: number;
      listings_published: number;
      litigation_active: number;
    }>(sql`
      SELECT
        (SELECT count(*)::int FROM ada_sessions
           WHERE is_test = false
             AND created_at > now() - interval '30 days')                   AS sessions,
        (SELECT count(*)::int FROM ada_sessions
           WHERE is_test = false
             AND session_type = 'class_action_intake')                      AS intakes,
        (SELECT count(*)::int FROM cases WHERE firm_id IS NULL)             AS cases_unplaced,
        (SELECT count(*)::int FROM law_firms WHERE status = 'active')       AS firms,
        (SELECT count(*)::int FROM attorneys WHERE status = 'approved')     AS attorneys,
        (SELECT count(*)::int FROM feedback
           WHERE created_at > now() - interval '30 days')                   AS feedback_new,
        (SELECT count(*)::int FROM listings WHERE status = 'published')     AS listings_published,
        (SELECT count(*)::int FROM litigation_listings
           WHERE status = 'active')                                         AS litigation_active
    `);
    const row = result.rows?.[0];

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ counts: row ?? {} });
  } catch (err) {
    console.error('GET /api/admin/dashboard failed', err);
    return res.status(500).json({ error: 'Could not load dashboard counts' });
  }
}
