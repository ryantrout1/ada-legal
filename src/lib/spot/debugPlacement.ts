/**
 * Ada Spot — debug placement comparison for the /photo field-test harness.
 *
 * Two placement methods have each failed on hard bathroom photos: the analyzer's
 * own bounding boxes drift low-and-wide on small fixtures (a curb pin landing on
 * the floor), and the per-finding re-placement pass clusters distinct findings
 * toward center. We can't tell from the sandbox which lands closer on a given
 * photo, so `/photo?debug=1` renders BOTH per finding — the analyzer box as a
 * rectangle with its center dot (the method currently shipping), and a fresh
 * re-placement point — so the winner is chosen from real photos, not guessed.
 *
 * This type is the per-finding row the endpoint returns and the overlay draws.
 * Debug-only: it never ships to the buyer report or the normal harness view.
 */

import type { PhotoBoundingBox, PhotoFindingSeverity } from '../../types/db.js';

export interface DebugPoint {
  x: number;
  y: number;
}

export interface DebugPlacementPoint extends DebugPoint {
  confidence: number;
  label: string | null;
}

export interface DebugFindingPlacement {
  title: string;
  severity: PhotoFindingSeverity;
  /** The analyzer's own confidence for this finding (0..1). */
  analyzerConfidence: number;
  /** The raw analyzer box, drawn as a rectangle. Null when the finding has none. */
  box: PhotoBoundingBox | null;
  /** Center of that box — the point the shipping harness pins. Null with no box. */
  boxCenter: DebugPoint | null;
  /** A fresh single-finding re-placement point. Null when it declined or errored. */
  placement: DebugPlacementPoint | null;
}

const round3 = (n: number): number => Math.round(n * 1000) / 1000;

/**
 * Center of a bounding box, rounded to 3 decimals to match placeFinding. Returns
 * null for a missing box so the caller can render the rectangle-less case.
 */
export function boxCenterOf(box: PhotoBoundingBox | null | undefined): DebugPoint | null {
  if (!box) return null;
  return { x: round3(box.x + box.w / 2), y: round3(box.y + box.h / 2) };
}
