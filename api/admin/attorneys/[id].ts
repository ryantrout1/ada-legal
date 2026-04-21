/**
 * /api/admin/attorneys/[id]
 *
 *   GET   — fetch a single attorney
 *   PATCH — partial update
 *   DELETE — soft-delete (archive). Actual row stays; status -> 'archived'.
 *
 * Both admin-only.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { makeClientsFromEnv } from '../../_shared.js';
import type { AttorneyStatus } from '../../../src/engine/clients/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const row = await clients.db.getAttorneyById(id);
    if (!row) return res.status(404).json({ error: 'Attorney not found' });
    return res.status(200).json({ attorney: row });
  } catch (err) {
    console.error('GET /api/admin/attorneys/[id] failed', err);
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
    if (typeof body.name === 'string') patch.name = body.name.trim();
    if ('firm_name' in body) patch.firmName = stringOrNull(body.firm_name);
    if ('location_city' in body) patch.locationCity = stringOrNull(body.location_city);
    if ('location_state' in body) {
      patch.locationState = stringOrNull(body.location_state)?.toUpperCase() ?? null;
    }
    if (Array.isArray(body.practice_areas)) {
      patch.practiceAreas = body.practice_areas.filter(
        (p): p is string => typeof p === 'string',
      );
    }
    if ('email' in body) patch.email = stringOrNull(body.email);
    if ('phone' in body) patch.phone = stringOrNull(body.phone);
    if ('website_url' in body) patch.websiteUrl = stringOrNull(body.website_url);
    if ('bio' in body) patch.bio = stringOrNull(body.bio);
    if ('photo_url' in body) patch.photoUrl = stringOrNull(body.photo_url);
    if (typeof body.status === 'string' && isAttorneyStatus(body.status)) {
      patch.status = body.status;
    }

    const clients = makeClientsFromEnv();
    const updated = await clients.db.updateAttorney(id, patch as never);
    if (!updated) return res.status(404).json({ error: 'Attorney not found' });
    return res.status(200).json({ attorney: updated });
  } catch (err) {
    console.error('PATCH /api/admin/attorneys/[id] failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}

async function handleArchive(id: string, res: VercelResponse) {
  try {
    const clients = makeClientsFromEnv();
    const updated = await clients.db.updateAttorney(id, { status: 'archived' });
    if (!updated) return res.status(404).json({ error: 'Attorney not found' });
    return res.status(200).json({ attorney: updated });
  } catch (err) {
    console.error('DELETE /api/admin/attorneys/[id] failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}

function isAttorneyStatus(v: unknown): v is AttorneyStatus {
  return v === 'pending' || v === 'approved' || v === 'rejected' || v === 'archived';
}

function stringOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed === '' ? null : trimmed;
}
