/**
 * POST /api/spot/simulate-payment   { photos: string[] }   → { slug, content }
 *
 * TEST-ONLY. Bypasses Stripe so a report can be previewed without a live
 * payment. Runs the REAL generator on the supplied photos (data URLs), persists
 * a session + report (seeding the HITL/readout surfaces), and returns the
 * rendered content so the landing can show it inline.
 *
 * Gated by the `spot_test_payment` admin-blob flag (default OFF, flipped by a
 * Neon upsert) — with it off, this is a 403 no-op, so no one gets a free report.
 * The landing only shows the button under ?test=1; this flag is the real gate.
 * Flip it back off when done. Ref: Ryan test-drive request.
 */

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
