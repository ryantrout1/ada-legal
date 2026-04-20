/**
 * Org resolution.
 *
 * Pure function. Given a request's host + path, returns the org_code that
 * request belongs to (or null if it should 404). Stateless, deterministic,
 * no DB lookups — the DB lookup happens after this function decides which
 * org_code to query for.
 *
 * Routing rules (per brief §4):
 *   adalegallink.com                  → 'adall' (default org, Ch0 + Ch1)
 *   adalegallink.com/class-actions    → 'adall' (Ch1 directory)
 *   adalegallink.com/admin            → 'adall' (Ch0 admin)
 *   gov.adalegallink.com/[org-code]   → org-code from path (Ch2+)
 *   gov.adalegallink.com (root)       → null (404 — no default on gov)
 *
 * During Ch0/Ch1 build, the preview domain is a vercel.app subdomain, so
 * we treat any non-gov.* host as "default org". At cutover this naturally
 * resolves to 'adall' because that's the only org that exists.
 *
 * Ref: docs/ARCHITECTURE.md §4
 */

export interface OrgResolution {
  orgCode: string | null;
  /** True if this request should get a 404 (gov subdomain with no org path). */
  notFound: boolean;
}

export function resolveOrg(host: string, path: string): OrgResolution {
  const normalizedHost = host.toLowerCase().trim();

  // gov subdomain: org-code comes from first path segment
  if (normalizedHost.startsWith('gov.')) {
    const firstSegment = extractFirstPathSegment(path);
    if (!firstSegment) {
      return { orgCode: null, notFound: true };
    }
    return { orgCode: firstSegment, notFound: false };
  }

  // All other hosts (adalegallink.com, preview URLs, localhost) → default org
  return { orgCode: 'adall', notFound: false };
}

function extractFirstPathSegment(path: string): string | null {
  const trimmed = path.replace(/^\/+/, '').replace(/\?.*$/, '').replace(/#.*$/, '');
  if (!trimmed) return null;
  const first = trimmed.split('/')[0];
  if (!first) return null;
  // Reserve certain paths for non-org use
  if (['api', 'admin', '_next', 'assets', 'favicon.ico'].includes(first)) {
    return null;
  }
  return first;
}
