/**
 * Ada Spot — paid-tier upload gate (pure).
 *
 * The server decides whether an upload token may be minted: only for a session
 * that is actually `paid` (never trusted from the client) and only up to the
 * 10-photo cap. Extracted so the rule is unit-tested, then applied inside the
 * blob token endpoint's onBeforeGenerateToken.
 */

import type { SpotSessionStatus } from './spotSessionStatus.js';

export const MAX_PAID_PHOTOS = 10;

export type UploadGate = { ok: true } | { ok: false; reason: 'not_paid' | 'limit_reached' };

export function canAcceptSpotUpload(
  status: SpotSessionStatus | undefined,
  currentCount: number,
): UploadGate {
  if (status !== 'paid') return { ok: false, reason: 'not_paid' };
  if (currentCount >= MAX_PAID_PHOTOS) return { ok: false, reason: 'limit_reached' };
  return { ok: true };
}
