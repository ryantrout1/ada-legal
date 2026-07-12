/**
 * Ada Spot — kill switch.
 *
 * `spot_enabled` lives in the shared 'admin' system-settings blob (same row
 * as the ada flags, toggled by a Neon upsert with no redeploy) but is read
 * by its OWN resolver here — Ada Spot's availability is independent of
 * ada_chat_enabled / ada_photo_enabled, and this module never imports or
 * modifies adaAvailability.ts (firewall).
 *
 * Defaults OFF: Ada Spot is a public, budgeted Opus vision endpoint, so the
 * fail-safe launch posture is dark-by-default. Only a boolean literal `true`
 * enables it — a stray string/number/null falls back to OFF.
 */

import type { AdaClients } from '../../engine/clients/types.js';

/** System-settings key namespace (shared with the ada flags). */
export const SPOT_SETTINGS_KEY = 'admin';
export const SPOT_ENABLED_KEY = 'spot_enabled';
export const SPOT_ENABLED_DEFAULT = false;

/** Pure: resolve the raw 'admin' blob into the spot_enabled boolean. */
export function resolveSpotEnabled(stored: unknown): boolean {
  if (stored && typeof stored === 'object' && SPOT_ENABLED_KEY in stored) {
    const value = (stored as Record<string, unknown>)[SPOT_ENABLED_KEY];
    if (typeof value === 'boolean') return value;
  }
  return SPOT_ENABLED_DEFAULT;
}

/** Read + resolve spot_enabled from the DB. A read failure surfaces as the handler's 500. */
export async function readSpotEnabled(db: AdaClients['db']): Promise<boolean> {
  const stored = await db.getSystemSetting<Record<string, unknown>>(SPOT_SETTINGS_KEY);
  return resolveSpotEnabled(stored);
}
