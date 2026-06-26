/**
 * GET /api/portal/me
 *
 * The signed-in attorney's display identity for the portal shell: attorney
 * name + email and firm name (sidebar brand + footer). No case data — this is
 * the lightweight identity call the shell makes once on mount.
 *
 * Attorney-only (requireAttorney). Firm scoping is enforced server-side via the
 * resolved law_firm_id — the client never supplies a firm id.
 *
 * Ref: Phase 5 §7.1 (shell — "attorney + firm from the session").
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney, loadPortalIdentity } from '../_attorney.js';
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
    const identity = await loadPortalIdentity(clients.db, auth);
    return res.status(200).json(identity);
  } catch (err) {
    console.error('GET /api/portal/me failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}
