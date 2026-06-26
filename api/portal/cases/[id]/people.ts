/**
 * /api/portal/cases/[id]/people
 *
 *   GET    → list the people attached to the matter (witnesses / experts /
 *            opposing counsel / other). The claimant is implicit and not listed.
 *   POST   → add a person { name, role, email?, phone?, notes? }.
 *   DELETE → remove a person (?person_id=…).
 *
 * Attorney-only, firm-scoped + consent-gated server-side. 404 when the case
 * isn't this firm's.
 *
 * Ref: Phase 5 §7.5.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney } from '../../../_attorney.js';
import { applyCors } from '../../../_cors.js';
import { makeClientsFromEnv } from '../../../_shared.js';

const ROLES = new Set(['witness', 'expert', 'opposing_counsel', 'other']);

function str(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t === '' ? null : t;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAttorney(req, res);
  if (!auth) return;

  const id =
    typeof req.query.id === 'string'
      ? req.query.id
      : Array.isArray(req.query.id)
      ? req.query.id[0]
      : null;
  if (!id) return res.status(400).json({ error: 'id is required' });

  const clients = makeClientsFromEnv();

  try {
    if (req.method === 'GET') {
      const people = await clients.db.listCasePeople(id, auth.lawFirmId);
      return res.status(200).json({ people });
    }

    if (req.method === 'POST') {
      const b = (req.body ?? {}) as Record<string, unknown>;
      const name = str(b.name);
      const role = str(b.role);
      if (!name) return res.status(400).json({ error: 'name is required' });
      if (!role || !ROLES.has(role)) return res.status(400).json({ error: 'role is invalid' });
      const person = await clients.db.addCasePerson({
        caseId: id,
        lawFirmId: auth.lawFirmId,
        name,
        role,
        email: str(b.email),
        phone: str(b.phone),
        notes: str(b.notes),
      });
      if (!person) return res.status(404).json({ error: 'Case not found' });
      return res.status(200).json({ person });
    }

    if (req.method === 'DELETE') {
      const personId =
        typeof req.query.person_id === 'string'
          ? req.query.person_id
          : str((req.body as { person_id?: unknown } | undefined)?.person_id);
      if (!personId) return res.status(400).json({ error: 'person_id is required' });
      const ok = await clients.db.removeCasePerson({
        caseId: id,
        lawFirmId: auth.lawFirmId,
        casePersonId: personId,
      });
      if (!ok) return res.status(404).json({ error: 'Person not found' });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('/api/portal/cases/[id]/people failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
