/**
 * GET /api/public/listings
 *
 * Public read-only list of active class-action listings, used by the
 * /class-actions directory page. Reads from v_active_listings which
 * already enforces "published + active firm + pilot-or-paid + not
 * past period end." Deduplicates by listingId so multi-subscription
 * rows don't surface as duplicates in the UI.
 *
 * Query params (all optional):
 *   category — e.g. 'ada_title_iii'
 *   q        — case-insensitive substring search on title + short description
 *
 * Cache: public for 5 min, CDN for 15 min, SWR 24h. Listings change
 * rarely; a stale-while-revalidate strategy means fast loads even if
 * the underlying data changed in the last few minutes.
 *
 * Ref: Step 26, Commit 1.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeClientsFromEnv } from '../../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const clients = makeClientsFromEnv();
    const org = await clients.db.getOrgByCode('adall');
    if (!org) {
      return res.status(500).json({ error: 'Default organization not found' });
    }

    const category =
      typeof req.query.category === 'string' ? req.query.category : undefined;
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    // v_active_listings already filters to the adall org (through firm).
    // Pass category to the query; search happens in-memory to keep the
    // view query simple and the CDN cache key stable for most users.
    const rawRows = await clients.db.listActiveListings(
      category ? { category } : undefined,
    );

    // Dedupe by listingId (multiple active subs for one listing emit
    // multiple rows; users only care about the listing, not its subs).
    const deduped = new Map<string, typeof rawRows[number]>();
    for (const r of rawRows) {
      if (!deduped.has(r.listingId)) deduped.set(r.listingId, r);
    }
    let rows = Array.from(deduped.values());

    if (q) {
      const qLower = q.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(qLower) ||
          (r.shortDescription?.toLowerCase().includes(qLower) ?? false),
      );
    }

    // Deterministic order: title alphabetical. Listings are a short
    // list (pilot + early paid = tens, not thousands); no need for
    // pagination yet.
    rows.sort((a, b) => a.title.localeCompare(b.title));

    // Strip internal-only fields before returning. Subscription info,
    // lawFirmId, etc. are admin data — public API returns only what
    // the directory page renders.
    const payload = rows.map((r) => ({
      listing_id: r.listingId,
      slug: r.slug,
      title: r.title,
      category: r.category,
      tier: r.tier,
      short_description: r.shortDescription,
      eligibility_summary: r.eligibilitySummary,
      law_firm_name: r.lawFirmName,
    }));

    res.setHeader(
      'Cache-Control',
      'public, max-age=300, s-maxage=900, stale-while-revalidate=86400',
    );
    return res.status(200).json({
      listings: payload,
      total_count: payload.length,
    });
  } catch (err) {
    console.error('[public/listings GET] failed:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
