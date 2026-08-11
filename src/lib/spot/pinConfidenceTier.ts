/**
 * Ada Spot — precise vs approximate marker.
 *
 * Composed-item pins carry a placement confidence: a sure placement draws a
 * precise dot, a less-sure one draws an approximate marker and says
 * "(approximate)" in the caption. Pins below buildItemAnnotations' 0.5 floor
 * never reach here, so this only ever splits the 0.5–1.0 range.
 *
 * Box-derived pins are a special case: the analyzer's box y proved
 * systematically low (see the source==='box' branch), so they always render
 * approximate rather than trusting a location the box does not have. Pure.
 * Ref: /plan phase 2; /triage "all pins low".
 */

import type { PinSource } from './annotationTypes.js';

/** At or above this placement confidence, a pin is drawn precise. */
export const PIN_PRECISE_MIN = 0.75;

export type PinConfidenceTier = 'precise' | 'approximate';

export function pinConfidenceTier(
  confidence: number,
  opts: { preciseMin?: number; source?: PinSource } = {},
): PinConfidenceTier {
  // A box does NOT reliably localize: measured across a bathroom analysis, the
  // analyzer's box y ran systematically low — ~0.15 at the curb, growing toward
  // the bottom of the frame — and every model-based placement method reproduced
  // it. So a box-derived pin cannot claim a precise spot, regardless of the
  // FINDING confidence (which is about whether the concern is real, not where).
  // It renders as the honest "around here" halo. Ref: /triage "all pins low".
  if (opts.source === 'box') return 'approximate';
  const min = opts.preciseMin ?? PIN_PRECISE_MIN;
  return confidence >= min ? 'precise' : 'approximate';
}
