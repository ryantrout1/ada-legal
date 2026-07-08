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
 * Cache policy: short PRIVATE cache (60s) so the /s/{slug} page loads
 * snappily on back-navigation, but kept out of shared/CDN caches — the
 * payload is claimant PII behind a capability URL, so only the
 * requesting browser should retain it.
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

    // The package is a claimant's readout (names, business, barrier
    // narrative) behind an unguessable capability URL. `private` keeps
    // it out of shared/CDN caches so it can only sit in the requesting
    // browser's cache; the short max-age still makes back-navigation snappy.
    res.setHeader('Cache-Control', 'private, max-age=60');
    return res.status(200).json({ package: row.payload });
  } catch (err) {
    // Full detail stays in the server log; the client gets a generic
    // message so we never leak stack/DB/env internals to a public caller.
    console.error('GET /api/packages/[slug] failed', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
