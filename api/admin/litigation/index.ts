/**
 * /api/admin/litigation
 *
 *   GET  — list litigation rows across kinds/statuses with filter + pagination
 *   POST — create a new litigation row
 *
 * Both admin-only. Class actions and mass actions share this endpoint;
 * use ?kind=class or ?kind=mass to filter to one. The B44 admin's
 * AdminClassActions page passes ?kind=class, AdminMassActions passes
 * ?kind=mass.
 *
 * The ?lead_attorney_id= filter powers the "Linked litigation" panel
 * on AdminAttorneyEdit (shows all litigation where this attorney is
 * lead counsel).
 *
 * Ref: /plan Phase 2
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv } from '../../_shared.js';
import type {
  LitigationKind,
  LitigationStatus,
} from '../../../src/engine/clients/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleList(req: VercelRequest, res: VercelResponse) {
  try {
    const kindRaw = typeof req.query.kind === 'string' ? req.query.kind : undefined;
    const kind = isKind(kindRaw) ? kindRaw : undefined;

    const statusRaw = typeof req.query.status === 'string' ? req.query.status : undefined;
    const status = isStatus(statusRaw) ? statusRaw : undefined;

    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const leadAttorneyId =
      typeof req.query.lead_attorney_id === 'string' ? req.query.lead_attorney_id : undefined;
    const page = parseIntOr(req.query.page, 1);
    const pageSize = Math.min(parseIntOr(req.query.page_size, 50), 100);

    const clients = makeClientsFromEnv();
    const result = await clients.db.listLitigationForAdmin({
      kind,
      status,
      search,
      leadAttorneyId,
      page,
      pageSize,
    });

    return res.status(200).json({
      litigation: result.litigation,
      total_count: result.totalCount,
      page: result.page,
      page_size: result.pageSize,
    });
  } catch (err) {
    console.error('GET /api/admin/litigation failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}

async function handleCreate(req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body as Record<string, unknown> | undefined;
    if (!body || typeof body.case_name !== 'string' || !body.case_name.trim()) {
      return res.status(400).json({ error: 'case_name is required' });
    }
    if (!isKind(body.kind)) {
      return res.status(400).json({ error: 'kind must be "class" or "mass"' });
    }
    if (typeof body.slug !== 'string' || !body.slug.trim()) {
      return res.status(400).json({ error: 'slug is required' });
    }

    const statusRaw = body.status;
    const status =
      typeof statusRaw === 'string' && isStatus(statusRaw) ? statusRaw : undefined;

    const clients = makeClientsFromEnv();
    const org = await clients.db.getOrgByCode('adall');
    if (!org) {
      return res.status(500).json({ error: 'Default organization not found' });
    }

    const created = await clients.db.createLitigation({
      orgId: org.id,
      kind: body.kind,
      caseName: body.case_name.trim(),
      slug: body.slug.trim(),
      shortDescription: stringOrNull(body.short_description),
      fullDescription: stringOrNull(body.full_description),
      eligibility: stringOrNull(body.eligibility),
      defendants: Array.isArray(body.defendants)
        ? body.defendants.filter((d): d is string => typeof d === 'string')
        : [],
      court: stringOrNull(body.court),
      docketNumber: stringOrNull(body.docket_number),
      affectedStates: Array.isArray(body.affected_states)
        ? body.affected_states
            .filter((s): s is string => typeof s === 'string')
            .map((s) => s.toUpperCase())
        : [],
      filingDate: stringOrNull(body.filing_date),
      leadAttorneyId: stringOrNull(body.lead_attorney_id),
      status,
    });

    return res.status(201).json({ litigation: created });
  } catch (err) {
    console.error('POST /api/admin/litigation failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}

function isKind(v: unknown): v is LitigationKind {
  return v === 'class' || v === 'mass';
}

function isStatus(v: unknown): v is LitigationStatus {
  return (
    v === 'draft' ||
    v === 'active' ||
    v === 'settled' ||
    v === 'closed' ||
    v === 'archived'
  );
}

function parseIntOr(v: unknown, fallback: number): number {
  if (typeof v !== 'string') return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function stringOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed === '' ? null : trimmed;
}
