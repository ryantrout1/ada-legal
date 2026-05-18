/**
 * CORS helper for cross-origin API access.
 *
 * Applied to /api/public/* and /api/admin/* handlers to allow:
 *   - https://adalegallink.com (Base44 production — admin + public Active Cases)
 *   - https://ada.adalegallink.com (current Vercel SPA — until cutover)
 *   - https://preview--ada-claim-legal.base44.app (B44 preview environment
 *     for the production app, used for editor-side testing before Publish)
 *   - http://localhost:5173 (Vite dev server)
 *   - http://localhost:3000 (Vercel dev server)
 *
 * Echo-allowlist pattern: we read the incoming Origin header, check it
 * against the allowlist, and echo it back in Access-Control-Allow-Origin.
 * This is more restrictive than '*' and required when Allow-Credentials
 * is in play (browsers reject Allow-Origin: * with credentials).
 *
 * Handles preflight OPTIONS automatically — applyCors returns true if
 * it already responded to a preflight, and the calling handler should
 * return immediately in that case.
 *
 * Ref: /plan Phase 0, acceptance criterion #7; /plan Phase 6b (B44 preview).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS = new Set([
  'https://adalegallink.com',
  'https://ada.adalegallink.com',
  'https://preview--ada-claim-legal.base44.app',
  'http://localhost:5173',
  'http://localhost:3000',
]);

/**
 * Apply CORS headers to the response if the request's Origin is allowed.
 * Handles OPTIONS preflight inline — if the request is a preflight, this
 * function sends a 204 and returns true. The handler should return early.
 *
 * Returns true if the response has been finalized (preflight handled).
 * Returns false if the handler should continue processing the request.
 */
export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin;

  // Always set Vary: Origin so the CDN keys cached responses per-origin.
  // Without this, the first request that lands without an Origin header
  // caches a response with NO Access-Control-Allow-Origin, and that cached
  // response then serves browser requests that DO send Origin — those
  // browsers reject the response for missing CORS headers even though
  // Vercel would have returned the right headers on a fresh hit.
  // Cache poisoning by Origin omission.
  res.setHeader('Vary', 'Origin');

  if (typeof origin === 'string' && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Admin-Email',
    );
    res.setHeader('Access-Control-Max-Age', '86400'); // 24h preflight cache
  }

  // Preflight: respond immediately, regardless of whether origin was allowed.
  // (If disallowed, the browser will block the actual request anyway.)
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}
