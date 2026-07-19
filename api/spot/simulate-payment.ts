/**
 * POST /api/spot/simulate-payment   { photos: string[] }   → { slug, content }
 *
 * TEST-ONLY. Bypasses Stripe so a report can be previewed without a live
 * payment. Runs the REAL generator on the supplied photos (data URLs), persists
 * a session + report (seeding the HITL/readout surfaces), and returns the
 * rendered content so the landing can show it inline.
 *
 * TWO gates, both required:
 *   1. the `spot_test_payment` admin-blob flag (default OFF, flipped by a Neon
 *      upsert), and
 *   2. a shared secret in SPOT_TEST_KEY that the caller must present (header
 *      `x-spot-test-key` or body `testKey`).
 * The flag alone is not a security boundary — this endpoint mints a free $79
 * report and its path is visible in the public JS bundle, so a flag-only gate
 * is world-open. The key lives only in the server env and the operator's
 * private URL (?test=1&key=…); it is never shipped to the browser. With the key
 * unset the endpoint is closed even if the flag is on (fail-safe).
 * Ref: Ryan test-drive request.
 */

import { timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../_cors.js';
import { makeClientsFromEnv } from '../_shared.js';
import { makeSpotStore } from '../../src/lib/spot/spotStore.js';
import { generateReport } from '../../src/lib/spot/generateReport.js';
import { readSpotTestPayment } from '../../src/lib/spot/spotAvailability.js';
import { generatePackageSlug } from '../../src/engine/package/slug.js';

export const config = { maxDuration: 300 };

const MAX_TEST_PHOTOS = 10;
const TEST_AMOUNT_CENTS = 7900;

/** Constant-time string compare; false on any length/type mismatch (no timing oracle). */
function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clients = makeClientsFromEnv();
  if (!(await readSpotTestPayment(clients.db))) {
    return res.status(403).json({ error: 'Test payments are not enabled.' });
  }

  // Second gate: a shared secret only the operator holds. The admin flag alone
  // is not enough — this endpoint mints a free $79 report and its URL is
  // visible in the public bundle, so a flag-only gate is world-open. The key
  // lives ONLY in SPOT_TEST_KEY (server env) and in the operator's private
  // URL; it is never shipped to the browser. Unset key => closed (fail-safe),
  // so a missing env var can't silently leave the door open.
  const expectedKey = process.env.SPOT_TEST_KEY ?? '';
  const providedKey =
    (typeof req.headers['x-spot-test-key'] === 'string' ? (req.headers['x-spot-test-key'] as string) : '') ||
    (typeof req.body?.testKey === 'string' ? (req.body.testKey as string) : '');
  if (!expectedKey || !timingSafeEqualStr(providedKey, expectedKey)) {
    return res.status(403).json({ error: 'Test payments are not enabled.' });
  }

  const raw = (req.body?.photos ?? []) as unknown;
  const photos = Array.isArray(raw) ? raw.filter((p): p is string => typeof p === 'string' && p.length > 0) : [];
  if (photos.length === 0) return res.status(400).json({ error: 'At least one photo is required.' });
  if (photos.length > MAX_TEST_PHOTOS) return res.status(400).json({ error: `At most ${MAX_TEST_PHOTOS} photos.` });

  try {
    const store = makeSpotStore();
    // Drive the real state machine (no Stripe): pending → paid → uploaded.
    const sessionId = await store.createSession({ amountCents: TEST_AMOUNT_CENTS });
    await store.markPaid({ spotSessionId: sessionId, amountCents: TEST_AMOUNT_CENTS });
    await store.markUploaded({ spotSessionId: sessionId, photoCount: photos.length });

    const report = await generateReport(clients, { photos: photos.map((blobUrl) => ({ blobUrl })) });
    const slug = generatePackageSlug();
    await store.insertReport({ sessionId, slug, content: report.content, modelVersion: report.modelVersion });
    await store.markInReview(sessionId);

    return res.status(200).json({ slug, content: report.content });
  } catch (err) {
    console.error('spot/simulate-payment failed', err);
    return res.status(500).json({ error: 'Report generation failed. Please try again.' });
  }
}
