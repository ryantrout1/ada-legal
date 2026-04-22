/**
 * /api/admin/listings/[id]
 *
 *   GET   — fetch a single listing
 *   PATCH — update a listing (partial)
 *
 * Admin-only. Scoped via the owning firm's org_id.
 *
 * Ref: Step 25, Commit 3.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { makeClientsFromEnv } from '../../_shared.js';
import type { ListingRow } from '../../../src/engine/clients/types.js';

function isListingStatus(value: unknown): value is 'draft' | 'published' | 'archived' {
  return value === 'draft' || value === 'published' || value === 'archived';
}

function isListingTier(value: unknown): value is 'basic' | 'premium' {
  return value === 'basic' || value === 'premium';
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

  const existing = await clients.db.readListingById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Listing not found' });
  }
  // Scope by org through the owning firm.
  const firm = await clients.db.readLawFirmById(existing.lawFirmId);
  if (!firm || firm.orgId !== org.id) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  if (req.method === 'GET') {
    return res.status(200).json({ listing: existing });
  }

  if (req.method === 'PATCH') {
    const body = (req.body ?? {}) as Record<string, unknown>;

    if (body.status !== undefined && !isListingStatus(body.status)) {
      return res
        .status(400)
        .json({ error: "status must be 'draft', 'published', or 'archived'" });
    }
    if (
      body.title !== undefined &&
      (typeof body.title !== 'string' || !body.title.trim())
    ) {
      return res.status(400).json({ error: 'title must be a non-empty string' });
    }
    // Slug updates are allowed but must still validate the format.
    if (body.slug !== undefined) {
      if (
        typeof body.slug !== 'string' ||
        !/^[a-z0-9][a-z0-9-]{2,}$/.test(body.slug)
      ) {
        return res.status(400).json({
          error:
            'slug must be 3+ chars, lowercase letters/numbers/hyphens only',
        });
      }
      if (body.slug !== existing.slug) {
        const collision = await clients.db.readListingBySlug(body.slug);
        if (collision && collision.id !== existing.id) {
          return res
            .status(409)
            .json({ error: `slug '${body.slug}' is already taken` });
        }
      }
    }
    // Changing firm is allowed but the new firm must be in this org.
    if (body.law_firm_id !== undefined) {
      if (typeof body.law_firm_id !== 'string') {
        return res.status(400).json({ error: 'law_firm_id must be a string' });
      }
      const newFirm = await clients.db.readLawFirmById(body.law_firm_id);
      if (!newFirm || newFirm.orgId !== org.id) {
        return res
          .status(400)
          .json({ error: 'law_firm_id does not reference a firm in this organization' });
      }
    }

    const updated: ListingRow = {
      ...existing,
      lawFirmId:
        typeof body.law_firm_id === 'string' ? body.law_firm_id : existing.lawFirmId,
      title: typeof body.title === 'string' ? body.title.trim() : existing.title,
      slug: typeof body.slug === 'string' ? body.slug.trim() : existing.slug,
      category:
        typeof body.category === 'string' && body.category
          ? body.category
          : existing.category,
      shortDescription:
        body.short_description !== undefined
          ? (optString(body.short_description) ?? null)
          : existing.shortDescription,
      fullDescription:
        body.full_description !== undefined
          ? (optString(body.full_description) ?? null)
          : existing.fullDescription,
      eligibilitySummary:
        body.eligibility_summary !== undefined
          ? (optString(body.eligibility_summary) ?? null)
          : existing.eligibilitySummary,
      status: isListingStatus(body.status) ? body.status : existing.status,
      tier: isListingTier(body.tier) ? body.tier : existing.tier,
    };

    try {
      await clients.db.writeListing(updated);
      return res.status(200).json({ listing: updated });
    } catch (err) {
      console.error('[admin/listings PATCH] failed:', err);
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  res.setHeader('Allow', 'GET, PATCH');
  return res.status(405).json({ error: 'Method not allowed' });
}
