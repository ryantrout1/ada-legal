/**
 * Photo path rate limiting (/plan Ada rate limits, Phase 3).
 *
 * /api/ada/analyze-photo is the only unauthenticated route on the platform
 * that reaches an Opus vision call. Its session gate restricts it to
 * field-test sessions, but anyone can mint one — POST /api/ada/session with
 * is_test plus the field-capture header is client-side code — so the gate
 * bounds *which sessions* reach the model, not *how many times*. Until this
 * phase there was nothing counting.
 *
 * AC3 (endpoint half): a caller over the ada_photo budget is refused
 * BEFORE the model call. The config half — ada_photo strictly tighter than
 * ada_turn — is pinned in tests/unit/apiRateLimit.test.ts.
 *
 * The assertion that matters is not the 429 itself but
 * `photo.analyze` never being called: a limiter that returns 429 after
 * spending the money would pass a status-code-only test.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const analyze = vi.fn();
const getSystemSetting = vi.fn();
const readSession = vi.fn();
const findAnonSessionByHash = vi.fn();
const countSince = vi.fn();
const record = vi.fn();
const handleUpload = vi.fn();

vi.mock('@vercel/blob/client', () => ({
  handleUpload: (...args: unknown[]) => handleUpload(...args),
}));

vi.mock('../../api/_shared.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/_shared.js')>();
  return {
    ...actual,
    makeClientsFromEnv: () => ({
      db: { getSystemSetting, readSession, findAnonSessionByHash },
      photo: { analyze },
    }),
  };
});

vi.mock('../../src/lib/rateLimit/apiRateLimitStore.js', () => ({
  makeApiRateLimitStore: () => ({
    countSince,
    record,
    prune: vi.fn(async () => 0),
  }),
}));

function makeRes() {
  const headers: Record<string, string> = {};
  const res = {
    statusCode: 200,
    headers,
    setHeader: vi.fn((k: string, v: string) => {
      headers[k.toLowerCase()] = String(v);
    }),
    getHeader: (k: string) => headers[k.toLowerCase()],
    status: vi.fn(function () {
      return res;
    }),
    json: vi.fn(function () {
      return res;
    }),
    end: vi.fn(function () {
      return res;
    }),
  };
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  }) as never;
  res.json = vi.fn((body: unknown) => {
    (res as { body?: unknown }).body = body;
    return res;
  }) as never;
  return res as unknown as VercelResponse & {
    headers: Record<string, string>;
    statusCode: number;
    body?: unknown;
  };
}

function makeReq(): VercelRequest {
  return {
    method: 'POST',
    headers: {
      'x-forwarded-for': '203.0.113.7',
      'user-agent': 'Mozilla/5.0 (Macintosh) Chrome/120.0.0.0',
    },
    body: {
      session_id: '11111111-1111-4111-8111-111111111111',
      photo_url:
        'https://6rojtjcyu498fe5h.public.blob.vercel-storage.com/photos/a/b.jpg',
    },
  } as unknown as VercelRequest;
}

describe('analyze-photo rate limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Photo path enabled — we are testing the limiter, not the kill switch.
    getSystemSetting.mockResolvedValue({ ada_photo_enabled: true });
    // A valid field-test session, so the existing gate passes.
    readSession.mockResolvedValue({
      sessionId: '11111111-1111-4111-8111-111111111111',
      orgId: '22222222-2222-4222-8222-222222222222',
      isTest: true,
    });
    record.mockResolvedValue(undefined);
  });

  it('refuses an over-budget caller before the Opus call (AC3)', async () => {
    // Both windows report the caller at their ceiling.
    countSince.mockResolvedValue(999);
    const handler = (await import('../../api/ada/analyze-photo.js')).default;
    const res = makeRes();

    await handler(makeReq(), res);

    expect(res.statusCode).toBe(429);
    // The assertion with teeth: no money was spent.
    expect(analyze).not.toHaveBeenCalled();
  });

  it('sets Retry-After so a blocked caller knows when to come back', async () => {
    countSince.mockResolvedValue(999);
    const handler = (await import('../../api/ada/analyze-photo.js')).default;
    const res = makeRes();

    await handler(makeReq(), res);

    expect(res.headers['retry-after']).toBeDefined();
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('lets an under-budget caller through to the analyzer', async () => {
    countSince.mockResolvedValue(0);
    analyze.mockRejectedValue(new Error('stop here — reaching the model is the assertion'));
    const handler = (await import('../../api/ada/analyze-photo.js')).default;
    const res = makeRes();

    await handler(makeReq(), res);

    // We do not care what happens after; only that the limiter did not
    // stand in the way of a caller who is within budget.
    expect(analyze).toHaveBeenCalled();
    expect(res.statusCode).not.toBe(429);
  });

  it('does not count a request the kill switch already refused', async () => {
    // Order matters: availability is checked first, so a disabled endpoint
    // costs the caller nothing from their budget. Otherwise a dark photo
    // path would silently drain the allowance of anyone who tried it.
    getSystemSetting.mockResolvedValue({ ada_photo_enabled: false });
    countSince.mockResolvedValue(0);
    const handler = (await import('../../api/ada/analyze-photo.js')).default;
    const res = makeRes();

    await handler(makeReq(), res);

    expect(res.statusCode).toBe(503);
    expect(record).not.toHaveBeenCalled();
  });
});

describe('upload-photo rate limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSystemSetting.mockResolvedValue({ ada_photo_enabled: true });
    findAnonSessionByHash.mockResolvedValue('33333333-3333-4333-8333-333333333333');
    record.mockResolvedValue(undefined);
    handleUpload.mockResolvedValue({ type: 'blob.generate-client-token' });
  });

  function uploadReq(body: unknown, withCookie = true): VercelRequest {
    return {
      method: 'POST',
      headers: {
        'x-forwarded-for': '203.0.113.7',
        'user-agent': 'Mozilla/5.0 (Macintosh) Chrome/120.0.0.0',
        ...(withCookie ? { cookie: 'ada_anon=sometoken' } : {}),
      },
      body,
    } as unknown as VercelRequest;
  }

  it('refuses an over-budget token request before minting an upload token', async () => {
    countSince.mockResolvedValue(999);
    const handler = (await import('../../api/ada/upload-photo.js')).default;
    const res = makeRes();

    await handler(uploadReq({ type: 'blob.generate-client-token' }), res);

    expect(res.statusCode).toBe(429);
    expect(handleUpload).not.toHaveBeenCalled();
  });

  it('never throttles the Vercel Blob completion callback', async () => {
    // This is the branch that must not be touched. It is server-to-server,
    // carries no user cookie, and completes an upload that was ALREADY
    // authorized. Throttling it would strand a legitimate upload that the
    // user has finished paying the wait for — and would do so on an IP
    // that belongs to Vercel, not the caller. The existing kill switch
    // makes the same distinction for the same reason.
    countSince.mockResolvedValue(999);
    const handler = (await import('../../api/ada/upload-photo.js')).default;
    const res = makeRes();

    await handler(uploadReq({ type: 'blob.upload-completed' }, false), res);

    expect(res.statusCode).not.toBe(429);
    expect(countSince).not.toHaveBeenCalled();
    expect(handleUpload).toHaveBeenCalled();
  });

  it('does not spend budget on a caller with no valid anon cookie', async () => {
    // A 401 costs one hashed lookup and no model work, so an unauthenticated
    // caller should not be able to burn the allowance of real users sharing
    // their IP — libraries, clinics and care facilities are exactly where
    // this product matters most.
    findAnonSessionByHash.mockResolvedValue(null);
    countSince.mockResolvedValue(0);
    const handler = (await import('../../api/ada/upload-photo.js')).default;
    const res = makeRes();

    await handler(uploadReq({ type: 'blob.generate-client-token' }), res);

    expect(res.statusCode).toBe(401);
    expect(record).not.toHaveBeenCalled();
  });
});
