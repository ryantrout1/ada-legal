/**
 * GET /api/admin/dashboard — the six at-a-glance counts.
 *
 * New endpoint (M6). One round trip instead of six, because the
 * dashboard is the landing page and six parallel admin fetches on every
 * load is a slow first impression for the person who uses this tool most.
 *
 * Counts only — no PII, no row contents. If a tile needs detail, the
 * tile links to the page that owns it.
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
    const result = await db.execute<{
      sessions: number;
      intakes: number;
      cases_unplaced: number;
      firms: number;
      attorneys: number;
      feedback_new: number;
    }>(sql`
      SELECT
        (SELECT count(*)::int FROM ada_sessions)                                   AS sessions,
        (SELECT count(*)::int FROM ada_sessions WHERE completed_at IS NOT NULL)     AS intakes,
        (SELECT count(*)::int FROM cases WHERE firm_id IS NULL)                     AS cases_unplaced,
        (SELECT count(*)::int FROM law_firms)                                       AS firms,
        (SELECT count(*)::int FROM attorneys WHERE status = 'approved')             AS attorneys,
        (SELECT count(*)::int FROM feedback WHERE created_at > now() - interval '30 days') AS feedback_new
    `);
    const row = result.rows?.[0];

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ counts: row ?? {} });
  } catch (err) {
    console.error('GET /api/admin/dashboard failed', err);
    return res.status(500).json({ error: 'Could not load dashboard counts' });
  }
}
