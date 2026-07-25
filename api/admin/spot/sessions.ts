/**
 * GET /api/admin/spot/sessions?status=… — the paid Spot sessions.
 *
 * The list behind the funnel. Until this existed there was no way to answer
 * "who bought, did their report go out, and is anything stuck" without
 * opening Neon.
 *
 * WHAT IS AND ISN'T HERE. Buyer email and amount are included: they are what
 * makes a row actionable, and admin already sees claimant emails on
 * /admin/cases. Photos and report content are NOT — retention is the 90-day
 * sweep's job and this must not become a second route to the images.
 *
 * `delivery` is computed rather than stored, because neither column alone
 * tells the truth:
 *
 *   sent        spot_report.sent_at is set — the mail actually left.
 *   unsent      released by a reviewer, no sent_at. Retryable via resend.
 *   no_email    paid with no buyer_email. Retrying will never work; someone
 *               has to find an address. Two of these already exist.
 *   in_review   a report exists and is waiting on a human.
 *   none        no report yet (still uploading, or the pipeline has not run).
 *
 * Sorted newest first. No pagination yet — ten rows today, and a limit is
 * cheaper to add when there is something to paginate than to guess at now.
 *
 * Ref: /plan Spot admin, Phase 2.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from 'drizzle-orm';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeDb } from '../../../src/db/client.js';
import { SPOT_SESSION_STATUSES } from '../../../src/lib/spot/spotSessionStatus.js';

const STATUSES = new Set<string>(SPOT_SESSION_STATUSES);
const MAX_ROWS = 200;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const raw = typeof req.query.status === 'string' ? req.query.status : undefined;
  // An unrecognised status filters nothing rather than erroring — a stale
  // bookmark should show the list, not a failure.
  const status = raw && STATUSES.has(raw) ? raw : undefined;

  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return res.status(500).json({ error: 'Database is not configured.' });
    const db = makeDb(dbUrl);

    const result = await db.execute<Record<string, unknown>>(sql`
      SELECT
        s.id,
        s.status,
        s.buyer_email,
        s.amount_cents,
        s.photo_count,
        s.created_at,
        s.paid_at,
        s.uploaded_at,
        s.refunded_at,
        r.slug          AS report_slug,
        r.hitl_status   AS report_status,
        r.sent_at       AS report_sent_at,
        CASE
          WHEN r.sent_at IS NOT NULL                              THEN 'sent'
          WHEN s.paid_at IS NOT NULL AND s.buyer_email IS NULL     THEN 'no_email'
          WHEN r.hitl_status = 'released'                          THEN 'unsent'
          WHEN r.hitl_status = 'pending_review'                    THEN 'in_review'
          ELSE 'none'
        END             AS delivery
      FROM spot_session s
      LEFT JOIN spot_report r ON r.session_id = s.id
      WHERE ${status ? sql`s.status = ${status}` : sql`TRUE`}
      ORDER BY s.created_at DESC
      LIMIT ${MAX_ROWS}
    `);

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ sessions: result.rows ?? [] });
  } catch (err) {
    console.error('GET /api/admin/spot/sessions failed', err);
    return res.status(500).json({ error: 'Could not load Spot sessions.' });
  }
}
