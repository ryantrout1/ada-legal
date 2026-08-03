/**
 * Ada Spot — vertical offsets for markers that land close together.
 *
 * Two findings that sit near the same point on a photo (a step and its landing,
 * say) would draw their pills on top of each other. This returns a downward
 * pixel offset per marker: the first in a cluster stays put, each later one that
 * lands within `threshold` (normalized image distance) of an earlier marker is
 * pushed down by another `step`, so the pills stack instead of colliding.
 *
 * Pure and deterministic; the render applies the offset as a translateY.
 */

export function assignMarkerOffsets(
  points: readonly { x: number; y: number }[],
  opts: { threshold?: number; step?: number } = {},
): number[] {
  const threshold = opts.threshold ?? 0.06;
  const step = opts.step ?? 28;
  return points.map((p, i) => {
    let priorClose = 0;
    for (let j = 0; j < i; j++) {
      if (Math.hypot(p.x - points[j].x, p.y - points[j].y) < threshold) priorClose += 1;
    }
    return priorClose * step;
  });
}
