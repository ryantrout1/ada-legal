/**
 * GET /api/attorneys/facets
 *
 * Returns the distinct filter values that exist in the attorney
 * directory — used to populate the state + practice-area dropdowns
 * on the public /attorneys page. Cached for 5 minutes since churn
 * is low.
 *
 * Response: 200 OK
 *   { "states": ["AZ", "CA", "IL", "NY", "TX"],
 *     "practice_areas": ["ada", "civil_rights", "education", ...] }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeClientsFromEnv } from '../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const clients = makeClientsFromEnv();
    const facets = await clients.db.getAttorneyFacets();
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    return res.status(200).json({
      states: facets.states,
      practice_areas: facets.practiceAreas,
    });
  } catch (err) {
    console.error('GET /api/attorneys/facets failed', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return res.status(500).json({ error: message });
  }
}
