/**
 * Ada Spot — free-tier rate-limit identity.
 *
 * Derives an opaque, stable key from the requester's IP + a *coarsened*
 * user-agent, so the free-read throttle can count reads per rough device
 * without storing raw PII (the raw IP never appears in the key) and without
 * being trivially reset by a browser auto-updating its patch version.
 *
 * Coarsening strips version-number runs (e.g. "Chrome/120.0.6099.2" and
 * "Chrome/120.0.0.1" both reduce to "chrome/"), so minor UA churn collapses
 * to one identity while distinct browser families stay distinct.
 *
 * v1 deliberately uses no accounts / captcha / fingerprinting — this is a
 * soft throttle, not an auth boundary.
 *
 * Pure + deterministic. Server-side only (Node runtime).
 */

import { createHash } from 'node:crypto';

/** Collapse version numbers and whitespace so patch-version churn maps to one identity. */
function coarsenUserAgent(userAgent: string): string {
  return (userAgent || '')
    .toLowerCase()
    .replace(/\d+(?:\.\d+)*/g, '') // drop version-number runs
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Stable, opaque rate-limit key for (ip, userAgent).
 * Same inputs → same key; different IP → different key; minor UA version
 * noise → same key. Returns a hex SHA-256 digest (no raw IP embedded).
 */
export function deriveRateLimitKey(ip: string, userAgent: string): string {
  const material = `${ip}|${coarsenUserAgent(userAgent)}`;
  return createHash('sha256').update(material).digest('hex');
}
