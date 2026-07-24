/**
 * GET /api/admin/feedback — the feedback inbox.
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
import { desc } from 'drizzle-orm';
import { requireAdmin } from '../_admin.js';
import { applyCors } from '../_cors.js';
import { makeDb } from '../../src/db/client.js';
import { feedback } from '../../src/db/schema-core.js';

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

    const rows = await db
      .select()
      .from(feedback)
      .orderBy(desc(feedback.createdAt))
      .limit(500);

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
        created_at: r.createdAt,
      })),
      total: rows.length,
    });
  } catch (err) {
    console.error('GET /api/admin/feedback failed', err);
    return res.status(500).json({ error: 'Could not load feedback' });
  }
}
