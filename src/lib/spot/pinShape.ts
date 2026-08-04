/**
 * Ada Spot — point-vs-region decision for a photo marker (/plan Phase 1).
 *
 * /triage established that the analyzer localizes some fixtures loosely: a curb
 * gets a box half the frame wide, low on the floor. Pinning the center of such
 * a box draws a precise dot that claims a certainty the model doesn't have. A
 * tight box, by contrast, is a trustworthy point.
 *
 * This is the honesty guardrail: a loose box (long side or large area) renders
 * as a translucent REGION — "concern somewhere in here" — while a tight box
 * stays a precise POINT. It does NOT move the box; a low curb box still reads
 * low. Correcting the location itself is the analyzer-grounding work in a later
 * phase. This only stops the false precision.
 *
 * The default thresholds are a first cut; the box-accuracy eval (Phase 2) exists
 * to validate and tune them against real photos. Pure and deterministic.
 */

import type { PhotoBoundingBox } from '../../types/db.js';

/** Longer box side above this fraction of the image → region. */
export const REGION_MAX_SIDE = 0.4;
/** Box area above this fraction of the image → region. */
export const REGION_MAX_AREA = 0.12;

export type PinShape = 'point' | 'region';

export function pinShape(
  box: PhotoBoundingBox,
  opts: { maxSide?: number; maxArea?: number } = {},
): PinShape {
  const maxSide = opts.maxSide ?? REGION_MAX_SIDE;
  const maxArea = opts.maxArea ?? REGION_MAX_AREA;
  const longerSide = Math.max(box.w, box.h);
  const area = box.w * box.h;
  return longerSide > maxSide || area > maxArea ? 'region' : 'point';
}
