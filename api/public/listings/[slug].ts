/**
 * GET /api/public/listings/[slug]
 *
 * Public detail endpoint for the /class-actions/:slug page. Returns
 * the listing + a PUBLIC-SAFE subset of its config:
 *   - caseDescription (fine to show)
 *   - eligibilityCriteria (shown grouped by kind on the page)
 *   - disqualifyingConditions (shown so users can self-select out)
 *
 * Deliberately omitted from public payload:
 *   - requiredFields (that's Ada's intake schema, not user-facing)
 *   - adaPromptOverride (internal)
 *
 * Must hit an ACTIVE listing (i.e. surface via v_active_listings).
 * Drafts and archived listings return 404 — same as a nonexistent slug.
 * This prevents the directory from previewing listings that weren't
 * meant to be public yet.
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

  const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
  if (!slug) {
    return res.status(400).json({ error: 'slug is required' });
  }

  try {
    const clients = makeClientsFromEnv();
    const org = await clients.db.getOrgByCode('adall');
    if (!org) {
      return res.status(500).json({ error: 'Default organization not found' });
    }

    // Fetch all active listings + filter by slug. Using the view (not
    // readListingBySlug directly) ensures the slug maps to an ACTIVE
    // listing — a draft/archived slug returns 404, not a partial page.
    const active = await clients.db.listActiveListings();
    const match = active.find((r) => r.slug === slug);
    if (!match) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Load the config for the eligibility content. A listing can
    // technically exist without a config (pilot firms sometimes start
    // a listing before the config is written); in that case we return
    // the listing shell with null config arrays, so the page renders
    // gracefully rather than 404-ing.
    const config = await clients.db.readListingConfigForListing(
      match.listingId,
    );

    const payload = {
      listing_id: match.listingId,
      slug: match.slug,
      title: match.title,
      category: match.category,
      short_description: match.shortDescription,
      short_description_simple: match.shortDescriptionSimple ?? null,
      short_description_professional: match.shortDescriptionProfessional ?? null,
      full_description: match.fullDescription,
      full_description_simple: match.fullDescriptionSimple ?? null,
      full_description_professional: match.fullDescriptionProfessional ?? null,
      eligibility_summary: match.eligibilitySummary,
      eligibility_summary_simple: match.eligibilitySummarySimple ?? null,
      eligibility_summary_professional: match.eligibilitySummaryProfessional ?? null,
      law_firm_name: match.lawFirmName,
      case_description: config?.caseDescription ?? null,
      case_description_simple: config?.caseDescriptionSimple ?? null,
      case_description_professional: config?.caseDescriptionProfessional ?? null,
      eligibility_criteria: (config?.eligibilityCriteria as Array<{
        description: string;
        kind: 'required' | 'preferred' | 'disqualifying';
      }>) ?? [],
      disqualifying_conditions: config?.disqualifyingConditions ?? [],
    };

    res.setHeader(
      'Cache-Control',
      'public, max-age=300, s-maxage=900, stale-while-revalidate=86400',
    );
    return res.status(200).json({ listing: payload });
  } catch (err) {
    console.error('[public/listings/:slug GET] failed:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
