/**
 * Public API rate limiter (M2 Phase 4 follow-up, Phase 1).
 *
 * AC-1  Over the limit is refused before any model call.
 * AC-2  Under the limit is unaffected.
 * AC-3  The window slides — no fixed-bucket reset everyone races.
 * AC-4  No raw IP is stored.
 * AC-5  A limiter-store failure fails OPEN (the flag is what fails closed).
 */

import { describe, it, expect, vi } from 'vitest';
import {
  ADA_PHOTO_BUCKET,
  ADA_SESSION_BUCKET,
  ADA_TURN_BUCKET,
  GUIDE_ASSISTANT_BUCKET,
  RATE_LIMITS,
  checkRateLimit,
  decideRateLimit,
  windowStart,
} from '../../src/lib/rateLimit/apiRateLimit.js';

describe('decideRateLimit', () => {
  it('allows while under the limit', () => {
    expect(decideRateLimit(0, 10)).toBe('allowed');
    expect(decideRateLimit(9, 10)).toBe('allowed');
  });

  it('blocks at and beyond the limit', () => {
    expect(decideRateLimit(10, 10)).toBe('blocked');
    expect(decideRateLimit(99, 10)).toBe('blocked');
  });

  it('treats a nonsensical count as blocked rather than allowed', () => {
    // A negative or NaN count means the counting query misbehaved. Guessing
    // "allowed" there is how a limiter silently stops limiting.
    expect(decideRateLimit(Number.NaN, 10)).toBe('blocked');
    expect(decideRateLimit(-1, 10)).toBe('blocked');
  });
});

describe('windowStart', () => {
  it('slides with the clock rather than snapping to a fixed bucket', () => {
    const now = new Date('2026-07-23T10:07:30Z');
    expect(windowStart(now, 10 * 60_000).toISOString()).toBe('2026-07-23T09:57:30.000Z');
  });

  it('moves as time passes', () => {
    const w1 = windowStart(new Date('2026-07-23T10:00:00Z'), 60_000);
    const w2 = windowStart(new Date('2026-07-23T10:00:30Z'), 60_000);
    expect(w2.getTime()).toBeGreaterThan(w1.getTime());
  });
});

describe('limits', () => {
  it('configures the guide assistant generously enough for a real reader', () => {
    // Shared IPs are common (offices, schools, libraries) and this is a soft
    // throttle, not an auth boundary — false positives cost more than a few
    // extra questions do.
    expect(RATE_LIMITS[GUIDE_ASSISTANT_BUCKET].short.max).toBe(10);
    expect(RATE_LIMITS[GUIDE_ASSISTANT_BUCKET].short.windowMs).toBe(10 * 60_000);
    expect(RATE_LIMITS[GUIDE_ASSISTANT_BUCKET].long.max).toBe(60);
    expect(RATE_LIMITS[GUIDE_ASSISTANT_BUCKET].long.windowMs).toBe(24 * 60 * 60_000);
  });

  // ── Ada buckets (/plan Ada rate limits, Phase 1) ───────────────────────────
  // Ada's four public endpoints ship with no limiter at all today. These
  // pin the registered shape; the endpoints are wired in Phases 2 and 3.

  it('registers a bucket for each Ada surface', () => {
    for (const bucket of [ADA_SESSION_BUCKET, ADA_TURN_BUCKET, ADA_PHOTO_BUCKET]) {
      expect(RATE_LIMITS[bucket], `missing bucket: ${bucket}`).toBeDefined();
    }
  });

  it('sets conversation limits above what a real intake needs', () => {
    // Observed sessions average ~4 user turns; the longest ran 56. A person
    // working through a hard situation must never hit this.
    expect(RATE_LIMITS[ADA_TURN_BUCKET].short.max).toBe(30);
    expect(RATE_LIMITS[ADA_TURN_BUCKET].short.windowMs).toBe(10 * 60_000);
    expect(RATE_LIMITS[ADA_TURN_BUCKET].long.max).toBe(200);
    expect(RATE_LIMITS[ADA_TURN_BUCKET].long.windowMs).toBe(24 * 60 * 60_000);

    expect(RATE_LIMITS[ADA_SESSION_BUCKET].short.max).toBe(5);
    expect(RATE_LIMITS[ADA_SESSION_BUCKET].short.windowMs).toBe(60 * 60_000);
    expect(RATE_LIMITS[ADA_SESSION_BUCKET].long.max).toBe(20);
  });

  it('holds the photo path to a tighter budget than chat (AC3)', () => {
    // A photo analysis is an Opus vision call — orders of magnitude more
    // expensive than a chat turn. This ordering is the invariant; the exact
    // numbers are tunable. If someone loosens photo past chat, that is a bug.
    expect(RATE_LIMITS[ADA_PHOTO_BUCKET].short.max).toBeLessThan(
      RATE_LIMITS[ADA_TURN_BUCKET].short.max,
    );
    expect(RATE_LIMITS[ADA_PHOTO_BUCKET].long.max).toBeLessThan(
      RATE_LIMITS[ADA_TURN_BUCKET].long.max,
    );
    expect(RATE_LIMITS[ADA_PHOTO_BUCKET].short.max).toBe(3);
    expect(RATE_LIMITS[ADA_PHOTO_BUCKET].long.max).toBe(10);
  });
});

describe('checkRateLimit', () => {
  const key = 'a'.repeat(64);

  function store(counts: number[], opts: { throwOn?: 'count' | 'record' } = {}) {
    const calls: Array<{ bucket: string; key: string; ipHash: string | null }> = [];
    let i = 0;
    return {
      calls,
      countSince: vi.fn(async () => {
        if (opts.throwOn === 'count') throw new Error('db down');
        return counts[i++] ?? 0;
      }),
      record: vi.fn(async (row: { bucket: string; key: string; ipHash: string | null }) => {
        if (opts.throwOn === 'record') throw new Error('db down');
        calls.push(row);
      }),
      prune: vi.fn(async () => 0),
    };
  }

  it('allows and records when under both windows', async () => {
    const s = store([0, 0]);
    const result = await checkRateLimit(s, GUIDE_ASSISTANT_BUCKET, key);
    expect(result.allowed).toBe(true);
    expect(s.record).toHaveBeenCalledOnce();
  });

  it('blocks when the short window is exhausted', async () => {
    const s = store([10, 0]);
    const result = await checkRateLimit(s, GUIDE_ASSISTANT_BUCKET, key);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('blocks when the daily window is exhausted even if the short one is clear', async () => {
    const s = store([0, 60]);
    const result = await checkRateLimit(s, GUIDE_ASSISTANT_BUCKET, key);
    expect(result.allowed).toBe(false);
  });

  it('does not record a request it blocked', async () => {
    // Recording blocked attempts would let a script keep its own window
    // permanently full, turning a 10-minute cooldown into a lockout.
    const s = store([10, 0]);
    await checkRateLimit(s, GUIDE_ASSISTANT_BUCKET, key);
    expect(s.record).not.toHaveBeenCalled();
  });

  it.each([ADA_SESSION_BUCKET, ADA_TURN_BUCKET, ADA_PHOTO_BUCKET])(
    'does not record a blocked request on the %s bucket (AC5)',
    async (bucket) => {
      // Same lockout reasoning as the guide bucket, pinned per Ada bucket so
      // a future config edit cannot quietly regress it.
      const s = store([RATE_LIMITS[bucket].short.max, 0]);
      const result = await checkRateLimit(s, bucket, key);
      expect(result.allowed).toBe(false);
      expect(s.record).not.toHaveBeenCalled();
    },
  );

  it('stores only the hashed key and a short prefix — never a raw IP', async () => {
    const s = store([0, 0]);
    await checkRateLimit(s, GUIDE_ASSISTANT_BUCKET, key);
    const row = s.calls[0];
    expect(row.key).toBe(key);
    expect(row.ipHash).toBe(key.slice(0, 16));
    expect(JSON.stringify(row)).not.toMatch(/\d{1,3}(\.\d{1,3}){3}/);
  });

  it('fails OPEN when the store cannot be counted', async () => {
    // The flag is what fails closed. Taking a working feature down over a
    // transient DB error would trade a bounded cost risk for an outage.
    const s = store([], { throwOn: 'count' });
    const result = await checkRateLimit(s, GUIDE_ASSISTANT_BUCKET, key);
    expect(result.allowed).toBe(true);
    expect(result.degraded).toBe(true);
  });

  it('still serves the request when only the write fails', async () => {
    const s = store([0, 0], { throwOn: 'record' });
    const result = await checkRateLimit(s, GUIDE_ASSISTANT_BUCKET, key);
    expect(result.allowed).toBe(true);
  });
});

describe('endpoint ordering', () => {
  it('runs the limiter before opening the stream', async () => {
    // A 429 must be a clean JSON status. Once SSE headers are written the
    // status is already 200 and the rejection has to travel as an event.
    const src = await import('node:fs').then((fs) =>
      fs.readFileSync(
        new URL('../../api/public/guide-assistant.ts', import.meta.url),
        'utf8',
      ),
    );
    const limiterAt = src.indexOf('checkRateLimit');
    const headerAt = src.indexOf("setHeader('Content-Type', 'text/event-stream");
    const streamAt = src.indexOf('clients.ai.stream');
    expect(limiterAt).toBeGreaterThan(-1);
    expect(limiterAt).toBeLessThan(headerAt);
    expect(limiterAt).toBeLessThan(streamAt);
  });
});
