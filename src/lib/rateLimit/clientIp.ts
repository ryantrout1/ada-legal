/**
 * Caller IP derivation for rate-limit identity.
 *
 * This lived as two byte-identical private copies — one in
 * api/public/guide-assistant.ts, one in api/spot/analyze.ts. Wiring Ada's
 * four public endpoints would have made it six. Extracted so there is one
 * definition to reason about and one place to change if Vercel's proxy
 * header handling ever shifts.
 *
 * Behavior is unchanged from both copies, deliberately: this is a
 * refactor, and the tests in tests/unit/clientIp.test.ts pin the old
 * contract so the move can be shown to be behavior-neutral.
 *
 * NOT A SECURITY BOUNDARY. `x-forwarded-for` is caller-influenced and this
 * feeds a soft throttle, not an auth check — see apiRateLimit.ts for the
 * full posture. The fallback is '0.0.0.0', which collapses every
 * unidentifiable caller into a single shared identity. That fails toward
 * throttling them together rather than exempting them, which is the safer
 * direction for a limiter.
 */

import type { VercelRequest } from '@vercel/node';

/** Leftmost hop in x-forwarded-for, or '0.0.0.0' when there isn't one. */
export function clientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  const raw = Array.isArray(fwd) ? fwd[0] : fwd;
  return raw?.split(',')[0]?.trim() || '0.0.0.0';
}
