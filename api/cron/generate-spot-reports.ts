/**
 * GET/POST /api/cron/generate-spot-reports
 *
 * Picks up ONE `uploaded` Ada Spot session per tick, generates its report, and
 * parks it in spot_report (pending_review) for Phase 4's HITL/delivery, then
 * flips the session uploaded → in_review.
 *
 * One session/tick keeps each invocation inside the function time budget (up to
 * ~10 photos × batched vision + one synthesis). The cron re-runs, so a backlog
 * drains over successive ticks; oldest first.
 *
 * Idempotency + resilience:
 *   - If the picked session already has a report (a prior tick inserted it but
 *     failed to flip status), we just recover by flipping status — no re-gen.
 *   - generateReport throws on failure (incl. a model that didn't compose); we
 *     leave the session `uploaded` so the next tick retries. It never persists
 *     an empty report.
 *
 * Auth: fails closed on CRON_SECRET, like sweep-abandoned. Firewall: reuses the
 * analyzer + AI client additively; writes only spot_* rows; the bench and Ada
 * chat are untouched.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeClientsFromEnv } from '../_shared.js';
import { makeSpotStore } from '../../src/lib/spot/spotStore.js';
import { generateReport } from '../../src/lib/spot/generateReport.js';
import { generatePackageSlug } from '../../src/engine/package/slug.js';

export const config = { maxDuration: 300 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'];
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const store = makeSpotStore();
    const session = await store.nextUploadedSession();
    if (!session) return res.status(200).json({ generated: null, reason: 'no uploaded sessions' });

    // Recover a partial from a prior tick (report exists, status not flipped).
    const existing = await store.getReportBySession(session.id);
    if (existing) {
      await store.markInReview(session.id);
      return res.status(200).json({ generated: session.id, recovered: true });
    }

    const photos = await store.listSessionPhotos(session.id);
    if (photos.length === 0) {
      // Nothing to analyze — move it out of the queue rather than spinning.
      await store.markInReview(session.id);
      return res.status(200).json({ generated: session.id, empty: true });
    }

    const clients = makeClientsFromEnv();
    const report = await generateReport(clients, { photos });
    await store.insertReport({
      sessionId: session.id,
      slug: generatePackageSlug(),
      content: report.content,
      modelVersion: report.modelVersion,
    });
    await store.markInReview(session.id);

    return res.status(200).json({ generated: session.id, model: report.modelVersion });
  } catch (err) {
    // Leave the session `uploaded` for the next tick to retry.
    console.error('GET /api/cron/generate-spot-reports failed', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
