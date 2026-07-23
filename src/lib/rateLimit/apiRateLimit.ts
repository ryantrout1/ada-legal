/**
 * Public API rate limiting.
 *
 * The guide assistant is the platform's first public, unauthenticated,
 * per-request-billed endpoint. Its kill switch (`guide_assistant_enabled`)
 * is real protection, but it is one Neon upsert away from off, and whoever
 * flips it a year from now will not remember that nothing else stood
 * behind it. This is that something else.
 *
 * SHAPE: two sliding windows per identity — a short one that stops a burst
 * and a daily one that stops a slow drip. A request must clear both.
 *
 * NOT A SECURITY BOUNDARY. The identity is derived from IP plus a coarsened
 * user agent (see spotRateLimitKey.ts), which a determined caller can
 * rotate. It is a soft throttle: it makes casual abuse pointless and
 * bounds the blast radius of a script that finds the endpoint. Anything
 * stronger would need accounts or a captcha, both of which cost real
 * accessibility for the readers this product exists for.
 *
 * FAILURE POSTURE. The limiter fails OPEN; the kill switch fails CLOSED.
 * That split is deliberate. An unreadable flag means we do not know whether
 * we are allowed to spend, so we decline. An unreachable rate-limit table
 * means we cannot count — but the spend is already bounded by max_tokens
 * and by the flag being on at all, so taking a working feature down over a
 * transient database blip trades a bounded cost risk for an outage. The
 * degraded case is surfaced on the result so a caller can log it.
 */

/** Windows are per bucket so a future endpoint can pick its own shape. */
export interface RateLimitWindow {
  windowMs: number;
  max: number;
}

export interface RateLimitConfig {
  short: RateLimitWindow;
  long: RateLimitWindow;
}

export const GUIDE_ASSISTANT_BUCKET = 'guide_assistant';

/**
 * Deliberately generous. Shared IPs are the norm in exactly the places
 * this guide matters most — offices, schools, libraries, clinics — and a
 * reader working through a chapter can legitimately ask several questions
 * in a row. A false block reads as "the site is broken"; a few extra
 * questions cost fractions of a cent.
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  [GUIDE_ASSISTANT_BUCKET]: {
    short: { windowMs: 10 * 60_000, max: 10 },
    long: { windowMs: 24 * 60 * 60_000, max: 60 },
  },
};

export type RateLimitOutcome = 'allowed' | 'blocked';

export interface RateLimitRow {
  bucket: string;
  key: string;
  ipHash: string | null;
}

export interface RateLimitStore {
  countSince(bucket: string, key: string, since: Date): Promise<number>;
  record(row: RateLimitRow): Promise<void>;
  prune(before: Date): Promise<number>;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  /** True when the decision was made without a working store. */
  degraded: boolean;
}

/**
 * Pure decision. A count that is negative or not a number means the query
 * misbehaved; treating that as "allowed" is how a limiter silently stops
 * limiting, so it blocks instead.
 */
export function decideRateLimit(countInWindow: number, max: number): RateLimitOutcome {
  if (!Number.isFinite(countInWindow) || countInWindow < 0) return 'blocked';
  return countInWindow < max ? 'allowed' : 'blocked';
}

/** Start of a window that slides with the clock (no fixed-bucket reset). */
export function windowStart(now: Date, windowMs: number): Date {
  return new Date(now.getTime() - windowMs);
}

/**
 * Check both windows and, when allowed, record the request.
 *
 * Blocked requests are NOT recorded. If they were, a script hammering the
 * endpoint would keep its own window permanently saturated and a ten-minute
 * cooldown would become an indefinite lockout — punishing the one caller
 * who might be a real person behind a shared IP.
 */
export async function checkRateLimit(
  store: RateLimitStore,
  bucket: string,
  key: string,
  now: Date = new Date(),
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[bucket];
  if (!config) {
    // An unconfigured bucket is a programming error, not a caller's fault.
    return { allowed: true, retryAfterSeconds: 0, degraded: true };
  }

  let shortCount: number;
  let longCount: number;
  try {
    shortCount = await store.countSince(bucket, key, windowStart(now, config.short.windowMs));
    longCount = await store.countSince(bucket, key, windowStart(now, config.long.windowMs));
  } catch {
    return { allowed: true, retryAfterSeconds: 0, degraded: true };
  }

  if (decideRateLimit(shortCount, config.short.max) === 'blocked') {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(config.short.windowMs / 1000),
      degraded: false,
    };
  }
  if (decideRateLimit(longCount, config.long.max) === 'blocked') {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(config.long.windowMs / 1000),
      degraded: false,
    };
  }

  try {
    await store.record({ bucket, key, ipHash: key.slice(0, 16) });
  } catch {
    // Losing the write costs accuracy on the next request, not correctness
    // on this one. Serving the reader matters more.
    return { allowed: true, retryAfterSeconds: 0, degraded: true };
  }

  return { allowed: true, retryAfterSeconds: 0, degraded: false };
}
