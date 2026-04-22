/**
 * /api/admin/listings
 *
 *   GET  — list listings with filter + pagination
 *   POST — create a new listing
 *
 * Both admin-only. Listings are scoped via their firm's org_id.
 *
 * Ref: Step 25, Commit 3.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { requireAdmin } from '../../_admin.js';
import { makeClientsFromEnv } from '../../_shared.js';
import type { ListingRow } from '../../../src/engine/clients/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await requireAdmin(req, res);
  if (!auth) return;

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isListingStatus(value: unknown): value is 'draft' | 'published' | 'archived' {
  return value === 'draft' || value === 'published' || value === 'archived';
}

function isListingTier(value: unknown): value is 'basic' | 'premium' {
  return value === 'basic' || value === 'premium';
}

function parseIntOr(raw: unknown, fallback: number): number {
  if (typeof raw !== 'string') return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function optString(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v === 'string') return v;
  return undefined;
}

// ─── GET list ────────────────────────────────────────────────────────────────

async function handleList(
  req: VercelRequest,
  res: VercelResponse,
  clients: ReturnType<typeof makeClientsFromEnv>,
  orgId: string,
): Promise<void> {
  try {
    const lawFirmId =
      typeof req.query.law_firm_id === 'string' ? req.query.law_firm_id : undefined;
    const statusRaw = typeof req.query.status === 'string' ? req.query.status : undefined;
    const status = isListingStatus(statusRaw) ? statusRaw : undefined;
    const category =
      typeof req.query.category === 'string' ? req.query.category : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const page = parseIntOr(req.query.page, 1);
    const pageSize = Math.min(parseIntOr(req.query.page_size, 50), 100);

    const result = await clients.db.listListingsForAdmin({
      orgId,
      lawFirmId,
      status,
      category,
      search,
      page,
      pageSize,
    });

    res.status(200).json({
      listings: result.listings,
      total_count: result.totalCount,
      page: result.page,
      page_size: result.pageSize,
    });
  } catch (err) {
    console.error('[admin/listings GET] failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

// ─── POST create ─────────────────────────────────────────────────────────────

interface CreateListingBody {
  law_firm_id: string;
  title: string;
  slug: string;
  category: string;
  short_description?: string | null;
  full_description?: string | null;
  eligibility_summary?: string | null;
  status?: 'draft' | 'published' | 'archived';
  tier?: 'basic' | 'premium';
}

function parseCreateBody(body: unknown): CreateListingBody | { error: string } {
  if (!body || typeof body !== 'object') {
    return { error: 'Request body must be a JSON object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b.law_firm_id !== 'string' || !b.law_firm_id) {
    return { error: 'law_firm_id is required' };
  }
  if (typeof b.title !== 'string' || !b.title.trim()) {
    return { error: 'title is required' };
  }
  if (typeof b.slug !== 'string' || !b.slug.trim()) {
    return { error: 'slug is required' };
  }
  if (!/^[a-z0-9][a-z0-9-]{2,}$/.test(b.slug)) {
    return {
      error:
        'slug must be 3+ chars, lowercase letters/numbers/hyphens only, starting with a letter or number',
    };
  }
  if (typeof b.category !== 'string' || !b.category) {
    return { error: 'category is required' };
  }
  if (b.status !== undefined && !isListingStatus(b.status)) {
    return { error: "status must be 'draft', 'published', or 'archived'" };
  }
  if (b.tier !== undefined && !isListingTier(b.tier)) {
    return { error: "tier must be 'basic' or 'premium'" };
  }
  return {
    law_firm_id: b.law_firm_id,
    title: b.title.trim(),
    slug: b.slug.trim(),
    category: b.category,
    short_description: optString(b.short_description),
    full_description: optString(b.full_description),
    eligibility_summary: optString(b.eligibility_summary),
    status: b.status as CreateListingBody['status'],
    tier: isListingTier(b.tier) ? b.tier : undefined,
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

  // Verify the firm exists and belongs to this org
  const firm = await clients.db.readLawFirmById(parsed.law_firm_id);
  if (!firm || firm.orgId !== orgId) {
    res.status(400).json({ error: 'law_firm_id does not reference a firm in this organization' });
    return;
  }

  // Check slug uniqueness
  const existing = await clients.db.readListingBySlug(parsed.slug);
  if (existing) {
    res.status(409).json({ error: `A listing with slug '${parsed.slug}' already exists` });
    return;
  }

  const id = randomUUID();
  const row: ListingRow = {
    id,
    lawFirmId: parsed.law_firm_id,
    title: parsed.title,
    slug: parsed.slug,
    category: parsed.category,
    shortDescription: parsed.short_description ?? null,
    fullDescription: parsed.full_description ?? null,
    eligibilitySummary: parsed.eligibility_summary ?? null,
    status: parsed.status ?? 'draft',
    tier: parsed.tier ?? 'basic',
  };

  try {
    await clients.db.writeListing(row);
    res.status(201).json({ listing: row });
  } catch (err) {
    console.error('[admin/listings POST] failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
