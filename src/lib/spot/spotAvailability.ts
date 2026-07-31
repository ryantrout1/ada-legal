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

/**
 * Test-only: when `spot_test_payment` is true in the admin blob, the
 * /api/spot/simulate-payment endpoint may bypass Stripe and generate a report
 * directly (for previewing the paid report without a live payment). Defaults
 * OFF; flip via a Neon upsert and flip back when done. Never leave it on in a
 * real launch.
 */
export const SPOT_TEST_PAYMENT_KEY = 'spot_test_payment';

export function resolveSpotTestPayment(stored: unknown): boolean {
  if (stored && typeof stored === 'object' && SPOT_TEST_PAYMENT_KEY in stored) {
    const value = (stored as Record<string, unknown>)[SPOT_TEST_PAYMENT_KEY];
    if (typeof value === 'boolean') return value;
  }
  return false;
}

export async function readSpotTestPayment(db: AdaClients['db']): Promise<boolean> {
  const stored = await db.getSystemSetting<Record<string, unknown>>(SPOT_SETTINGS_KEY);
  return resolveSpotTestPayment(stored);
}

/**
 * When `spot_retain_free_photos` is true in the admin blob, a completed free
 * read stores its uploaded photo (Blob + a read-parented spot_photo row,
 * swept after 90 days like paid photos) so it can be used to improve the
 * analyzer.
 *
 * Defaults OFF, and deliberately so: retaining an anonymous free user's photo
 * is a privacy representation, and this flag stays dark until the user-facing
 * disclosure copy is live. Flipping it on before that would store photos we
 * have not told anyone we keep. Flip via a Neon upsert once the copy ships.
 */
export const SPOT_RETAIN_FREE_PHOTOS_KEY = 'spot_retain_free_photos';

export function resolveSpotRetainFreePhotos(stored: unknown): boolean {
  if (stored && typeof stored === 'object' && SPOT_RETAIN_FREE_PHOTOS_KEY in stored) {
    const value = (stored as Record<string, unknown>)[SPOT_RETAIN_FREE_PHOTOS_KEY];
    if (typeof value === 'boolean') return value;
  }
  return false;
}

export async function readSpotRetainFreePhotos(db: AdaClients['db']): Promise<boolean> {
  const stored = await db.getSystemSetting<Record<string, unknown>>(SPOT_SETTINGS_KEY);
  return resolveSpotRetainFreePhotos(stored);
}
