/**
 * Ada Spot — photo annotation types (pins).
 *
 * A pin is a single POINT on a photo — a center, not an extent. The model's
 * box center tracks the scene far better than the box size does, so we mark a
 * location and make no claim about the object's exact bounds. A pin says "look
 * here", never "it is exactly this". That is the honest claim for a screening
 * product, and it degrades gracefully: a pin slightly off a small object still
 * points at it, where a loose box that misses it looks broken.
 *
 * New file rather than an addition to reportSchema.ts on purpose — Phase 1 is
 * an internal preview only. Persisting pins into the buyer report
 * (SpotReportContent) is Phase 2. Ref: /plan Spot photo annotation.
 */

import type { PhotoFindingSeverity } from '../../types/db.js';

/** A placed point, before it is tied to a finding. All fields 0..1. */
export interface PlacedPin {
  /** Center X as an image fraction from the left. */
  x: number;
  /** Center Y as an image fraction from the top. */
  y: number;
  /** The model's confidence that this point is correct (0..1). */
  confidence: number;
}

/** A pin bound to the finding it marks. */
export interface PhotoPin extends PlacedPin {
  /** The finding's headline, shown as the pin's text equivalent. */
  label: string;
  severity: PhotoFindingSeverity;
  /** Index of the source finding in its analysis, for cross-referencing. */
  findingIndex: number;
}

/** One photo and the pins placed on it. */
export interface PhotoAnnotation {
  photoUrl: string;
  pins: PhotoPin[];
}
