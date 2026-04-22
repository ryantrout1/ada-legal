/**
 * GET /api/packages/[slug]
 *
 * Public read-only endpoint. Returns the full SessionPackage JSON for
 * a given slug, if one exists and has not expired. No auth required —
 * the slug IS the access control (see Step 18 design: 60 bits of
 * Crockford base32 randomness = unguessable by enumeration).
 *
 * Response: 200 OK
 *   { "package": <SessionPackage> }
 *
 * Errors:
 *   404 — slug not found, expired, or malformed
 *   405 — method not POST
 *   500 — any DB failure
 *
 * Cache policy: short public cache (60s) so the /s/{slug} page loads
 * snappily on back-navigation, but not so long that a regenerated
 * package is invisible for hours.
 *
 * Ref: Step 18, Commit 4.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeClientsFromEnv } from '../_shared.js';
import { isValidPackageSlug } from '../../src/engine/package/slug.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vercel dynamic routes put the path segment on req.query.
  const slugRaw = req.query.slug;
  const slug = typeof slugRaw === 'string' ? slugRaw : null;

  if (!slug || !isValidPackageSlug(slug)) {
    // Treat malformed slugs as 404 rather than 400 — we don't want to
    // leak "this slug was almost right" to an attacker probing URLs.
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const clients = makeClientsFromEnv();
    // Normalize to lowercase for lookup — slugs are stored lowercase
    // but we accept case-insensitive input (see slug.ts isValid).
    const row = await clients.db.readSessionPackageBySlug(slug.toLowerCase());
    if (!row) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
    return res.status(200).json({ package: row.payload });
  } catch (err) {
    console.error('GET /api/packages/[slug] failed', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return res.status(500).json({ error: message });
  }
}
