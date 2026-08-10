/**
 * Ada Spot — pin a composed report item from the analyzer's own bounding box.
 *
 * The pipeline used to place every item with a separate full-frame model call,
 * discarding the box the analyzer had already drawn. On the run that motivated
 * this, the analyzer boxed the shower curb correctly (y 0.72, h 0.05) and the
 * placement call put the pin on the floor at 0.87 — the good answer was
 * computed and thrown away, and the result changed from run to run because a
 * second model call is a second roll of the dice.
 *
 * Pinning from the box is deterministic: same analysis, same pin, every time.
 * No extra model call, no latency, no cost.
 *
 * Items are joined to findings by ADA section. That key is measured, not
 * assumed: thirteen runs of the same curb produced seven distinct titles but
 * exactly one section (608.7), and none of 371 stored findings lacked a
 * section. Titles are unusable as identity here.
 *
 * Returns null rather than guessing when there is no boxed match — the caller
 * falls back to placement, which is the previous behavior.
 */

import type { PhotoAnalysisOutput, PhotoFinding, PhotoFindingSeverity } from '../../types/db.js';
import type { PlacedPin, PinSource } from './annotationTypes.js';
import type { SpotReportItem } from './reportSchema.js';

const round3 = (n: number): number => Math.round(n * 1000) / 1000;

/** Sections differ only cosmetically between runs (a stray section sign or space). */
function normalizeSection(s: string): string {
  return s.replace(/[§\s]/g, '').toLowerCase();
}

type BoxedFinding = PhotoFinding & { bounding_box: NonNullable<PhotoFinding['bounding_box']> };

function hasBox(f: PhotoFinding): f is BoxedFinding {
  return Boolean(f.bounding_box);
}

/**
 * The box center for a composed item, or null when nothing matches.
 *
 * Where several findings cite the same section — measured at 4.5% of section
 * groups, e.g. a mirror and a faucet both citing 606 — severity breaks the tie
 * first, then confidence. Severity leads because it is the stronger signal that
 * two findings are about the same barrier.
 */
export function boxPinForItem(
  item: SpotReportItem,
  analyses: readonly PhotoAnalysisOutput[],
): (PlacedPin & { source: PinSource }) | null {
  if (!item.citedSection) return null;
  const wanted = normalizeSection(item.citedSection);

  const candidates: BoxedFinding[] = [];
  for (const a of analyses) {
    for (const f of a.findings ?? []) {
      if (!hasBox(f)) continue;
      if (normalizeSection(f.standard ?? '') !== wanted) continue;
      candidates.push(f);
    }
  }
  if (candidates.length === 0) return null;

  const sameSeverity = candidates.filter(
    (f) => f.severity === (item.severity as PhotoFindingSeverity),
  );
  const pool = sameSeverity.length > 0 ? sameSeverity : candidates;
  const best = pool.reduce((acc, f) => (f.confidence > acc.confidence ? f : acc));

  const b = best.bounding_box;
  return {
    x: round3(b.x + b.w / 2),
    y: round3(b.y + b.h / 2),
    confidence: best.confidence,
    // The analyzer localized this itself, so the marker is precise regardless
    // of the finding's confidence — that number is about whether the concern
    // is real, not about where it is.
    source: 'box',
    // No label: the caller falls back to the composed item's own title, which
    // is the buyer-facing wording.
  };
}
