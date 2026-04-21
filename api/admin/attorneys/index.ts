/**
 * /api/admin/attorneys
 *
 *   GET  — list attorneys across all statuses with filter + pagination
 *   POST — create a new attorney
 *
 * Both admin-only. The public /api/attorneys endpoint lists only
 * approved rows; this endpoint exposes everything (pending, rejected,
 * archived) for admin review + curation.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { makeClientsFromEnv } from '../../_shared.js';
import type { AttorneyStatus } from '../../../src/engine/clients/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleList(req: VercelRequest, res: VercelResponse) {
  try {
    const statusRaw = typeof req.query.status === 'string' ? req.query.status : undefined;
    const status = isAttorneyStatus(statusRaw) ? statusRaw : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const page = parseIntOr(req.query.page, 1);
    const pageSize = Math.min(parseIntOr(req.query.page_size, 50), 100);

    const clients = makeClientsFromEnv();
    const result = await clients.db.listAttorneysForAdmin({
      status,
      search,
      page,
      pageSize,
    });

    return res.status(200).json({
      attorneys: result.attorneys,
      total_count: result.totalCount,
      page: result.page,
      page_size: result.pageSize,
    });
  } catch (err) {
    console.error('GET /api/admin/attorneys failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}

async function handleCreate(req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body as Record<string, unknown> | undefined;
    if (!body || typeof body.name !== 'string' || !body.name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    // Validate status if provided.
    const statusRaw = body.status;
    const status =
      typeof statusRaw === 'string' && isAttorneyStatus(statusRaw) ? statusRaw : undefined;

    // Need the default org id to attach the new row to.
    const clients = makeClientsFromEnv();
    const org = await clients.db.getOrgByCode('adall');
    if (!org) {
      return res.status(500).json({ error: 'Default organization not found' });
    }

    const created = await clients.db.createAttorney({
      orgId: org.id,
      name: body.name.trim(),
      firmName: stringOrNull(body.firm_name),
      locationCity: stringOrNull(body.location_city),
      locationState: stringOrNull(body.location_state)?.toUpperCase() ?? null,
      practiceAreas: Array.isArray(body.practice_areas)
        ? body.practice_areas.filter((p): p is string => typeof p === 'string')
        : [],
      email: stringOrNull(body.email),
      phone: stringOrNull(body.phone),
      websiteUrl: stringOrNull(body.website_url),
      bio: stringOrNull(body.bio),
      photoUrl: stringOrNull(body.photo_url),
      status,
    });

    return res.status(201).json({ attorney: created });
  } catch (err) {
    console.error('POST /api/admin/attorneys failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}

function isAttorneyStatus(v: unknown): v is AttorneyStatus {
  return v === 'pending' || v === 'approved' || v === 'rejected' || v === 'archived';
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
