/**
 * /api/admin/litigation/[id]
 *
 *   GET    — fetch a single litigation row
 *   PATCH  — partial update
 *   DELETE — soft-delete (archive). status -> 'archived'.
 *
 * All admin-only.
 *
 * Ref: /plan Phase 2
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv } from '../../_shared.js';
import { sanitizeIncomingStates } from '../../../src/engine/clients/litigationStates.js';
import type {
  LitigationKind,
  LitigationStatus,
} from '../../../src/engine/clients/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const id =
    typeof req.query.id === 'string'
      ? req.query.id
      : Array.isArray(req.query.id)
      ? req.query.id[0]
      : null;
  if (!id) return res.status(400).json({ error: 'id is required' });

  if (req.method === 'GET') return handleGet(id, res);
  if (req.method === 'PATCH') return handlePatch(id, req, res);
  if (req.method === 'DELETE') return handleArchive(id, res);

  res.setHeader('Allow', 'GET, PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(id: string, res: VercelResponse) {
  try {
    const clients = makeClientsFromEnv();
    const row = await clients.db.getLitigationById(id);
    if (!row) return res.status(404).json({ error: 'Litigation not found' });
    return res.status(200).json({ litigation: row });
  } catch (err) {
    console.error('GET /api/admin/litigation/[id] failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}

async function handlePatch(id: string, req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body as Record<string, unknown> | undefined;
    if (!body) return res.status(400).json({ error: 'Body required' });

    const patch: Record<string, unknown> = {};
    if (isKind(body.kind)) patch.kind = body.kind;
    if (typeof body.case_name === 'string') patch.caseName = body.case_name.trim();
    if (typeof body.slug === 'string') patch.slug = body.slug.trim();
    if ('short_description' in body) patch.shortDescription = stringOrNull(body.short_description);
    if ('full_description' in body) patch.fullDescription = stringOrNull(body.full_description);
    if ('eligibility' in body) patch.eligibility = stringOrNull(body.eligibility);
    if (Array.isArray(body.defendants)) {
      patch.defendants = body.defendants.filter((d): d is string => typeof d === 'string');
    }
    if ('court' in body) patch.court = stringOrNull(body.court);
    if ('docket_number' in body) patch.docketNumber = stringOrNull(body.docket_number);
    if (Array.isArray(body.affected_states)) {
      // Strips the __nationwide__ sentinel before uppercasing — see
      // sanitizeIncomingStates (sentinel-corruption backstop).
      patch.affectedStates = sanitizeIncomingStates(body.affected_states);
    }
    if ('filing_date' in body) patch.filingDate = stringOrNull(body.filing_date);
    if ('lead_attorney_id' in body) patch.leadAttorneyId = stringOrNull(body.lead_attorney_id);
    if (isStatus(body.status)) patch.status = body.status;

    const clients = makeClientsFromEnv();
    const updated = await clients.db.updateLitigation(id, patch as never);
    if (!updated) return res.status(404).json({ error: 'Litigation not found' });
    return res.status(200).json({ litigation: updated });
  } catch (err) {
    console.error('PATCH /api/admin/litigation/[id] failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}

async function handleArchive(id: string, res: VercelResponse) {
  try {
    const clients = makeClientsFromEnv();
    const updated = await clients.db.updateLitigation(id, { status: 'archived' });
    if (!updated) return res.status(404).json({ error: 'Litigation not found' });
    return res.status(200).json({ litigation: updated });
  } catch (err) {
    console.error('DELETE /api/admin/litigation/[id] failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}

function isKind(v: unknown): v is LitigationKind {
  return (
    v === 'class' ||
    v === 'enforcement_action' ||
    v === 'consent_decree' ||
    v === 'pattern_of_practice' ||
    v === 'regulatory_challenge'
  );
}

function isStatus(v: unknown): v is LitigationStatus {
  return (
    v === 'draft' ||
    v === 'active' ||
    v === 'investigating' ||
    v === 'compliance' ||
    v === 'tracking' ||
    v === 'closed' ||
    v === 'archived'
  );
}

function stringOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed === '' ? null : trimmed;
}
