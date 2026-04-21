/**
 * GET /api/attorneys
 *
 * Returns the list of approved attorneys, optionally filtered by state,
 * city, and practice area. This is the public-facing endpoint that
 * backs the /attorneys page; Ada uses the same underlying DbClient.
 * searchAttorneys method via the search_attorneys tool.
 *
 * Query parameters (all optional, all case-sensitive):
 *   state          — two-letter state abbreviation (e.g. "AZ")
 *   city           — exact city match
 *   practice_area  — repeatable; at least one must match attorney's areas
 *   limit          — 1..50, default 50 (Ch0 has 8 rows, headroom is fine)
 *
 * Response: 200 OK
 *   {
 *     "attorneys": [
 *       { "id", "name", "firm_name", "location_city", "location_state",
 *         "practice_areas", "email", "phone", "website_url" },
 *       ...
 *     ]
 *   }
 *
 * Errors: 405 wrong method, 500 DB failure.
 *
 * Ref: docs/ARCHITECTURE.md §11
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeClientsFromEnv } from '../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const state = typeof req.query.state === 'string' ? req.query.state.toUpperCase() : undefined;
    const city = typeof req.query.city === 'string' ? req.query.city : undefined;
    const practiceAreasParam = req.query.practice_area;
    const practiceAreas = Array.isArray(practiceAreasParam)
      ? practiceAreasParam.filter((p): p is string => typeof p === 'string')
      : typeof practiceAreasParam === 'string'
      ? [practiceAreasParam]
      : undefined;

    const limitRaw = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : NaN;
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 50) : 50;

    const clients = makeClientsFromEnv();
    const rows = await clients.db.searchAttorneys({
      orgId: '', // searchAttorneys doesn't actually filter by org yet — Phase C concern
      state,
      city,
      practiceAreas,
      limit,
    });

    // Map camelCase -> snake_case for the public API contract.
    const attorneys = rows.map((a) => ({
      id: a.id,
      name: a.name,
      firm_name: a.firmName,
      location_city: a.locationCity,
      location_state: a.locationState,
      practice_areas: a.practiceAreas,
      email: a.email,
      phone: a.phone,
      website_url: a.websiteUrl,
    }));

    // Short CDN cache — data is admin-curated and low-churn. Safe to
    // serve slightly stale; a reload picks up admin edits within 60s.
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
    return res.status(200).json({ attorneys });
  } catch (err) {
    console.error('GET /api/attorneys failed', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return res.status(500).json({ error: message });
  }
}
