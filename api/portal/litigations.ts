/**
 * GET /api/portal/litigations
 *
 * Firm self-select catalog (Phase 5.x). Lists every active class/mass-action
 * litigation the platform tracks, each flagged with whether THIS firm has
 * opted in. Any firm member may read it (role doesn't gate self-select).
 *
 * The firm scope comes from requireAttorney — the client never supplies a
 * firm id. Opting in/out is the [id] sibling route (POST / DELETE).
 *
 * Ada matches claimants against the same active set; a firm opting into a
 * litigation is what makes the router send those matched intakes to the firm
 * (sole-assignment resolution in createCaseForSession). Two firms on the same
 * litigation → the router falls to sourcing rather than guessing.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney } from '../_attorney.js';
import { applyCors } from '../_cors.js';
import { makeClientsFromEnv } from '../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAttorney(req, res);
  if (!auth) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const clients = makeClientsFromEnv();
    const [catalog, assignments] = await Promise.all([
      clients.db.listActiveLitigation({ limit: 200 }),
      clients.db.listFirmAssignmentsForFirm(auth.lawFirmId),
    ]);
    const acceptedIds = new Set(assignments.map((a) => a.litigationListingId));

    const litigations = catalog.map((l) => ({
      id: l.id,
      kind: l.kind,
      case_name: l.caseName,
      slug: l.slug,
      legal_theory: l.legalTheory,
      short_description: l.shortDescription,
      defendants: l.defendants,
      affected_states: l.affectedStates,
      accepted: acceptedIds.has(l.id),
    }));

    return res.status(200).json({ litigations });
  } catch (err) {
    console.error('GET /api/portal/litigations failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
