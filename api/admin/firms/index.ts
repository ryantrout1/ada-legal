/**
 * /api/admin/firms
 *
 *   GET  — list law firms with filter + pagination
 *   POST — create a new law firm
 *
 * Both admin-only. Scoped to the admin's org via the organizations
 * lookup in requireAdmin.
 *
 * Ref: Step 25, Commit 1.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { requireAdmin } from '../../_admin.js';
import { makeClientsFromEnv } from '../../_shared.js';
import type { LawFirmRow } from '../../../src/engine/clients/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  // Resolve default org. In Ch0 there's a single org ('adall'); Ch1+
  // may introduce multi-org and tie this to auth.userId.
  const clients = makeClientsFromEnv();
  const org = await clients.db.getOrgByCode('adall');
  if (!org) {
    res.status(500).json({ error: 'Default organization not found' });
    return;
  }

  if (req.method === 'GET') return handleList(req, res, clients, org.id);
  if (req.method === 'POST') return handleCreate(req, res, clients, org.id);

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}

// ─── GET list ────────────────────────────────────────────────────────────────

function isFirmStatus(value: unknown): value is 'active' | 'suspended' | 'churned' {
  return value === 'active' || value === 'suspended' || value === 'churned';
}

function parseIntOr(raw: unknown, fallback: number): number {
  if (typeof raw !== 'string') return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseBool(raw: unknown): boolean | undefined {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return undefined;
}

async function handleList(
  req: VercelRequest,
  res: VercelResponse,
  clients: ReturnType<typeof makeClientsFromEnv>,
  orgId: string,
): Promise<void> {
  try {
    const statusRaw = typeof req.query.status === 'string' ? req.query.status : undefined;
    const status = isFirmStatus(statusRaw) ? statusRaw : undefined;
    const isPilot = parseBool(req.query.is_pilot);
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const page = parseIntOr(req.query.page, 1);
    const pageSize = Math.min(parseIntOr(req.query.page_size, 50), 100);

    const result = await clients.db.listFirmsForAdmin({
      orgId,
      status,
      isPilot,
      search,
      page,
      pageSize,
    });

    res.status(200).json({
      firms: result.firms,
      total_count: result.totalCount,
      page: result.page,
      page_size: result.pageSize,
    });
  } catch (err) {
    console.error('[admin/firms GET] failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

// ─── POST create ─────────────────────────────────────────────────────────────

interface CreateFirmBody {
  name: string;
  primary_contact?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: 'active' | 'suspended' | 'churned';
  is_pilot?: boolean;
  stripe_customer_id?: string | null;
}

function parseCreateBody(body: unknown): CreateFirmBody | { error: string } {
  if (!body || typeof body !== 'object') {
    return { error: 'Request body must be a JSON object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b.name !== 'string' || !b.name.trim()) {
    return { error: 'name is required' };
  }
  if (b.status !== undefined && !isFirmStatus(b.status)) {
    return { error: "status must be 'active', 'suspended', or 'churned'" };
  }
  if (b.is_pilot !== undefined && typeof b.is_pilot !== 'boolean') {
    return { error: 'is_pilot must be a boolean' };
  }
  const optStr = (v: unknown): string | null | undefined =>
    v === undefined ? undefined : v === null ? null : typeof v === 'string' ? v : undefined;

  return {
    name: b.name.trim(),
    primary_contact: optStr(b.primary_contact),
    email: optStr(b.email),
    phone: optStr(b.phone),
    status: b.status as CreateFirmBody['status'],
    is_pilot: b.is_pilot as boolean | undefined,
    stripe_customer_id: optStr(b.stripe_customer_id),
  };
}

async function handleCreate(
  req: VercelRequest,
  res: VercelResponse,
  clients: ReturnType<typeof makeClientsFromEnv>,
  orgId: string,
): Promise<void> {
  const parsed = parseCreateBody(req.body);
  if ('error' in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const id = randomUUID();
  const row: LawFirmRow = {
    id,
    orgId,
    name: parsed.name,
    primaryContact: parsed.primary_contact ?? null,
    email: parsed.email ?? null,
    phone: parsed.phone ?? null,
    stripeCustomerId: parsed.stripe_customer_id ?? null,
    status: parsed.status ?? 'active',
    isPilot: parsed.is_pilot ?? true,
  };

  try {
    await clients.db.writeLawFirm(row);
    res.status(201).json({ firm: row });
  } catch (err) {
    console.error('[admin/firms POST] failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
