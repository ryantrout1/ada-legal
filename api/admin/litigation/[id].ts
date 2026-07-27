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
import { LITIGATION_KINDS } from '../../../src/types/db.js';
import {
  isStoredCategory,
  type BarrierCategoryStored,
} from '../../../src/app/lib/barrierCategories.js';
import { INTAKE_STATUSES } from '../../../src/engine/clients/types.js';
import type {
  IntakeStatus,
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
    // M6: lead FIRM, distinct from lead attorney. This is the field
    // resolveEligibleRoutingFirm() reads to decide the exclusive Lane A
    // handoff — without a way to set it, every multi-firm litigation
    // falls to sourcing. Additive: absent key means unchanged.
    if ('lead_firm_id' in body) patch.leadFirmId = stringOrNull(body.lead_firm_id);
    if (isStatus(body.status)) patch.status = body.status;

    // Phase 2: the taxonomy fields. Unlike the fields above, a bad value
    // here is reported rather than dropped — see the guards' comment.
    if ('barrier_category' in body) {
      if (!isBarrierCategory(body.barrier_category)) {
        return res.status(400).json({ error: 'Unknown barrier_category' });
      }
      patch.barrierCategory = body.barrier_category;
    }
    if ('intake_status' in body) {
      if (!isIntakeStatus(body.intake_status)) {
        return res.status(400).json({ error: 'Unknown intake_status' });
      }
      patch.intakeStatus = body.intake_status;
    }

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

/**
 * Exported so a test can check it accepts exactly what the admin's
 * KIND_LABEL offers. It used to be a hand-written chain missing 'mass',
 * which meant the form could display a value it would then silently refuse
 * to save — the field was dropped from the patch with no error, so the
 * screen was wrong and the stored data was fine.
 */
/**
 * Both of these return the field name to the caller rather than dropping a
 * bad value silently, which is what the fields around them do. That silence
 * is how a blank Kind dropdown survived a save without complaint. An admin
 * who typed something wrong should be told, not left to discover later that
 * the change never landed.
 */
export function isBarrierCategory(v: unknown): v is BarrierCategoryStored {
  return isStoredCategory(v);
}

export function isIntakeStatus(v: unknown): v is IntakeStatus {
  return typeof v === 'string' && (INTAKE_STATUSES as readonly string[]).includes(v);
}

export function isKind(v: unknown): v is LitigationKind {
  return typeof v === 'string' && (LITIGATION_KINDS as readonly string[]).includes(v);
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
