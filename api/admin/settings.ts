/**
 * /api/admin/settings
 *
 *   GET   — fetch all known settings
 *   PATCH — write one or more settings
 *
 * The settings shape is small and bounded. Each key has a known
 * default; unset keys return the default rather than null so the UI
 * can render a consistent state without special-casing missing rows.
 *
 * Known settings:
 *   data_collection_enabled (boolean, default true)
 *     When false, ada_sessions rows are still created but flagged as
 *     minimal-retention; detailed metadata is omitted. Enforced in
 *     the engine layer (Step 14 observability tightens this).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_admin.js';
import { makeClientsFromEnv } from '../_shared.js';

interface SettingsShape {
  data_collection_enabled: boolean;
}

const DEFAULTS: SettingsShape = {
  data_collection_enabled: true,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  if (req.method === 'GET') return handleGet(res);
  if (req.method === 'PATCH') return handlePatch(req, res, auth.userId);

  res.setHeader('Allow', 'GET, PATCH');
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(res: VercelResponse) {
  try {
    const clients = makeClientsFromEnv();
    const stored = await clients.db.getSystemSetting<Partial<SettingsShape>>('admin');
    const merged: SettingsShape = { ...DEFAULTS, ...(stored ?? {}) };
    return res.status(200).json({ settings: merged });
  } catch (err) {
    console.error('GET /api/admin/settings failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}

async function handlePatch(req: VercelRequest, res: VercelResponse, _userId: string) {
  try {
    const body = req.body as Record<string, unknown> | undefined;
    if (!body) return res.status(400).json({ error: 'Body required' });

    const clients = makeClientsFromEnv();
    const stored = await clients.db.getSystemSetting<Partial<SettingsShape>>('admin');
    const next: SettingsShape = { ...DEFAULTS, ...(stored ?? {}) };

    if (typeof body.data_collection_enabled === 'boolean') {
      next.data_collection_enabled = body.data_collection_enabled;
    }

    // TODO: updated_by FK expects a users.id uuid, not a Clerk user id.
    // Ch0 leaves this null; Ch1 adds the users-table mirror.
    await clients.db.setSystemSetting('admin', next, null);
    return res.status(200).json({ settings: next });
  } catch (err) {
    console.error('PATCH /api/admin/settings failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}
