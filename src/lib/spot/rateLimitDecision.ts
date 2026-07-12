/**
 * Ada Spot — free-tier rate-limit decision.
 *
 * Given how many free reads an identity has already done in the trailing
 * window, decide the tier for the next one:
 *
 *   allowed    — a full free read.
 *   soft_gated — still a full read, but the UI prompts for an email
 *                (lead capture); does NOT block the result.
 *   blocked    — no model call; show the paid CTA only.
 *
 * Thresholds are tunable consts. "~2–3 free reads then a soft email gate
 * then a hard CTA" (scoping §Rate-limit). Pure + deterministic; the count
 * is produced server-side (spotStore), never trusted from the client.
 */

/** Number of fully-free reads before the soft email gate. */
export const FREE_ALLOWED_READS = 2;
/** The read index (1-based) at which the soft email gate applies. */
export const SOFT_GATE_READS = 3;

export type SpotTier = 'allowed' | 'soft_gated' | 'blocked';

/** Decide the tier for the NEXT read given `priorReads` already done in-window. */
export function rateLimitDecision(priorReads: number): SpotTier {
  if (priorReads < FREE_ALLOWED_READS) return 'allowed';
  if (priorReads < SOFT_GATE_READS) return 'soft_gated';
  return 'blocked';
}
