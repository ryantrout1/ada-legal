/**
 * Ada Spot — find a curb's real edge in the pixels.
 *
 * The analyzer tells us roughly where a raised threshold is, but its box
 * drifts about 6% of the frame between runs on the same photo, which is the
 * difference between a marker on the curb and a marker on the floor tile. The
 * image does not drift. So use the box only as a place to look, and find the
 * edge itself.
 *
 * Why this works on the case that kept failing: a shower curb is dark, and the
 * floor below it is dark too — but the shower pan ABOVE it is light. The curb's
 * top edge is therefore the largest brightness change anywhere nearby, and the
 * top edge is exactly the step line we want to mark. Measured on a generated
 * version of that scene, with grout lines as decoys and noise on everything,
 * the real edge beat the nearest decoy by about five times.
 *
 * Refuses rather than guesses. If nothing clearly dominates — a flat wall, two
 * equally strong transitions, an unreadable file — it returns null and the
 * caller keeps whatever position it already had. A confident marker in the
 * wrong place is worse than an imprecise one.
 *
 * Server-only: imports sharp. Never import this from client code.
 */

import sharp from 'sharp';
import type { PhotoBoundingBox } from '../../types/db.js';

/**
 * How far outside the box to look, as a fraction of the image. The box drifts,
 * so the curb can sit just outside it; without this padding a low box would
 * search the floor and find nothing but grout.
 */
const SEARCH_PAD = 0.08;

/**
 * How much the winning edge must beat the runner-up to be trusted. Below this
 * the scene is ambiguous and we decline. Measured margin on the real scene
 * shape was ~5x, so 2x accepts the genuine case with room to spare while still
 * rejecting a coin flip between two similar transitions.
 */
const DOMINANCE_MIN = 2;

/** Rows within this distance of the winner are the same edge, not a rival. */
const PEAK_NEIGHBOURHOOD = 3;

/** An edge weaker than this is texture, not a boundary. */
const MIN_EDGE_STRENGTH = 8;

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

/**
 * The normalized y of the strongest horizontal brightness edge inside (and
 * just around) the box, or null when nothing dominates.
 */
export async function snapToHorizontalEdge(
  imageBuffer: Buffer,
  box: PhotoBoundingBox,
): Promise<number | null> {
  try {
    const meta = await sharp(imageBuffer).metadata();
    if (!meta.width || !meta.height) return null;

    // Look a little above and below the box, because the box itself drifts.
    const top = clamp01(box.y - SEARCH_PAD);
    const bottom = clamp01(box.y + box.h + SEARCH_PAD);
    const left = clamp01(box.x);
    const right = clamp01(box.x + box.w);
    if (bottom - top <= 0 || right - left <= 0) return null;

    const px = {
      left: Math.round(left * meta.width),
      top: Math.round(top * meta.height),
      width: Math.max(1, Math.round((right - left) * meta.width)),
      height: Math.max(2, Math.round((bottom - top) * meta.height)),
    };
    // Clamp so extract can never run off the image.
    px.width = Math.min(px.width, meta.width - px.left);
    px.height = Math.min(px.height, meta.height - px.top);
    if (px.width < 1 || px.height < 2) return null;

    const { data, info } = await sharp(imageBuffer)
      .extract(px)
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Average brightness per row. Averaging across the strip's width is what
    // makes a long horizontal boundary stand out from local texture: a grout
    // line contributes to one row too, but with far less contrast.
    const rowMean = new Array<number>(info.height);
    for (let y = 0; y < info.height; y++) {
      let sum = 0;
      const rowStart = y * info.width;
      for (let x = 0; x < info.width; x++) sum += data[rowStart + x];
      rowMean[y] = sum / info.width;
    }

    // Row-to-row change. The largest is the boundary.
    let bestRow = -1;
    let bestStrength = 0;
    for (let y = 1; y < info.height; y++) {
      const d = Math.abs(rowMean[y] - rowMean[y - 1]);
      if (d > bestStrength) {
        bestStrength = d;
        bestRow = y;
      }
    }
    if (bestRow < 0 || bestStrength < MIN_EDGE_STRENGTH) return null;

    // The runner-up, ignoring rows belonging to the same edge. If a second,
    // unrelated boundary is nearly as strong, the scene is ambiguous.
    let runnerUp = 0;
    for (let y = 1; y < info.height; y++) {
      if (Math.abs(y - bestRow) <= PEAK_NEIGHBOURHOOD) continue;
      const d = Math.abs(rowMean[y] - rowMean[y - 1]);
      if (d > runnerUp) runnerUp = d;
    }
    if (runnerUp > 0 && bestStrength / runnerUp < DOMINANCE_MIN) return null;

    // Map the row back to the whole image.
    const edgeY = (px.top + bestRow) / meta.height;
    return Math.round(edgeY * 1000) / 1000;
  } catch {
    // An unreadable or unfetchable image must never break report generation.
    return null;
  }
}
