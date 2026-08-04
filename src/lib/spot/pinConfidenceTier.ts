/**
 * Ada Spot — precise vs approximate marker, by placement confidence.
 *
 * Composed-item pins carry a placement confidence but no box, so the honesty
 * guardrail re-anchors on that confidence: a sure placement draws a precise
 * dot, a less-sure one draws an approximate marker and says "(approximate)" in
 * the caption. Pins below buildItemAnnotations' 0.5 floor never reach here, so
 * this only ever splits the 0.5–1.0 range. Pure. Ref: /plan phase 2.
 */

/** At or above this placement confidence, a pin is drawn precise. */
export const PIN_PRECISE_MIN = 0.75;

export type PinConfidenceTier = 'precise' | 'approximate';

export function pinConfidenceTier(
  confidence: number,
  opts: { preciseMin?: number } = {},
): PinConfidenceTier {
  const min = opts.preciseMin ?? PIN_PRECISE_MIN;
  return confidence >= min ? 'precise' : 'approximate';
}
