/**
 * Ada Spot — shared per-session report runner.
 *
 * One code path for both report triggers:
 *   - inline at finish-upload (POST /api/spot/generate) — the fast path,
 *     so a buyer's report starts generating the moment they finish, and
 *   - the /api/cron/generate-spot-reports sweeper — the retry/backstop
 *     path (client never fired the trigger, a prior run failed, etc.).
 *
 * Idempotency + resilience (unchanged semantics, extracted from the cron):
 *   - If the session already has a report (a prior run inserted it but
 *     failed to flip status), recover by flipping status — no re-gen.
 *   - Zero photos → flip to in_review rather than spinning forever.
 *   - generateReport throws on failure (incl. a model that didn't
 *     compose); the session stays `uploaded` so the sweeper retries.
 *     Nothing ever persists an empty report.
 *   - Concurrent runs (inline + cron racing on one session) are closed
 *     by the unique index on spot_report(session_id) (migration 0039):
 *     the second insert throws, is surfaced as a failure, and the next
 *     sweep recovers via the existing-report path.
 */

import type { AdaClients } from '../../engine/clients/types.js';
import type { SpotStore } from './spotStore.js';
import { generateReport } from './generateReport.js';
import { generatePackageSlug } from '../../engine/package/slug.js';

export type RunReportResult =
  | { kind: 'generated'; modelVersion: string }
  | { kind: 'recovered' }
  | { kind: 'empty' };

export async function generateReportForSession(
  store: SpotStore,
  clients: AdaClients,
  sessionId: string,
): Promise<RunReportResult> {
  // Recover a partial from a prior run (report exists, status not flipped).
  const existing = await store.getReportBySession(sessionId);
  if (existing) {
    await store.markInReview(sessionId);
    return { kind: 'recovered' };
  }

  const photos = await store.listSessionPhotos(sessionId);
  if (photos.length === 0) {
    // Nothing to analyze — move it out of the queue rather than spinning.
    await store.markInReview(sessionId);
    return { kind: 'empty' };
  }

  const report = await generateReport(clients, { photos });
  await store.insertReport({
    sessionId,
    slug: generatePackageSlug(),
    content: report.content,
    modelVersion: report.modelVersion,
  });
  await store.markInReview(sessionId);
  return { kind: 'generated', modelVersion: report.modelVersion };
}
