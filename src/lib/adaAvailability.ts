/**
 * Ada availability — the kill-switch gate for the public LLM surfaces.
 *
 * Two independent, admin-controlled flags live inside the existing
 * 'admin' system-settings blob (same row as data_collection_enabled):
 *
 *   - ada_chat_enabled  — the live claimant chat (POST /api/ada/session).
 *     Defaults ENABLED. Real anonymous traffic flows to this today, so a
 *     missing or malformed settings row must NEVER accidentally take chat
 *     dark; only an explicit boolean `false` disables it. This is the one
 *     switch that stops session creation platform-wide (an incident /
 *     runaway-cost lever) without a redeploy.
 *
 *   - ada_photo_enabled — the structured Opus photo analyzer path
 *     (/photo → /api/ada/analyze-photo + /api/ada/upload-photo).
 *     Defaults DISABLED. /photo is a field-test tool, not a launch
 *     surface: it hands an unauthenticated caller an Opus vision call
 *     with a per-press budget. Keeping it dark-by-default is the
 *     fail-safe posture for launch ("take /photo dark") — an admin
 *     explicitly sets `true` to run a field-test session, then can flip
 *     it back off.
 *
 * Strictness: only a boolean literal is honored. Strings ("false"),
 * numbers (0/1), null, or a missing key all fall back to the per-flag
 * default. This prevents a stray non-boolean value from either killing
 * live chat or silently opening the expensive photo path.
 *
 * Ref: /plan Phase 2 (§2 a6 kill switch + a7 take /photo dark).
 */

import type { AdaClients } from '../engine/clients/types.js';

/** System-settings key namespace shared with api/admin/settings.ts. */
export const ADA_SETTINGS_KEY = 'admin';

export const ADA_CHAT_ENABLED_KEY = 'ada_chat_enabled';
export const ADA_PHOTO_ENABLED_KEY = 'ada_photo_enabled';

export interface AdaAvailability {
  /** POST /api/ada/session may create sessions. */
  chatEnabled: boolean;
  /** The Opus photo analyzer endpoints may run. */
  photoEnabled: boolean;
}

/**
 * Per-flag defaults. Chat on (live product), photo off (dark for launch).
 * Also drives api/admin/settings.ts's GET defaults so the admin UI and
 * the enforcement path can never disagree about the baseline.
 */
export const ADA_AVAILABILITY_DEFAULTS: AdaAvailability = {
  chatEnabled: true,
  photoEnabled: false,
};

/**
 * Resolve the raw 'admin' settings blob into availability flags. Pure:
 * no IO, fully unit-testable. Only a boolean literal overrides a default.
 */
export function resolveAdaAvailability(stored: unknown): AdaAvailability {
  return {
    chatEnabled: readBooleanFlag(
      stored,
      ADA_CHAT_ENABLED_KEY,
      ADA_AVAILABILITY_DEFAULTS.chatEnabled,
    ),
    photoEnabled: readBooleanFlag(
      stored,
      ADA_PHOTO_ENABLED_KEY,
      ADA_AVAILABILITY_DEFAULTS.photoEnabled,
    ),
  };
}

function readBooleanFlag(stored: unknown, key: string, fallback: boolean): boolean {
  if (stored && typeof stored === 'object' && key in stored) {
    const value = (stored as Record<string, unknown>)[key];
    if (typeof value === 'boolean') return value;
  }
  return fallback;
}

/**
 * Read + resolve availability from the DB in one call. Thin wrapper over
 * getSystemSetting so handlers don't each re-implement the read. If the
 * setting read throws, that surfaces as the handler's own 500 (a DB
 * failure is not a reason to silently disable or enable a surface).
 */
export async function readAdaAvailability(
  db: AdaClients['db'],
): Promise<AdaAvailability> {
  const stored = await db.getSystemSetting<Record<string, unknown>>(ADA_SETTINGS_KEY);
  return resolveAdaAvailability(stored);
}
