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
  /**
   * Crop-guided placement: the image cropped to a padded box region, placed
   * within the crop, mapped back to full-image coords. Null when there was no
   * box to crop to, or the crop/placement failed.
   */
  cropPlacement: DebugPlacementPoint | null;
}

/** A normalized crop window over the full image (fractions from top-left). */
export interface CropRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

const round3 = (n: number): number => Math.round(n * 1000) / 1000;
const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

/**
 * A padded crop window around an analyzer box. The analyzer boxes drift — a
 * curb box lands below the real threshold, so the crop pads outward to pull the
 * object back into frame. Padding is proportional to the box (a fraction of its
 * own width/height per side) rather than a fixed image fraction, so a box that
 * sits right beside a decoy (the white cabinet next to the white door) isn't
 * padded so far it swallows the decoy again. Clamped to the image.
 */
export function paddedCropRegion(
  box: PhotoBoundingBox,
  padFraction = 0.35,
): CropRegion {
  const px = box.w * padFraction;
  const py = box.h * padFraction;
  const x0 = clamp01(box.x - px);
  const y0 = clamp01(box.y - py);
  const x1 = clamp01(box.x + box.w + px);
  const y1 = clamp01(box.y + box.h + py);
  return { x: round3(x0), y: round3(y0), w: round3(x1 - x0), h: round3(y1 - y0) };
}

/**
 * Map a point returned in crop-relative fractions (0..1 within the crop) back
 * to full-image fractions. Rounded to 3 decimals to match placeFinding.
 */
export function mapCropPointToFull(
  pt: DebugPoint,
  region: CropRegion,
): DebugPoint {
  return {
    x: round3(region.x + pt.x * region.w),
    y: round3(region.y + pt.y * region.h),
  };
}


/**
 * A short, concrete placement concern from a finding's formal title — the kind
 * of anchor the placement prompt is built for. Spot places composed titles like
 * "Raised shower curb"; the analyzer's raw title is the long ADA-framed form
 * ("Shower Threshold — Raised Curb Blocks Roll-In Entry"). The object sits
 * before the em-dash, so take that: "Shower Threshold", "Shower Seat",
 * "Lavatory". Falls back to the whole title when there's no dash.
 */
export function shortConcern(title: string): string {
  const cut = title.split(/\s[—–-]\s/)[0]?.trim();
  return cut && cut.length > 0 ? cut : title.trim();
}

/**
 * Center of a bounding box, rounded to 3 decimals to match placeFinding. Returns
 * null for a missing box so the caller can render the rectangle-less case.
 */
export function boxCenterOf(box: PhotoBoundingBox | null | undefined): DebugPoint | null {
  if (!box) return null;
  return { x: round3(box.x + box.w / 2), y: round3(box.y + box.h / 2) };
}
