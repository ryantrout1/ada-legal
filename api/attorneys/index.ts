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
 *     ],
 *     "total_approved": <number>
 *   }
 *
 * total_approved is the count of approved attorneys ignoring the request's
 * filter params, capped at the underlying searchAttorneys ceiling. The
 * public /attorneys page uses this to decide whether to show the filter
 * UI at all (thin-roster threshold). The cap is fine here because the
 * threshold is a small number (10) — once the network is at-or-above
 * cap, the UI shows filters regardless of the exact count.
 *
 * Errors: 405 wrong method, 500 DB failure.
 *
 * Ref: docs/ARCHITECTURE.md §11
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeClientsFromEnv } from '../_shared.js';
import { applyCors } from '../_cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // The public attorney directory on adalegallink.com (Base44) fetches
  // this cross-origin. Without CORS the browser blocks the response and
  // the directory renders its "couldn't load" error even though the API
  // returns 200. adalegallink.com is in the _cors.ts allowlist. This
  // mirrors every other public endpoint (api/public/*, api/ada/*).
  if (applyCors(req, res)) return; // preflight handled

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

    // Two queries in parallel: the filtered list for display, and an
    // unfiltered list used only to count for the thin-roster gate. Both
    // hit the same approved-status filter under the hood.
    const [rows, allApprovedRows] = await Promise.all([
      clients.db.searchAttorneys({
        orgId: '', // searchAttorneys doesn't actually filter by org yet — Phase C concern
        state,
        city,
        practiceAreas,
        limit,
      }),
      clients.db.searchAttorneys({
        orgId: '',
        limit: 50,
      }),
    ]);

    // Map camelCase -> snake_case for the public API contract.
    const attorneys = rows.map((a) => ({
      id: a.id,
      name: a.name,
      firm_name: a.firmName,
      location_city: a.locationCity,
      location_state: a.locationState,
      practice_areas: a.practiceAreas,
      specialty_tags: a.specialtyTags,
      states_of_practice: a.additionalStates,
      bio: a.bio ?? null,
      email: a.email,
      phone: a.phone,
      website_url: a.websiteUrl,
    }));

    // Short CDN cache — data is admin-curated and low-churn. Safe to
    // serve slightly stale; a reload picks up admin edits within 60s.
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
    return res.status(200).json({ attorneys, total_approved: allApprovedRows.length });
  } catch (err) {
    console.error('GET /api/attorneys failed', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return res.status(500).json({ error: message });
  }
}
