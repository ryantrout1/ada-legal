/**
 * `civil_rights_enabled`: is the public state civil rights complaint page
 * (/civil-rights/:state) open to the public?
 *
 * Lives in the shared 'admin' system-settings blob, read by its own
 * resolver so no other flag can switch it on. Defaults OFF; only a boolean
 * literal `true` enables it. It stays off until Gina approves the copy,
 * the retention period and the privacy section. While off, the page shows
 * an honest "coming soon"; admins can still preview the full flow at
 * /admin/civil-rights/preview/<state>.
 *
 * READ-ONLY on the shared blob (see lawsuitsAdaCta.ts for why).
 */

import type { AdaClients } from '../../engine/clients/types.js';

export const CIVIL_RIGHTS_SETTINGS_KEY = 'admin';
export const CIVIL_RIGHTS_ENABLED_KEY = 'civil_rights_enabled';
export const CIVIL_RIGHTS_ENABLED_DEFAULT = false;

export function resolveCivilRightsEnabled(stored: unknown): boolean {
  if (stored && typeof stored === 'object' && CIVIL_RIGHTS_ENABLED_KEY in stored) {
    const value = (stored as Record<string, unknown>)[CIVIL_RIGHTS_ENABLED_KEY];
    if (typeof value === 'boolean') return value;
  }
  return CIVIL_RIGHTS_ENABLED_DEFAULT;
}

export async function readCivilRightsEnabled(db: AdaClients['db']): Promise<boolean> {
  const stored = await db.getSystemSetting<Record<string, unknown>>(CIVIL_RIGHTS_SETTINGS_KEY);
  return resolveCivilRightsEnabled(stored);
}
