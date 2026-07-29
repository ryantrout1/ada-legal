/**
 * Where this site actually lives.
 *
 * Every link that leaves the building — in an email, in a canonical tag,
 * in a readout — has to name the public address, not whichever host
 * happened to serve the request that built it.
 *
 * WHY THIS EXISTS. Eleven files hardcoded `https://ada.adalegallink.com`,
 * which was correct while that host was the whole product and the apex
 * belonged to Base44. It stops being correct the moment the apex is ours.
 * The worst of the eleven were four canonical tags: served from the apex
 * they would have told search engines the real version of each page lives
 * at ada.adalegallink.com — a host whose robots.txt is `Disallow: /`.
 * Pointing crawlers at a URL they are forbidden to fetch is worse than
 * having no canonical tag at all, and the pages it would have hit hardest
 * are the standards guide, which is the reason anyone finds this site.
 *
 * NOT THE SAME AS THE REQUEST HOST. Stripe checkout builds its return
 * URLs from `req.headers.host`, which is right for it — a person should
 * come back to the host they left from. This constant is for the opposite
 * case: a link that outlives the request, read days later by someone who
 * was never on the site.
 *
 * NOT THE SAME AS ENGINE_HOST EITHER. api/robots.ts still names
 * ada.adalegallink.com, deliberately: that constant marks the host that
 * must never be indexed, and it stays pointing there for as long as the
 * host answers.
 *
 * Override with PUBLIC_ORIGIN for a preview environment that needs its
 * own links. Left unset everywhere real.
 */

const FALLBACK = 'https://adalegallink.com';

function readOverride(): string | undefined {
  // Vite replaces import.meta.env at build time for client code; Node
  // gives process.env on the server. Neither exists in both places, so
  // both are checked and neither is assumed.
  try {
    const fromVite = (import.meta as { env?: Record<string, string | undefined> }).env
      ?.VITE_PUBLIC_ORIGIN;
    if (fromVite) return fromVite;
  } catch {
    /* not a Vite context */
  }
  if (typeof process !== 'undefined' && process.env?.PUBLIC_ORIGIN) {
    return process.env.PUBLIC_ORIGIN;
  }
  return undefined;
}

/** No trailing slash, so `${PUBLIC_ORIGIN}/spot` never doubles up. */
export const PUBLIC_ORIGIN: string = (readOverride() ?? FALLBACK).replace(/\/+$/, '');

/** `publicUrl('/s/abc')` → `https://adalegallink.com/s/abc`. */
export function publicUrl(path: string): string {
  return `${PUBLIC_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}
