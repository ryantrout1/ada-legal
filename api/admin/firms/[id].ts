/**
 * /api/admin/firms/[id]
 *
 *   GET   — fetch a single firm
 *   PATCH — update a firm (partial)
 *
 * Admin-only. The firm must exist and belong to the admin's org.
 *
 * Ref: Step 25, Commit 1.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { makeClientsFromEnv } from '../../_shared.js';
import type { LawFirmRow } from '../../../src/engine/clients/types.js';

function isFirmStatus(value: unknown): value is 'active' | 'suspended' | 'churned' {
  return value === 'active' || value === 'suspended' || value === 'churned';
}

function optString(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v === 'string') return v;
  return undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  const clients = makeClientsFromEnv();
  const org = await clients.db.getOrgByCode('adall');
  if (!org) {
    return res.status(500).json({ error: 'Default organization not found' });
  }

  const existing = await clients.db.readLawFirmById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Firm not found' });
  }
  if (existing.orgId !== org.id) {
    // Cross-org access — treat as not found to avoid leaking existence.
    return res.status(404).json({ error: 'Firm not found' });
  }

  if (req.method === 'GET') {
    return res.status(200).json({ firm: existing });
  }

  if (req.method === 'PATCH') {
    const body = (req.body ?? {}) as Record<string, unknown>;

    // Validate optional fields.
    if (body.status !== undefined && !isFirmStatus(body.status)) {
      return res
        .status(400)
        .json({ error: "status must be 'active', 'suspended', or 'churned'" });
    }
    if (body.is_pilot !== undefined && typeof body.is_pilot !== 'boolean') {
      return res.status(400).json({ error: 'is_pilot must be a boolean' });
    }
    if (
      body.name !== undefined &&
      (typeof body.name !== 'string' || !body.name.trim())
    ) {
      return res.status(400).json({ error: 'name must be a non-empty string' });
    }

    const updated: LawFirmRow = {
      ...existing,
      name: typeof body.name === 'string' ? body.name.trim() : existing.name,
      primaryContact:
        body.primary_contact !== undefined
          ? (optString(body.primary_contact) ?? null)
          : existing.primaryContact,
      email:
        body.email !== undefined ? (optString(body.email) ?? null) : existing.email,
      phone:
        body.phone !== undefined ? (optString(body.phone) ?? null) : existing.phone,
      stripeCustomerId:
        body.stripe_customer_id !== undefined
          ? (optString(body.stripe_customer_id) ?? null)
          : existing.stripeCustomerId,
      status: isFirmStatus(body.status) ? body.status : existing.status,
      isPilot: typeof body.is_pilot === 'boolean' ? body.is_pilot : existing.isPilot,
    };

    try {
      await clients.db.writeLawFirm(updated);
      return res.status(200).json({ firm: updated });
    } catch (err) {
      console.error('[admin/firms PATCH] failed:', err);
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  res.setHeader('Allow', 'GET, PATCH');
  return res.status(405).json({ error: 'Method not allowed' });
}
