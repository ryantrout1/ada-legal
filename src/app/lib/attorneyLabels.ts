/**
 * Attorney vocabulary labels.
 *
 * The attorney directory stores practice areas and specialty tags as
 * slugs (`public_accommodations`, `civil_rights`). Those are the right
 * thing on the wire — `/api/attorneys` filters on them and Ada's
 * search_attorneys tool matches them — and the wrong thing on screen.
 *
 * This is the attorney-side counterpart to litigationLabels.ts. Two
 * correct implementations of this function already existed when it was
 * written, both admin-scoped and neither reachable from a public page:
 * `humanizeSlug` in the attorney portal, and `humanizeArea` in Base44's
 * admin. Because no public surface on either side ever formatted these,
 * the raw slugs shipped to the public directory on both. Giving the
 * mapping one home is what stops the next surface re-deciding.
 *
 * LABEL, NEVER VALUE. Callers must format display text only. The slug
 * remains the option `value`, the query parameter, and the comparison
 * key — formatting a value would silently break server-side filtering.
 */

/** Slugs that are acronyms: 'ada' → 'ADA', not 'Ada'. */
const UPPER_SLUGS = new Set(['ada', 'eeoc', 'doj', 'hud']);

/**
 * 'public_accommodations' → 'Public accommodations'; 'ada' → 'ADA'.
 *
 * Sentence case, not title case: "Public accommodations" reads as prose
 * on a card, where "Public Accommodations" reads as a heading. Unknown
 * slugs humanize generically rather than falling back to the raw value,
 * so a newly added practice area is presentable the day it appears.
 */
export function practiceAreaLabel(slug: string | null | undefined): string {
  if (!slug || !slug.trim()) return '';
  const normalized = slug.trim().toLowerCase();
  if (UPPER_SLUGS.has(normalized)) return normalized.toUpperCase();
  const words = normalized.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
