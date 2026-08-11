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

import type {
  PhotoAnalysisOutput,
  PhotoBoundingBox,
  PhotoFinding,
  PhotoFindingSeverity,
} from '../../types/db.js';
import type { PlacedPin, PinSource } from './annotationTypes.js';
import { isEdgeBox } from './pinMarkerShape.js';
import type { SpotReportItem } from './reportSchema.js';

const round3 = (n: number): number => Math.round(n * 1000) / 1000;

/** How far below a linear feature's top edge to sit, so the marker is legible. */
const LINEAR_TOP_INSET = 0.015;

/** How far in from a linear feature's left end to sit, so the marker is legible. */
const LINEAR_LEFT_INSET = 0.02;

/**
 * Where inside the box to put the marker.
 *
 * For an object — a cabinet, a bench, a mirror — the centre is right. For an
 * EDGE it is not: the analyzer boxes a curb as a wide thin band around the
 * step, and the centre of that band lands on the curb's face or the tile just
 * below it. What a person points at on a raised threshold is the step line,
 * which is the box's top edge.
 *
 * Measured: 8 runs boxed the curb at avg y 0.744, h 0.058 — so the centre sat
 * at 0.773 while crop-guided placement, which only answers when it can
 * actually see the object, independently put the curb at 0.73.
 *
 * Keyed on shape, so it covers any threshold or floor transition without
 * naming them, and leaves object-shaped and tall-thin boxes alone.
 */
function referenceY(box: { y: number; w: number; h: number }): number {
  if (!isEdgeBox(box)) return box.y + box.h / 2;
  // Inset is capped at half the height so the marker can never sit outside a
  // very thin box.
  return box.y + Math.min(LINEAR_TOP_INSET, box.h / 2);
}

/**
 * Where along the box's width to put the marker.
 *
 * For an object the horizontal centre is right — it sits on the thing. For an
 * EDGE it is not: the analyzer boxes a curb as a wide, loose band (measured
 * 0.42–0.5 wide) whose right half often overhangs open floor, so a point at the
 * band's centre drifts off the curb toward the middle of the room. The stable
 * end of a threshold is where it meets the wall — the left end of the step line
 * — so an edge marker anchors there, a small inset in from the box's left edge.
 *
 * Same shape predicate as referenceY, so objects and tall-thin boxes keep their
 * centre and only true edges move.
 */
function referenceX(box: { x: number; w: number; h: number }): number {
  if (!isEdgeBox(box)) return box.x + box.w / 2;
  // Inset capped at half the width so the marker can never sit past a very
  // narrow box's right edge.
  return box.x + Math.min(LINEAR_LEFT_INSET, box.w / 2);
}

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
): (PlacedPin & { source: PinSource; box: PhotoBoundingBox }) | null {
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
    x: round3(referenceX(b)),
    y: round3(referenceY(b)),
    confidence: best.confidence,
    // source 'box' so the tier logic does NOT gate on this confidence — it is
    // about whether the concern is real, not where it is. The box y proved
    // systematically low, so a box pin renders approximate, not precise
    // (see pinConfidenceTier).
    source: 'box',
    // Carry the box so the edge-snap pass (snapEdgeItems) can refine an edge
    // pin against the real image, and so referenceX/Y can shape the point.
    box: b,
    // No label: the caller falls back to the composed item's own title, which
    // is the buyer-facing wording.
  };
}
