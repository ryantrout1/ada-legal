/**
 * POST /api/spot/admin/regenerate  { sessionId, model }  → { slug, model }
 *
 * Internal admin preview: re-run report generation for a session's photos with
 * a chosen model (Opus 4.8 vs Fable 5) and persist it as a NEW report, so both
 * outputs coexist for side-by-side comparison. requireAdmin-gated — this spends
 * on the model, so it is never public. The model is allowlisted.
 *
 * Own surface; does not touch the cron or the bench. Ref: /plan Ada Spot 3b.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv, readJsonBody } from '../../_shared.js';
import { makeSpotStore } from '../../../src/lib/spot/spotStore.js';
import { generateReport } from '../../../src/lib/spot/generateReport.js';
import { parseRegenerateBody } from '../../../src/lib/spot/parseRegenerateBody.js';
import { generatePackageSlug } from '../../../src/engine/package/slug.js';

export const config = { maxDuration: 300 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = parseRegenerateBody(readJsonBody<{ sessionId?: unknown; model?: unknown }>(req));
  if (!parsed.ok) return res.status(400).json({ error: parsed.error });

  try {
    const store = makeSpotStore();
    const photos = await store.listSessionPhotos(parsed.sessionId);
    if (photos.length === 0) return res.status(400).json({ error: 'Session has no photos to analyze.' });

    const clients = makeClientsFromEnv();
    const report = await generateReport(clients, { photos, model: parsed.model });
    const slug = generatePackageSlug();
    await store.insertReport({
      sessionId: parsed.sessionId,
      slug,
      content: report.content,
      modelVersion: report.modelVersion,
    });
    return res.status(200).json({ slug, model: report.modelVersion });
  } catch (err) {
    console.error('spot/admin/regenerate failed', err);
    return res.status(500).json({ error: 'Regeneration failed. Please try again.' });
  }
}
