/**
 * GET /api/packages/[slug]/letter.pdf
 *
 * Streams the user's demand letter (from their session package) as a
 * printable PDF. Public read-only — the unguessable slug IS the access
 * control, same as GET /api/packages/[slug]. The PDF is rendered on
 * demand and never stored, so the user's letter (which contains their
 * own narrative) is not persisted at a public URL.
 *
 * 200 — application/pdf, Content-Disposition: attachment
 * 404 — slug not found / expired / malformed, or no letter on the package
 * 405 — method not GET
 * 500 — render / DB failure
 *
 * Ref: /plan ADALL #2, Phase 1.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeClientsFromEnv } from '../../_shared.js';
import { renderLetterPdfForSlug } from '../../../src/engine/package/letterPdf.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vercel dynamic routes put the path segment on req.query.
  const slugRaw = req.query.slug;
  const slug = typeof slugRaw === 'string' ? slugRaw : null;
  if (!slug) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const clients = makeClientsFromEnv();
    const pdf = await renderLetterPdfForSlug(clients.db, slug);
    if (!pdf) {
      // Unknown/expired/malformed slug, or a package with no letter.
      // Treat all as 404 — don't leak which case it was.
      return res.status(404).json({ error: 'Not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="accessibility-letter.pdf"',
    );
    // The letter carries the user's own narrative — keep it out of
    // shared caches.
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).send(pdf);
  } catch (err) {
    console.error('GET /api/packages/[slug]/letter.pdf failed', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return res.status(500).json({ error: message });
  }
}
