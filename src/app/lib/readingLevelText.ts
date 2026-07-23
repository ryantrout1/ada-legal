/**
 * pickReadingLevelText — choose a litigation field variant for the
 * reader's current reading level, with a hard fallback to the base
 * (standard) field so text is never blank.
 *
 * Ported from Base44 (src/components/litigation/readingLevelText.jsx
 * @ 6b1e9ac). One seam change: this app's public payload is camelCase,
 * so variants derive as `${base}Simple` / `${base}Professional` rather
 * than B44's `${base}_simple` / `${base}_professional`.
 *
 * Resolution:
 *   simple       → {base}Simple        (fallback → base)
 *   standard     → base
 *   professional → {base}Professional  (fallback → base)
 *
 * A variant is used only when it holds non-empty trimmed text. 36 of 39
 * rows carry both variants today; the fallback covers the rest rather
 * than rendering an empty card.
 */

import type { ReadingLevel } from '../components/standards/ReadingLevelContext.js';

function nonEmpty(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v : null;
}

export function pickReadingLevelText(
  row: Record<string, unknown> | null | undefined,
  base: string,
  readingLevel: ReadingLevel,
): string {
  if (!row) return '';
  const fallback = nonEmpty(row[base]) ?? '';
  if (readingLevel === 'simple') {
    return nonEmpty(row[`${base}Simple`]) ?? fallback;
  }
  if (readingLevel === 'professional') {
    return nonEmpty(row[`${base}Professional`]) ?? fallback;
  }
  return fallback;
}

/**
 * Pick a simple/professional pair for the fields that have NO standard
 * column — `documentationRequired`, `noDocumentationPath`,
 * `evidenceGuidance`, `whatThisIsNot`. These are Neon-only guidance
 * fields with no Base44 counterpart; they go straight from simple to
 * professional with no canonical middle.
 *
 * Standard reading level prefers the professional variant (the more
 * rigorous default) and falls back to simple, so the field still
 * renders when only one variant was authored.
 *
 * Returns null rather than '' so callers can omit the whole section —
 * an empty guidance card is worse than no card.
 */
export function pickSimpleProText(
  row: Record<string, unknown> | null | undefined,
  base: string,
  readingLevel: ReadingLevel,
): string | null {
  if (!row) return null;
  const simple = nonEmpty(row[`${base}Simple`]);
  const professional = nonEmpty(row[`${base}Professional`]);
  if (readingLevel === 'simple') return simple ?? professional;
  return professional ?? simple;
}
