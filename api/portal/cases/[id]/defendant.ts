/**
 * PATCH /api/portal/cases/[id]/defendant
 *
 * Set (or clear, with null) the attorney-entered defendant record on a case.
 * Firm-scoped + consent-gated; writes a DEFENDANT_SET activity.
 *
 * Body: { defendant: { name, kind?, address?, notes? } | null }. 404 when the
 * case isn't this firm's, 400 when a defendant is given without a name.
 *
 * Ref: Phase 5 §7.5.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney } from '../../../_attorney.js';
import { applyCors } from '../../../_cors.js';
import { makeClientsFromEnv } from '../../../_shared.js';
import type { CaseDefendant } from '../../../../src/engine/clients/types.js';

function str(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t === '' ? null : t;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAttorney(req, res);
  if (!auth) return;

  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id =
    typeof req.query.id === 'string'
      ? req.query.id
      : Array.isArray(req.query.id)
      ? req.query.id[0]
      : null;
  if (!id) return res.status(400).json({ error: 'id is required' });

  const raw = (req.body ?? {}) as { defendant?: unknown };
  let defendant: CaseDefendant | null;
  if (raw.defendant === null || raw.defendant === undefined) {
    defendant = null;
  } else if (typeof raw.defendant === 'object') {
    const d = raw.defendant as Record<string, unknown>;
    const name = str(d.name);
    if (!name) return res.status(400).json({ error: 'defendant.name is required' });
    defendant = { name, kind: str(d.kind), address: str(d.address), notes: str(d.notes) };
  } else {
    return res.status(400).json({ error: 'defendant must be an object or null' });
  }

  try {
    const clients = makeClientsFromEnv();
    const ok = await clients.db.setCaseDefendant({ caseId: id, lawFirmId: auth.lawFirmId, defendant });
    if (!ok) return res.status(404).json({ error: 'Case not found' });
    return res.status(200).json({ defendant });
  } catch (err) {
    console.error('PATCH /api/portal/cases/[id]/defendant failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
