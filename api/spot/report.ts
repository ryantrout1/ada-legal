/**
 * GET /api/spot/report?slug=…  → { content }  (public)
 *
 * The hosted readout endpoint. Serves report content ONLY when the report is
 * released — pending/rejected drafts 404, so nothing leaks. The 60-bit slug is
 * the capability token (no auth). Ref: /plan Ada Spot Phase 4a.
 *
 * Photos are joined HERE, at read time, not baked into the stored content.
 * spot_photo runs on a 90-day retention clock while the report is permanent,
 * so URLs written into the artifact would become dead links the moment the
 * sweep ran. `purged` lets the page say the photos were deleted rather than
 * imply there never were any.
 *
 * The blobs are public-but-unguessable, the same capability model as the slug
 * that already gates this page — so a holder of the slug gains nothing new.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../_cors.js';
import { makeSpotStore } from '../../src/lib/spot/spotStore.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
  if (!slug) return res.status(400).json({ error: 'slug is required' });
  try {
    const store = makeSpotStore();
    const report = await store.getReleasedReportBySlug(slug);
    if (!report) return res.status(404).json({ error: 'Not found' });
    const photos = await store.sessionPhotoState(report.sessionId);
    return res
      .status(200)
      .json({ content: report.content, photos: photos.urls, photosPurged: photos.purged });
  } catch (err) {
    console.error('spot/report failed', err);
    return res.status(500).json({ error: 'Could not load the report.' });
  }
}
