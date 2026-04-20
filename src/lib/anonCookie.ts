/**
 * Anonymous session cookie helpers.
 *
 * The anon session pattern (per brief §4):
 *   - Every public user is identified by an httpOnly cookie `ada_anon`
 *   - Cookie value is a raw random token (256 bits, base64url)
 *   - DB stores only the SHA-256 hash of the token, never the raw value
 *   - Cookie domain at cutover: .adalegallink.com (spans all subdomains)
 *   - During build: scoped to whatever host is serving
 *   - 30-day rolling TTL; refreshed on every request
 *
 * This module is pure and works in both Node (server) and browsers that
 * have the Web Crypto API. Used by middleware.ts to mint cookies and by
 * API routes to resolve a cookie back to an anon_session row.
 *
 * Ref: docs/ARCHITECTURE.md §4, docs/DO_NOT_TOUCH.md rule 4
 */

export const ANON_COOKIE_NAME = 'ada_anon';
export const ANON_COOKIE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * SHA-256 hash of the raw cookie token. Returns hex-encoded string.
 *
 * DB-side invariant: we store this hash in anon_sessions.token_hash and
 * NEVER store the raw token. See docs/DO_NOT_TOUCH.md rule 4.
 */
export async function hashAnonToken(rawToken: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(rawToken);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a fresh random token. 256 bits, base64url-encoded.
 * Use node crypto on the server, Web Crypto in the browser.
 */
export function mintAnonToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

function base64url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Build a Set-Cookie header value for the anon cookie.
 *
 * Host-aware scoping: during build (vercel.app preview) we skip the Domain
 * attribute entirely so the cookie scopes to the exact host. At cutover,
 * the caller will pass domain: '.adalegallink.com' and the cookie spans
 * all subdomains per brief §4.
 */
export interface BuildCookieOptions {
  token: string;
  secure: boolean;
  domain?: string;
  maxAgeSeconds?: number;
}

export function buildAnonCookieHeader(opts: BuildCookieOptions): string {
  const parts = [
    `${ANON_COOKIE_NAME}=${opts.token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${opts.maxAgeSeconds ?? ANON_COOKIE_TTL_SECONDS}`,
  ];
  if (opts.secure) parts.push('Secure');
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  return parts.join('; ');
}

/** Parse a Cookie header, return the anon token if present. */
export function parseAnonCookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split('=');
    if (name === ANON_COOKIE_NAME) {
      return rest.join('=') || null;
    }
  }
  return null;
}
