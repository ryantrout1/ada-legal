/**
 * Ada Spot — is a finding's box an edge or an object?
 *
 * A curb, threshold, ramp lip or floor transition boxes as a wide thin band.
 * A cabinet, bench or mirror boxes as something roughly square. The two want
 * different markers, and different pin positions:
 *
 *   edge   → band drawn over the box, pin at the step line (its top edge)
 *   object → dot at the box centre
 *
 * The reason for the band: a dot asserts we know the location to within a
 * percent of the frame. Measured across eight runs of the same photo, the
 * analyzer's box for a shower curb moved about 6% between runs with no code
 * change. A band covering the box still lies over the curb when it drifts; a
 * dot drifts onto the floor tile. The marker should claim the precision we
 * have, not the precision we wish we had.
 *
 * One predicate lives here and is used by both the renderer and the pin
 * position, because "is this an edge" answered in two places is exactly the
 * kind of split that has already caused three separate bugs in this pipeline.
 *
 * Pure. Safe to import from the client — no image work happens here.
 */

import type { PhotoBoundingBox } from '../../types/db.js';

/** Wider than tall by this factor to count as a linear horizontal feature. */
export const EDGE_ASPECT_MIN = 4;
/** Above this height it reads as an area even when wide (a wall, a floor zone). */
export const EDGE_MAX_HEIGHT = 0.12;

export type MarkerShape = 'band' | 'dot';

/**
 * True when the box describes a horizontal edge rather than an object.
 *
 * Verified against real analyzer output: in a full bathroom analysis the curb
 * came back at aspect 8.3 while every other finding was 1.3 or below, so the
 * cutoff has wide margin on both sides rather than being tuned to one photo.
 */
export function isEdgeBox(box: Pick<PhotoBoundingBox, 'w' | 'h'>): boolean {
  return box.h > 0 && box.h <= EDGE_MAX_HEIGHT && box.w / box.h >= EDGE_ASPECT_MIN;
}

/** Which marker to draw. No box (stored reports predate it) means a dot. */
export function markerShape(box: PhotoBoundingBox | undefined): MarkerShape {
  if (!box) return 'dot';
  return isEdgeBox(box) ? 'band' : 'dot';
}
