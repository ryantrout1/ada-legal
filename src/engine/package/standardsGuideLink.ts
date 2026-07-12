/**
 * ADALL standards-guide link for a cited ADA standard (R5b).
 *
 * The demand letter cites the specific standard Ada classified (e.g. "§206").
 * This resolves that citation to a "learn more" link on ADALL's own Standards
 * Guide so the claimant can read what the requirement actually means.
 *
 * The 2010 ADA Standards are chapter-organized and ADALL mirrors that (chapters
 * 1–10 all exist at /standards-guide/chapter/{n}). A section's chapter is its
 * leading digit(s): §206 → chapter 2, §1009 → chapter 10. CFR-only citations
 * (e.g. "28 CFR §36.304") aren't 2010-Standards sections — their digits are
 * regulation parts, not sections — so those fall back to the guide index rather
 * than mis-linking to a chapter.
 *
 * Always returns an ADALL guides URL (specific chapter when resolvable, index
 * otherwise) — never a dead reference.
 *
 * Ref: /plan R5, Phase R5b.
 */

const APP_BASE = 'https://ada.adalegallink.com';
const GUIDE_INDEX = `${APP_BASE}/standards-guide`;

/** The 2010-Standards chapter for a section number, or null if not a section. */
function chapterForSection(n: string): string | null {
  if (/^10\d{2}$/.test(n)) return '10'; // 1001–1010 → chapter 10
  if (/^[1-9]\d{2}$/.test(n)) return n[0]!; // 1xx–9xx → chapter 1–9
  return null;
}

export function guideUrlForStandard(standard: string | null | undefined): string {
  const s = (standard ?? '').trim();
  // CFR citations carry regulation part numbers, not Standards sections — don't
  // let "28 CFR §36.304" mis-resolve to chapter 3.
  if (s && !/CFR/i.test(s)) {
    for (const n of s.match(/\d{3,4}/g) ?? []) {
      const ch = chapterForSection(n);
      if (ch) return `${APP_BASE}/standards-guide/chapter/${ch}`;
    }
  }
  return GUIDE_INDEX;
}
