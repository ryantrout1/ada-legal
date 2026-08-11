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

import type { PhotoFindingSeverity, PhotoBoundingBox } from '../../types/db.js';

/** A placed point, before it is tied to a finding. All fields 0..1. */
export interface PlacedPin {
  /** Center X as an image fraction from the left. */
  x: number;
  /** Center Y as an image fraction from the top. */
  y: number;
  /** The model's confidence that this point is correct (0..1). */
  confidence: number;
  /**
   * A short 2-4 word marker label for display on the photo (e.g. "Raised curb",
   * "Grab bars"). Falls back to the finding title when the model omits it.
   */
  label?: string;
}

/** The thing being placed on a photo: a short title and a longer detail. */
export interface PlaceTarget {
  title: string;
  detail: string;
}

/** Where a pin's location came from. */
export type PinSource = 'box' | 'placement';

/** A pin bound to the finding it marks. */
export interface PhotoPin extends PlacedPin {
  /**
   * How the location was determined. 'box' means the analyzer drew a bounding
   * box; its finding confidence is not treated as location certainty, and
   * because box y proved systematically low, a box pin renders approximate.
   * 'placement' means a separate model call estimated the point, and its
   * confidence genuinely reflects how sure it was of that location.
   * Optional: stored reports predate the field.
   */
  source?: PinSource;
  /** The finding's headline, shown as the pin's text equivalent. */
  label: string;
  severity: PhotoFindingSeverity;
  /** Index of the report item (or source finding) this pin marks. */
  itemIndex: number;
  /**
   * The analyzer box this pin came from, when it came from one. Lets the
   * renderer draw a band over an edge rather than a dot. Absent for pins from
   * the placement path and for stored reports predating this.
   */
  box?: PhotoBoundingBox;
}

/** One photo and the pins placed on it. */
export interface PhotoAnnotation {
  photoUrl: string;
  pins: PhotoPin[];
}
