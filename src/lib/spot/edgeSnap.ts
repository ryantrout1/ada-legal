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
 * The strip is read in vertical slices rather than as whole rows.
 *
 * A curb photographed from a doorway slopes: lower on one side, higher on the
 * other. Averaging a whole row mixes the light side of the boundary with the
 * dark side, so a sloped edge smears across many rows and its peak flattens
 * below any sensible threshold — which is precisely what made the detector
 * decline on the real photo while every horizontal test image passed. Each
 * slice is narrow enough that the edge is near-flat within it.
 */
const SLICE_COUNT = 12;

/** An edge weaker than this, within a slice, is texture rather than a boundary. */
const MIN_EDGE_STRENGTH = 8;

/** At least this many slices must find an edge for the result to be trusted. */
const MIN_SLICES_AGREEING = 6;

/**
 * Within a slice, how far the winning transition must beat the runner-up.
 *
 * Without this the detector will happily pick one of two equally strong
 * parallel boundaries and report it with full confidence — a coin flip
 * presented as an answer. On the real scene the curb's top edge beat its
 * nearest rival about five times over, so 2x admits the genuine case easily
 * while still refusing a tie.
 */
const SLICE_DOMINANCE_MIN = 2;

/** Rows this close to the winner belong to the same edge, not to a rival. */
const PEAK_NEIGHBOURHOOD = 3;

/**
 * How far a slice's edge may sit from the fitted line, as a fraction of the
 * searched strip, before the slices count as disagreeing. A real boundary is
 * straight enough to fit; scattered peaks mean there is no single edge, and
 * guessing at one would put a confident marker in the wrong place.
 */
const MAX_FIT_ERROR = 0.12;

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

    // Find the boundary independently in each vertical slice, then fit a line
    // through those points. A straight boundary — sloped or not — fits well; a
    // scatter of unrelated texture does not, and that is the signal to decline.
    const sliceWidth = Math.max(1, Math.floor(info.width / SLICE_COUNT));
    const points: { x: number; row: number }[] = [];

    for (let s = 0; s < SLICE_COUNT; s++) {
      const xStart = s * sliceWidth;
      const xEnd = s === SLICE_COUNT - 1 ? info.width : Math.min(info.width, xStart + sliceWidth);
      if (xEnd - xStart < 1) continue;

      const rowMean = new Array<number>(info.height);
      for (let y = 0; y < info.height; y++) {
        let sum = 0;
        const rowStart = y * info.width;
        for (let x = xStart; x < xEnd; x++) sum += data[rowStart + x];
        rowMean[y] = sum / (xEnd - xStart);
      }

      let bestRow = -1;
      let bestStrength = 0;
      for (let y = 1; y < info.height; y++) {
        const d = Math.abs(rowMean[y] - rowMean[y - 1]);
        if (d > bestStrength) {
          bestStrength = d;
          bestRow = y;
        }
      }
      if (bestRow < 0 || bestStrength < MIN_EDGE_STRENGTH) continue;

      // Runner-up, ignoring rows belonging to the same boundary.
      let runnerUp = 0;
      for (let y = 1; y < info.height; y++) {
        if (Math.abs(y - bestRow) <= PEAK_NEIGHBOURHOOD) continue;
        const d = Math.abs(rowMean[y] - rowMean[y - 1]);
        if (d > runnerUp) runnerUp = d;
      }
      if (runnerUp > 0 && bestStrength / runnerUp < SLICE_DOMINANCE_MIN) continue;

      points.push({ x: (xStart + xEnd) / 2, row: bestRow });
    }

    if (points.length < MIN_SLICES_AGREEING) return null;

    // Least-squares line through the slice edges: row = intercept + slope * x.
    const n = points.length;
    const meanX = points.reduce((a, p) => a + p.x, 0) / n;
    const meanRow = points.reduce((a, p) => a + p.row, 0) / n;
    let num = 0;
    let den = 0;
    for (const p of points) {
      num += (p.x - meanX) * (p.row - meanRow);
      den += (p.x - meanX) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = meanRow - slope * meanX;
    const rowAt = (x: number): number => intercept + slope * x;

    // Median distance from the line. Median, not mean, so one stray slice
    // catching a grout line cannot veto an otherwise clean edge.
    const residuals = points.map((p) => Math.abs(p.row - rowAt(p.x))).sort((a, b) => a - b);
    const medianResidual = residuals[Math.floor(residuals.length / 2)];
    if (medianResidual / info.height > MAX_FIT_ERROR) return null;

    // Report the boundary's height at the middle of the strip.
    const bestRow = rowAt(info.width / 2);
    if (bestRow < 0 || bestRow > info.height) return null;

    // Map the row back to the whole image.
    const edgeY = (px.top + bestRow) / meta.height;
    return Math.round(edgeY * 1000) / 1000;
  } catch {
    // An unreadable or unfetchable image must never break report generation.
    return null;
  }
}
