/**
 * GET /api/admin/spot/summary — the Spot funnel, in one round trip.
 *
 * Spot is the only product currently taking money and none of it was visible
 * anywhere in the admin. The first time this query was run by hand it showed
 * four reports sitting in pending_review — every report ever generated,
 * undelivered, because release is a human click on a queue nobody knew to
 * watch. It also showed two paid sessions with no buyer email: purchases that
 * cannot be fulfilled at all.
 *
 * Counts only. No photos and no report content: photo retention is handled by
 * the 90-day sweep, and this must not become a second path to the images.
 *
 * TWO DEFINITIONS WORTH READING BEFORE CHANGING ANYTHING HERE:
 *
 *   paid      — paid_at IS NOT NULL, not `status <> 'pending_payment'`.
 *               Status carries the session forward through refunded, so
 *               counting by status would keep a refund in the paid column.
 *
 *   delivered — spot_report.sent_at IS NOT NULL, not session.status =
 *               'delivered'. Those mean different things by design: the
 *               session reaches `delivered` when the reviewer decides, and
 *               sent_at is set only when mail actually leaves. Counting the
 *               session status here would report reports as delivered that
 *               nobody has received, which is the exact failure this screen
 *               exists to surface.
 *
 * Ref: /plan Spot admin, Phase 1.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from 'drizzle-orm';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeDb } from '../../../src/db/client.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return res.status(500).json({ error: 'Database is not configured.' });
    const db = makeDb(dbUrl);

    const result = await db.execute<{
      free_reads: number;
      free_with_email: number;
      abandoned_checkout: number;
      paid: number;
      uploaded: number;
      refunded: number;
      paid_no_email: number;
      awaiting_review: number;
      released_unsent: number;
      delivered: number;
      gross_cents: number;
    }>(sql`
      SELECT
        (SELECT count(*)::int FROM spot_read)                                  AS free_reads,
        (SELECT count(*)::int FROM spot_read WHERE email IS NOT NULL)          AS free_with_email,
        (SELECT count(*)::int FROM spot_session
           WHERE status = 'pending_payment')                                   AS abandoned_checkout,
        (SELECT count(*)::int FROM spot_session WHERE paid_at IS NOT NULL)     AS paid,
        (SELECT count(*)::int FROM spot_session WHERE uploaded_at IS NOT NULL) AS uploaded,
        (SELECT count(*)::int FROM spot_session WHERE status = 'refunded')     AS refunded,
        (SELECT count(*)::int FROM spot_session
           WHERE paid_at IS NOT NULL AND buyer_email IS NULL)                  AS paid_no_email,
        (SELECT count(*)::int FROM spot_report
           WHERE hitl_status = 'pending_review')                               AS awaiting_review,
        (SELECT count(*)::int FROM spot_report
           WHERE hitl_status = 'released' AND sent_at IS NULL)                 AS released_unsent,
        (SELECT count(*)::int FROM spot_report WHERE sent_at IS NOT NULL)      AS delivered,
        (SELECT coalesce(sum(amount_cents), 0)::int FROM spot_session
           WHERE paid_at IS NOT NULL)                                          AS gross_cents
    `);

    const row = (result.rows?.[0] ?? {}) as Record<string, number>;
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ summary: row });
  } catch (err) {
    console.error('GET /api/admin/spot/summary failed', err);
    return res.status(500).json({ error: 'Could not load the Spot summary.' });
  }
}
