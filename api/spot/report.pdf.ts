/**
 * GET /api/spot/report.pdf?slug=…
 *
 * Streams a released Spot report as a downloadable PDF. Public read-only —
 * the unguessable slug IS the access control, the same model as
 * GET /api/spot/report and GET /api/packages/[slug]/letter.pdf, which this
 * mirrors.
 *
 * Released only. A pending or rejected draft 404s, because a person reads
 * every report before it goes out and an endpoint that served a draft would
 * route around that gate. Unknown, malformed and not-yet-approved return the
 * same 404 so the caller cannot tell them apart.
 *
 * Rendered on demand and never stored, so a paid report — which describes a
 * real address and carries the buyer's own photographs — never sits at a URL
 * anyone can enumerate.
 *
 * 200 — application/pdf, Content-Disposition: attachment
 * 404 — no released report for that slug
 * 405 — method not GET
 * 500 — render / DB failure
 *
 * Ref: /plan Download the Spot report as a PDF, phase 1.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../_cors.js';
import { makeSpotStore } from '../../src/lib/spot/spotStore.js';
import { renderSpotReportPdfForSlug } from '../../src/engine/spot/reportPdf.js';

// Photographs are fetched while the document renders, so this is slower than
// the text-only letter PDF. Sixty seconds is room for a slow blob without
// leaving a buyer watching a spinner indefinitely.
export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
  if (!slug) return res.status(404).json({ error: 'Not found' });

  try {
    const pdf = await renderSpotReportPdfForSlug(makeSpotStore(), slug);
    if (!pdf) return res.status(404).json({ error: 'Not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="accessibility-screening.pdf"',
    );
    // The report names a real place and carries the buyer's photographs.
    // Keep it out of shared caches.
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).send(pdf);
  } catch (err) {
    console.error('spot/report.pdf failed', err);
    return res.status(500).json({ error: 'Could not build the PDF.' });
  }
}
