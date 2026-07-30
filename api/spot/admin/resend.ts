/**
 * POST /api/spot/admin/resend  { slug }  → { sent, reason? }
 *
 * requireAdmin. Sends the hosted-readout email for a report that has ALREADY
 * been released.
 *
 * WHY THIS EXISTS SEPARATELY FROM /release. `releaseReport` matches only
 * `hitl_status = 'pending_review'`, which makes a second release a no-op —
 * correct for the review decision, which must happen once. But release was
 * also the only send path, so once a report was released with a failed or
 * skipped email there was no way to try again. The review screen told the
 * admin to "retry release to resend", and retrying release returned
 * `released: false` without reaching any send code. The buyer had paid, the
 * report existed, and the only route to them was regenerating it.
 *
 * A decision is idempotent. A delivery is retryable. They needed different
 * endpoints.
 *
 * The two ways a send can be outstanding are reported distinctly, because
 * they need opposite responses:
 *
 *   send_failed     — transient (mail provider, DNS). Retry is the fix.
 *   no_buyer_email  — nothing on file. Retrying will never work; someone has
 *                     to find the address. Previously this skipped silently,
 *                     logging nothing, and looked identical to a failure.
 *
 * Deliberately does NOT touch session status. The session went to
 * `delivered` when the review decision was made; whether the mail has left
 * is `spot_report.sent_at`, and that is the only thing this writes.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv, readJsonBody } from '../../_shared.js';
import { makeSpotStore } from '../../../src/lib/spot/spotStore.js';
import { buildReleaseEmail } from '../../../src/lib/spot/releaseEmail.js';
import { SPOT_SUPPORT_EMAIL } from '../../../src/lib/spot/confirmationCopy.js';
import { PUBLIC_ORIGIN } from '../../../src/lib/publicOrigin.js';

const DEFAULT_READOUT_BASE_URL = PUBLIC_ORIGIN;

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
    const report = await store.getReleasedReport(slug);
    if (!report) {
      // Not released yet (or unknown slug) — release owns the first send.
      return res.status(404).json({ error: 'No released report for that slug.' });
    }

    if (!report.buyerEmail) {
      // Loud, unlike the silent skip this replaces. A paid report with no
      // address is a support problem, not a transient one.
      console.error('spot/admin/resend: no buyer email on file', { slug });
      return res.status(200).json({ sent: false, reason: 'no_buyer_email' });
    }

    const baseUrl = process.env.SPOT_READOUT_BASE_URL ?? DEFAULT_READOUT_BASE_URL;
    const email = buildReleaseEmail({ slug, baseUrl });

    try {
      const clients = makeClientsFromEnv();
      await clients.email.send({
        to: report.buyerEmail,
        subject: email.subject,
        html: email.html,
        text: email.text,
        replyTo: SPOT_SUPPORT_EMAIL,
      });
    } catch (mailErr) {
      console.error('spot/admin/resend: email send failed', mailErr);
      return res.status(200).json({ sent: false, reason: 'send_failed' });
    }

    // Re-stamped on every successful send: sent_at answers "when did this
    // last reach them", which is what someone asks when a buyer says the
    // email never arrived.
    await store.markReportSent(slug);
    return res.status(200).json({ sent: true });
  } catch (err) {
    console.error('spot/admin/resend failed', err);
    return res.status(500).json({ error: 'Could not resend the report.' });
  }
}
