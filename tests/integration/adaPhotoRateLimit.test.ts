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
