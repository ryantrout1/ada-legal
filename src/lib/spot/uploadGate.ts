/**
 * Ada Spot — paid-tier upload gate (pure).
 *
 * The server decides whether an upload token may be minted: only for a session
 * that is actually `paid` (never trusted from the client) and only up to the
 * photo cap. Extracted so the rule is unit-tested, then applied inside the
 * blob token endpoint's onBeforeGenerateToken.
 *
 * MAX_PAID_PHOTOS is the ONE definition. SpotUpload used to redeclare its own
 * its own MAX_PHOTOS for the label and the remaining-count maths — two
 * constants that happened to agree, so the copy could promise a number the
 * server would refuse. The client imports this now.
 */

import type { SpotSessionStatus } from './spotSessionStatus.js';

export const MAX_PAID_PHOTOS = 5;

export type UploadGate = { ok: true } | { ok: false; reason: 'not_paid' | 'limit_reached' };

export function canAcceptSpotUpload(
  status: SpotSessionStatus | undefined,
  currentCount: number,
): UploadGate {
  if (status !== 'paid') return { ok: false, reason: 'not_paid' };
  if (currentCount >= MAX_PAID_PHOTOS) return { ok: false, reason: 'limit_reached' };
  return { ok: true };
}
