/**
 * Ada Spot — build photo annotations from the analyzer's own bounding boxes.
 *
 * This is the /photo field-test path. It replaces the per-finding re-placement
 * pass (buildPhotoAnnotations → placeFinding) that /triage found unreliable on
 * hard photos: on a dim, mirror-heavy bathroom it collapsed three distinct
 * findings — a shower curb, a fixed bench, and a vanity cabinet — into a tight
 * center cluster, landing the bench pin on the toilet. The analyzer already
 * emits a bounding box per finding, and for that same photo those boxes placed
 * the curb lower-left and the cabinet on the right, correctly. So mark the box
 * center and skip the second model call entirely — cheaper, faster, and on the
 * evidence we have, more accurate.
 *
 * A pin is a POINT, not an extent (see annotationTypes.ts): we mark the box
 * center and make no claim about the object's exact bounds. Same two gates as
 * the re-placement path, both failing safe toward "no pin":
 *   - confirmable gate: a finding the photo could not settle (confirmable ===
 *     false) has no visible object to point at — prose only, never a pin.
 *   - confidence gate: the finding's own analyzer confidence must clear the
 *     floor. Below it, no pin; the finding still reads in prose.
 * Plus a box gate the re-placement path did not need: a finding with no box, or
 * a box whose center falls outside 0..1, gets no pin rather than a pin in the
 * wrong place. A missing pin is always preferable to a pin on the wrong thing.
 *
 * Pure and deterministic — no model call. Ref: /triage /photo pins cluster.
 */

import type { PhotoFinding } from '../../types/db.js';
import type { PhotoAnnotation, PhotoPin } from './annotationTypes.js';

export interface BuildBoxAnnotationsOptions {
  /** Minimum analyzer confidence to draw a pin. Below this → no pin. */
  minConfidence: number;
}

function inUnit(n: number): boolean {
  return Number.isFinite(n) && n >= 0 && n <= 1;
}

/** Match placeFinding's round3 — keep coordinates clean of float noise. */
const round3 = (n: number): number => Math.round(n * 1000) / 1000;

/**
 * Build a single PhotoAnnotation for one photo, one pin per finding that clears
 * the confirmable, confidence, and box gates. The pin sits at the box center;
 * itemIndex is the finding's index so numberPins can number them in order.
 * Always returns exactly one entry (even with zero pins) so the caller renders
 * the photo unannotated rather than dropping it.
 */
export function annotationsFromBoxes(
  photoUrl: string,
  findings: readonly PhotoFinding[] | undefined,
  opts: BuildBoxAnnotationsOptions,
): PhotoAnnotation[] {
  const pins: PhotoPin[] = [];
  const list = findings ?? [];

  for (let i = 0; i < list.length; i++) {
    const f = list[i];
    // Confirmable gate: absence / unmeasurable → prose only.
    if (f.confirmable === false) continue;
    // Confidence gate: uncertain findings draw nothing.
    if (typeof f.confidence !== 'number' || f.confidence < opts.minConfidence) continue;
    // Box gate: no box, or a center outside the frame → no pin.
    const box = f.bounding_box;
    if (!box) continue;
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    if (!inUnit(cx) || !inUnit(cy)) continue;

    pins.push({
      x: round3(cx),
      y: round3(cy),
      confidence: f.confidence,
      label: f.title_standard,
      severity: f.severity,
      itemIndex: i,
    });
  }

  return [{ photoUrl, pins }];
}
