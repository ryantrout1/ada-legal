/**
 * POST /api/spot/admin/release  { slug }  → { released, sent }
 *
 * requireAdmin. Releases a pending report, flips the session to delivered, then
 * emails the buyer the hosted-readout link. Mark-then-send: the review decision
 * (released + delivered) is recorded first; sent_at is set only when the email
 * actually sends, so a delivery failure is visible + retryable (a re-release is
 * a no-op, but the caller can resend). Idempotent — a re-release finds no
 * pending report and returns released:false. Ref: /plan Ada Spot Phase 4a.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv, readJsonBody } from '../../_shared.js';
import { makeSpotStore } from '../../../src/lib/spot/spotStore.js';
import { buildReleaseEmail } from '../../../src/lib/spot/releaseEmail.js';

const DEFAULT_READOUT_BASE_URL = 'https://ada.adalegallink.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = readJsonBody<{ slug?: unknown }>(req);
  const slug = typeof body?.slug === 'string' ? body.slug : '';
  if (!slug) return res.status(400).json({ error: 'slug is required' });

  try {
    const store = makeSpotStore();
    const released = await store.releaseReport({ slug, reviewedBy: auth.email ?? 'admin' });
    if (!released) {
      // Already released/rejected or unknown slug — nothing to do.
      return res.status(200).json({ released: false, sent: false });
    }

    await store.markDelivered(released.sessionId);

    let sent = false;
    if (released.buyerEmail) {
      const baseUrl = process.env.SPOT_READOUT_BASE_URL ?? DEFAULT_READOUT_BASE_URL;
      const email = buildReleaseEmail({ slug, baseUrl });
      try {
        const clients = makeClientsFromEnv();
        await clients.email.send({ to: released.buyerEmail, subject: email.subject, html: email.html, text: email.text });
        await store.markReportSent(slug);
        sent = true;
      } catch (mailErr) {
        // Released stands; email can be retried from the review surface.
        console.error('spot/admin/release: email send failed', mailErr);
      }
    }

    return res.status(200).json({ released: true, sent });
  } catch (err) {
    console.error('spot/admin/release failed', err);
    return res.status(500).json({ error: 'Could not release the report.' });
  }
}
