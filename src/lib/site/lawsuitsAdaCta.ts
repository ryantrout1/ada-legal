/**
 * Public lawsuit pages — "Talk to Ada about this case" CTA gate.
 *
 * `lawsuits_ada_cta_enabled` lives in the shared 'admin' system-settings
 * blob (same row as the spot / ada / guide flags) but is read by its OWN
 * resolver here, so no other flag can switch this CTA on as a side
 * effect. Migrated from Base44's SiteConfig entity at M0; both it and
 * `ada_universal_cta` are false today.
 *
 * Defaults OFF and only a boolean literal `true` enables it — same
 * fail-safe posture as Spot and the guide assistant, for a different
 * reason: this CTA hands a claimant into an intake conversation, so it
 * must never appear because a read failed or someone stored the string
 * "true". Flip it with a Neon upsert once Gina has reviewed the copy; no
 * redeploy needed.
 *
 * READ-ONLY on the shared blob. The 'admin' key holds a single jsonb
 * document for every flag, so any writer must read the full blob first
 * or it clobbers its siblings — nothing here writes.
 *
 * Ref: /plan M3 Phase 1.
 */

import type { AdaClients } from '../../engine/clients/types.js';

/** System-settings key namespace (shared with the ada / spot / guide flags). */
export const LAWSUITS_ADA_CTA_SETTINGS_KEY = 'admin';
export const LAWSUITS_ADA_CTA_KEY = 'lawsuits_ada_cta_enabled';
export const LAWSUITS_ADA_CTA_DEFAULT = false;

/** Pure: resolve the raw 'admin' blob into the CTA boolean. */
export function resolveLawsuitsAdaCta(stored: unknown): boolean {
  if (stored && typeof stored === 'object' && LAWSUITS_ADA_CTA_KEY in stored) {
    const value = (stored as Record<string, unknown>)[LAWSUITS_ADA_CTA_KEY];
    if (typeof value === 'boolean') return value;
  }
  return LAWSUITS_ADA_CTA_DEFAULT;
}

/**
 * Read + resolve the flag from the DB.
 *
 * Read failures propagate — the caller decides the posture. The public
 * endpoint catches and serves `false`, because a CTA that appears when
 * the database is unreachable is the outcome this gate exists to
 * prevent.
 */
export async function readLawsuitsAdaCta(db: AdaClients['db']): Promise<boolean> {
  const stored = await db.getSystemSetting<Record<string, unknown>>(
    LAWSUITS_ADA_CTA_SETTINGS_KEY,
  );
  return resolveLawsuitsAdaCta(stored);
}

// ─── ada_universal_cta (M5) ──────────────────────────────────────────────────

/**
 * `ada_universal_cta` — retarget site CTAs to Ada rather than the Pathway
 * pages. Migrated from Base44's SiteConfig at M0; false today.
 *
 * Same shape and same fail-closed posture as the lawsuits flag, read from
 * the same shared `admin` blob by its own resolver so neither flag can
 * switch the other on.
 */
export const ADA_UNIVERSAL_CTA_KEY = 'ada_universal_cta';
export const ADA_UNIVERSAL_CTA_DEFAULT = false;

export function resolveAdaUniversalCta(stored: unknown): boolean {
  if (stored && typeof stored === 'object' && ADA_UNIVERSAL_CTA_KEY in stored) {
    const value = (stored as Record<string, unknown>)[ADA_UNIVERSAL_CTA_KEY];
    if (typeof value === 'boolean') return value;
  }
  return ADA_UNIVERSAL_CTA_DEFAULT;
}

export async function readAdaUniversalCta(db: AdaClients['db']): Promise<boolean> {
  const stored = await db.getSystemSetting<Record<string, unknown>>(
    LAWSUITS_ADA_CTA_SETTINGS_KEY,
  );
  return resolveAdaUniversalCta(stored);
}
